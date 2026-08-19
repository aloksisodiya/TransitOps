import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: false,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Please specify a vehicle"],
    },
    toll: {
      type: Number,
      required: true,
      default: 0,
    },
    other: {
      type: Number,
      required: true,
      default: 0,
    },
    maintenanceCost: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Expense", ExpenseSchema);
