import EventEmitter from "events";
import { modbus } from "../config/modbus.js";
import VibrationReading from "../models/VibrationReading.js";

const IS_BASE0 =
  String(process.env.IS_BASE0 || "true").toLowerCase() === "true";
const SCALE_ACCEL = Number(process.env.SCALE_ACCEL || 1);
const SCALE_VELOCITY = Number(process.env.SCALE_VELOCITY || 1);
const SCALE_CREST = Number(process.env.SCALE_CREST || 0.01);
const POLL_MS = Number(process.env.POLL_MS || 1000);

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

    // Bubble up Modbus connection state

    modbus.on("connected", () => {
      console.log("[MODBUS] Connection OK");
      this.emit("status", { ok: true });
    });

    modbus.on("error", (err) =>
      this.emit("status", { ok: false, error: err.message })
    );
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

    const sample = {
      ok: true,
      at: new Date(),
      values,
      raw
    };

    // ✅ save to MongoDB
    // await VibrationReading.create({
    //   ...values,
    // });

    // ✅ send to websocket
    this.emit("data", sample);

      console.log("[MODBUS PARSED]", raw);
    } catch (err) {
      console.error("[MODBUS READ ERROR]", err.message);
    } finally {
      this.reading = false;
    }
  }

  getLatest() {
    return this.latest || { ok: false, error: "No data yet" };
  }
}

export const vibrationService = new VibrationService();
