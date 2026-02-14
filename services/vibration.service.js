import EventEmitter from "events";
import { modbus } from "../config/modbus.js";
import VibrationReading from "../models/VibrationReading.js";
import { sendMail, sendVibrationAlert } from "./mailService.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const IS_BASE0 =
  String(process.env.IS_BASE0 || "true").toLowerCase() === "true";
const SCALE_ACCEL = Number(process.env.SCALE_ACCEL || 1);
const SCALE_VELOCITY = Number(process.env.SCALE_VELOCITY || 1);
const SCALE_CREST = Number(process.env.SCALE_CREST || 0.01);
const POLL_MS = Number(process.env.POLL_MS || 1000);

// Alert thresholds for velocity RMS (mm/s)
const VELOCITY_THRESHOLDS = {
  WARNING_MIN: Number(process.env.WARNING_MIN) || 100,
  WARNING_MAX: Number(process.env.WARNING_MAX) || 200,
  CRITICAL_MIN: Number(process.env.CRITICAL_MIN) || 200
};

// Cooldown period for alerts (5 minutes in milliseconds)
const ALERT_COOLDOWN_MS = Number(process.env.ALERT_COOLDOWN_MS) || 5 * 60 * 1000;

// Track last alert times for each equipment/location
const lastAlertTimes = new Map();

// --- Register map from iSN-713 quick start (Input Registers, 3xxxx) ---
// Confirm against your device firmware; this is a common set.
const REG = {
  ACC_RMS: 30023,
  ACC_MAX: 30024,
  ACC_PP: 30025,
  CREST: 30026,
  VEL_RMS: 30027,
};

const toPDU = (human) => human - (IS_BASE0 ? 30001 : 30002);
const START_HUMAN = REG.ACC_RMS; // 30023
const END_HUMAN = REG.VEL_RMS; // 30027
const START_PDU = toPDU(START_HUMAN); // 22
const LEN = END_HUMAN - START_HUMAN + 1; // 5
// 5 regs

class VibrationService extends EventEmitter {
  constructor() {
    super();
    this.latest = null;
    this.timer = null;
    
    // Reload environment variables in constructor
    this.reloadConfig();
    
    console.log("VibrationService initialized for:", {
      equipmentId: this.equipmentId,
      location: this.location,
      thresholds: VELOCITY_THRESHOLDS,
      cooldown: ALERT_COOLDOWN_MS
    });

    // Bubble up Modbus connection state
    modbus.on("connected", () => {
      console.log("[MODBUS] Connection OK");
      this.emit("status", { ok: true });
    });

    modbus.on("error", (err) =>
      this.emit("status", { ok: false, error: err.message }),
    );
  }

  // Method to reload configuration from environment variables
  reloadConfig() {
    // Reload dotenv to get latest environment variables
    dotenv.config({ override: true });
    
    this.equipmentId = process.env.EQUIPMENT_ID || "DEFAULT-001";
    this.location = process.env.LOCATION || "Default Location";
    this.alertRecipient = process.env.ALERT_RECIPIENT || "alltechnify@gmail.com";
    
    // Update thresholds from env if available
    if (process.env.WARNING_MIN) {
      VELOCITY_THRESHOLDS.WARNING_MIN = Number(process.env.WARNING_MIN);
    }
    if (process.env.WARNING_MAX) {
      VELOCITY_THRESHOLDS.WARNING_MAX = Number(process.env.WARNING_MAX);
    }
    if (process.env.CRITICAL_MIN) {
      VELOCITY_THRESHOLDS.CRITICAL_MIN = Number(process.env.CRITICAL_MIN);
    }
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.poll().catch(() => {}), POLL_MS);
    // Kick immediate
    this.poll().catch(() => {});
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  // Check if we should send alert based on cooldown
  shouldSendAlert(alertKey, alertLevel) {
    const now = Date.now();
    const lastAlert = lastAlertTimes.get(alertKey);
    
    if (!lastAlert || (now - lastAlert) > ALERT_COOLDOWN_MS) {
      // Update last alert time
      lastAlertTimes.set(alertKey, now);
      return true;
    }
    
    console.log(`[ALERT COOLDOWN] Skipping ${alertLevel} alert for ${alertKey} - last alert was ${(now - lastAlert) / 1000}s ago`);
    return false;
  }

  // Check velocity RMS and determine alert level
  checkVelocityAlert(velocityRMS) {
    if (velocityRMS > VELOCITY_THRESHOLDS.CRITICAL_MIN) {
      return 'critical';
    } else if (velocityRMS >= VELOCITY_THRESHOLDS.WARNING_MIN && velocityRMS <= VELOCITY_THRESHOLDS.WARNING_MAX) {
      return 'warning';
    }
    return null;
  }

  async poll() {
    // Debug: Print current environment values
    console.log("[ENV CHECK]", {
      EQUIPMENT_ID: process.env.EQUIPMENT_ID,
      LOCATION: process.env.LOCATION,
      current_equipmentId: this.equipmentId,
      current_location: this.location
    });

    if (this.reading) return; // 🔒 prevent overlap
    this.reading = true;

    console.log("[POLL] polling at", new Date().toISOString());

    try {
      const res = await modbus.readInput(START_PDU, LEN);

      console.log("[MODBUS RAW]", res.data);

      const r = res.data;
      const raw = {
        [REG.ACC_RMS]: r[0],
        [REG.ACC_MAX]: r[1],
        [REG.ACC_PP]: r[2],
        [REG.CREST]: r[3],
        [REG.VEL_RMS]: r[4],
      };

      // Calculate velocity RMS in mm/s (assuming raw value is in 0.01 mm/s increments)
      const velocityRMS = r[4] * 0.01; // Convert to mm/s

      const values = {
      accel: {
        rms: r[0],               // mg
        max: r[1],               // mg
        peakToPeak: r[2]         // mg
      },
      crestFactor: r[3] * 0.01,
      velocity: {
        rms: r[4] * 0.01         // mm/s
      }
    };

      // Check velocity RMS against thresholds
      const alertLevel = this.checkVelocityAlert(velocityRMS);
      
      if (alertLevel) {
        // Create a unique key for this alert type and equipment
        const alertKey = `${this.equipmentId}-${alertLevel}`;
        
        // Check cooldown before sending alert
        if (this.shouldSendAlert(alertKey, alertLevel)) {
          const vibrationData = {
            value: velocityRMS,
            location: this.location,
            equipmentId: this.equipmentId,
            additionalInfo: `Velocity RMS: ${velocityRMS.toFixed(2)} mm/s | Raw Value: ${r[4]}`,
            timestamp: new Date().toISOString(),
            thresholds: VELOCITY_THRESHOLDS
          };

          const limitValue = alertLevel === 'critical' 
            ? VELOCITY_THRESHOLDS.CRITICAL_MIN 
            : VELOCITY_THRESHOLDS.WARNING_MAX;

          console.log(`[ALERT] Sending ${alertLevel.toUpperCase()} alert - Velocity RMS: ${velocityRMS.toFixed(2)} mm/s`);
          console.log("[ALERT DATA]", {
            equipmentId: this.equipmentId,
            location: this.location,
            recipient: this.alertRecipient
          });

          // Send email alert
          await sendVibrationAlert(
            this.alertRecipient,
            vibrationData,
            limitValue,
            alertLevel
          );

          

          // Emit alert event for websocket if needed
          this.emit("alert", {
            level: alertLevel,
            velocityRMS,
            thresholds: VELOCITY_THRESHOLDS,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log(`[NORMAL] Velocity RMS: ${velocityRMS.toFixed(2)} mm/s (within limits)`);
      }

      // Save to MongoDB
      // await VibrationReading.create({
      //   ...values,
      //   equipmentId: this.equipmentId,
      //   location: this.location,
      //   alertLevel: alertLevel || 'normal'
      // });

      // Prepare sample data for websocket
       const sample = {
      ok: true,
      at: new Date(),
      values,
     
    };

      // Send to websocket
      this.emit("data",sample );

      console.log("[MODBUS PARSED]", {
        ...raw,
        velocityRMS: `${velocityRMS.toFixed(2)} mm/s`,
        alertLevel: alertLevel || 'normal',
        equipmentId: this.equipmentId,
        location: this.location
      });
      
    } catch (err) {
      console.error("[MODBUS READ ERROR]", err.message);
    } finally {
      this.reading = false;
    }
  }

  getLatest() {
    return this.latest || { ok: false, error: "No data yet" };
  }

  // Method to update configuration manually
  updateConfig(config) {
    if (config.equipmentId) {
      this.equipmentId = config.equipmentId;
    }
    if (config.location) {
      this.location = config.location;
    }
    if (config.alertRecipient) {
      this.alertRecipient = config.alertRecipient;
    }
    console.log("[CONFIG UPDATED]", {
      equipmentId: this.equipmentId,
      location: this.location,
      alertRecipient: this.alertRecipient
    });
  }

  // Method to update thresholds dynamically
  updateThresholds(newThresholds) {
    if (newThresholds.WARNING_MIN !== undefined) {
      VELOCITY_THRESHOLDS.WARNING_MIN = newThresholds.WARNING_MIN;
    }
    if (newThresholds.WARNING_MAX !== undefined) {
      VELOCITY_THRESHOLDS.WARNING_MAX = newThresholds.WARNING_MAX;
    }
    if (newThresholds.CRITICAL_MIN !== undefined) {
      VELOCITY_THRESHOLDS.CRITICAL_MIN = newThresholds.CRITICAL_MIN;
    }
    console.log("[THRESHOLDS UPDATED]", VELOCITY_THRESHOLDS);
  }
}

export const vibrationService = new VibrationService();