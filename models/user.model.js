import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,

      trim: true
    },

    password: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    emailOTP: {
      type: Number,
    },

    otpExpiry: {
      type: Date,
    },

    emailVerified: {
      type: Boolean,
      default: false,
      index: true
    },

    accessToken: {
      type: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    deleteAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }
    },

    role: {
      type: String,
      enum: ["godadmin", "admin", "viewer"],
      default: "viewer"
    },

    // Plant access mapping: { plantId: role }
    // For godadmin: this can be empty or contain all plants
    // For admin: contains plants where user is admin
    // For viewer: contains plants user can view
    plantAccess: {
      type: Map,
      of: String, // "admin" or "viewer"
      default: {}
    }

  },
  {
    versionKey: false,
    timestamps: true
  }
);

export default mongoose.model("User", UserSchema);
