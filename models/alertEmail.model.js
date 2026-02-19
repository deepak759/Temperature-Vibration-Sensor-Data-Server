import mongoose from "mongoose";

const AlertEmailSchema = new mongoose.Schema(
  {
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant",
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

// Ensure unique email per plant
AlertEmailSchema.index({ plantId: 1, email: 1 }, { unique: true });

export default mongoose.model("AlertEmail", AlertEmailSchema);
