import mongoose from "mongoose";

const TripSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      required: [true, "Please add a unique trip identifier"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    source: {
      type: String,
      required: [true, "Please specify start location"],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Please specify destination"],
      trim: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: false, // Optional for 'Draft' state (awaiting vehicle)
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: false, // Optional for 'Draft' state (awaiting driver)
    },
    cargoWeightKg: {
      type: Number,
      required: [true, "Please specify cargo weight in kg"],
    },
    plannedDistanceKm: {
      type: Number,
      required: [true, "Please specify planned distance in km"],
    },
    status: {
      type: String,
      enum: ["Draft", "Dispatched", "Completed", "Cancelled"],
      default: "Draft",
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Trip", TripSchema);
