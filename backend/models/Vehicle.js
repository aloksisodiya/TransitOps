import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
  {
    registrationNo: {
      type: String,
      required: [true, "Please add a registration number"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Please add a model name/model"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Please specify vehicle type"],
      enum: ["Van", "Truck", "Mini", "Container", "Flatbed"],
      default: "Truck",
    },
    capacityKg: {
      type: Number,
      required: [true, "Please specify cargo capacity in kg"],
    },
    odometerKm: {
      type: Number,
      required: [true, "Please specify odometer value in km"],
      default: 0,
    },
    acquisitionCost: {
      type: Number,
      required: [true, "Please specify acquisition cost"],
    },
    status: {
      type: String,
      enum: ["Available", "OnTrip", "InShop", "Retired"],
      default: "Available",
    },
    documents: [
      {
        name: {
          type: String,
          required: [true, "Please add a document name"],
        },
        type: {
          type: String,
          enum: [
            "Insurance",
            "Registration",
            "Permit",
            "Fitness",
            "PUC",
            "Other",
          ],
          required: [true, "Please specify document type"],
        },
        documentNo: {
          type: String,
          default: "",
        },
        issueDate: {
          type: Date,
          default: null,
        },
        expiryDate: {
          type: Date,
          default: null,
        },
        notes: {
          type: String,
          default: "",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Vehicle", VehicleSchema);
