import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add driver name"],
      trim: true,
    },
    licenseNo: {
      type: String,
      required: [true, "Please add driver license number"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    licenseCategory: {
      type: String,
      required: [true, "Please add license category"],
      enum: ["LMV", "HMV"],
      default: "LMV",
    },
    licenseExpiry: {
      type: Date,
      required: [true, "Please add license expiry date"],
    },
    contact: {
      type: String,
      required: [true, "Please add contact number"],
      trim: true,
    },
    tripCompletionPct: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    safetyScore: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["Available", "OnTrip", "OffDuty", "Suspended"],
      default: "Available",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Driver", DriverSchema);
