import mongoose from "mongoose";

const VibrationSchema = new mongoose.Schema({
  accel: {
    rms: Number,        // mg
    max: Number,        // mg
    peakToPeak: Number // mg
  },
  velocity: {
    rms: Number         // mm/s
  },
  crestFactor: Number,

  raw: {
    type: Object
  },

  device: {
    type: String,
    default: "iSN-713"
  },

  at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("VibrationReading", VibrationSchema);
