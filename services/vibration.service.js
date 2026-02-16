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
    this.alertQueue = []; // Queue for pending alerts
    this.isProcessingQueue = false;
    
    // Reload environment variables in constructor
    this.reloadConfig();
    
    console.log("VibrationService initialized for:", {
      equipmentId: this.equipmentId,
      location: this.location,
      recipients: this.alertRecipients,
      thresholds: VELOCITY_THRESHOLDS,
      cooldown: ALERT_COOLDOWN_MS
    });

    // Start queue processor
    this.processAlertQueue();

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
    
    // Parse multiple email recipients from environment variable
    // Can be comma-separated or space-separated
    const recipientsStr = process.env.ALERT_RECIPIENTS;
    this.alertRecipients = recipientsStr
      .split(/[,\s]+/)
      .map(email => email.trim())
      .filter(email => email.includes('@'));
    
    // Also support single recipient for backward compatibility
    if (process.env.ALERT_RECIPIENT && !this.alertRecipients.length) {
      this.alertRecipients = [process.env.ALERT_RECIPIENT];
    }
    
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

  // Queue alert for parallel processing
  queueAlert(alertData) {
    this.alertQueue.push({
      ...alertData,
      queuedAt: Date.now()
    });
    console.log(`[ALERT QUEUED] Queue size: ${this.alertQueue.length}`);
  }

  // Process alert queue in background
  async processAlertQueue() {
    while (true) {
      if (this.alertQueue.length > 0 && !this.isProcessingQueue) {
        this.isProcessingQueue = true;
        const alert = this.alertQueue.shift();
        
        try {
          console.log(`[PROCESSING ALERT] Sending to ${alert.recipients.length} recipients`);
          
          // Send emails in parallel to all recipients
          const emailPromises = alert.recipients.map(recipient => 
            sendVibrationAlert(
              recipient,
              alert.vibrationData,
              alert.limitValue,
              alert.alertLevel
            ).catch(error => {
              console.error(`[EMAIL ERROR] Failed to send to ${recipient}:`, error.message);
              return null; // Don't fail other emails
            })
          );

         

          // Wait for all emails to complete (or fail) in parallel
          const results = await Promise.allSettled(emailPromises);
          
          const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
          const failed = results.filter(r => r.status === 'rejected' || !r.value).length;
          
          console.log(`[ALERT COMPLETE] Success: ${successful}, Failed: ${failed}`);

          // Emit alert event for websocket
          this.emit("alert", {
            level: alert.alertLevel,
            velocityRMS: alert.vibrationData.value,
            thresholds: VELOCITY_THRESHOLDS,
            timestamp: new Date().toISOString(),
            recipients: alert.recipients.length
          });

        } catch (error) {
          console.error("[QUEUE PROCESSING ERROR]", error.message);
        } finally {
          this.isProcessingQueue = false;
        }
      }
      
      // Small delay to prevent CPU spinning
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async poll() {
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
        
        // Check cooldown before queueing alert
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

          console.log(`[ALERT TRIGGERED] ${alertLevel.toUpperCase()} - Velocity RMS: ${velocityRMS.toFixed(2)} mm/s`);
          console.log("[ALERT DATA]", {
            equipmentId: this.equipmentId,
            location: this.location,
            recipients: this.alertRecipients
          });

          // Queue alert for background processing (non-blocking)
          this.queueAlert({
            recipients: this.alertRecipients,
            vibrationData,
            limitValue,
            alertLevel,
            sendLegacy: true // Set to false if you don't want legacy emails
          });
        }
      } else {
        console.log(`[NORMAL] Velocity RMS: ${velocityRMS.toFixed(2)} mm/s (within limits)`);
      }

      // Save to MongoDB (non-blocking - don't await)
      // VibrationReading.create({
      //   ...values
       
      // }).catch(err => console.error("[DB SAVE ERROR]", err.message));

      // Prepare sample data for websocket
      const sample = {
        ok: true,
        at: new Date(),
        values,
      };

      // Send to websocket
      this.emit("data", sample);

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
    if (config.alertRecipients) {
      this.alertRecipients = Array.isArray(config.alertRecipients) 
        ? config.alertRecipients 
        : [config.alertRecipients];
    }
    console.log("[CONFIG UPDATED]", {
      equipmentId: this.equipmentId,
      location: this.location,
      alertRecipients: this.alertRecipients
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