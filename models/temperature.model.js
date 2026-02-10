import mongoose from "mongoose";

const tempSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    temperature: { type: Number, required: true },
    source: { type: String, enum: ["http", "socket", "device", "dummy"], default: "http" }
  },
  { versionKey: false }
);

// optional TTL index
// tempSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

export default mongoose.model("Temperature", tempSchema);
