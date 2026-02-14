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

timestamp: { type: Date, default: Date.now, index: true },

  


},{
  versionKey: false
});

export default mongoose.model("VibrationReading", VibrationSchema);
