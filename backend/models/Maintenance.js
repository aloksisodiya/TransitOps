import mongoose from "mongoose";

const MaintenanceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Please specify a vehicle"],
    },
    serviceType: {
      type: String,
      required: [true, "Please specify service type"],
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, "Please specify cost"],
    },
    date: {
      type: Date,
      required: [true, "Please specify date"],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Maintenance", MaintenanceSchema);
