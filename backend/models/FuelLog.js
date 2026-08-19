import mongoose from "mongoose";

const FuelLogSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Please specify a vehicle"],
    },
    date: {
      type: Date,
      required: [true, "Please specify date"],
      default: Date.now,
    },
    liters: {
      type: Number,
      required: [true, "Please specify fuel volume in liters"],
    },
    cost: {
      type: Number,
      required: [true, "Please specify fuel cost"],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("FuelLog", FuelLogSchema);
