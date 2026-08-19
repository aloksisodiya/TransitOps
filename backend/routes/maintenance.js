import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import Maintenance from "../models/Maintenance.js";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();

// @desc    Get all service records
// @route   GET /api/maintenance
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const logs = await Maintenance.find()
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching maintenance records:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching maintenance logs",
      });
  }
});

// @desc    Log a service record
// @route   POST /api/maintenance
// @access  Private (FleetManager only)
router.post("/", protect, authorize("FleetManager"), async (req, res) => {
  try {
    const { vehicleId, serviceType, cost, date, status } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    // Creating maintenance record
    const log = await Maintenance.create({
      vehicleId,
      serviceType,
      cost,
      date,
      status: status || "Active", // Active means In Shop
    });

    // Update vehicle status to 'InShop' if maintenance log is Active
    if (log.status === "Active") {
      await Vehicle.findByIdAndUpdate(vehicleId, { status: "InShop" });
    }

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error("Error logging service record:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error logging service record" });
  }
});

// @desc    Complete a service record (vehicle back to Available)
// @route   PUT /api/maintenance/:id/complete
// @access  Private (FleetManager only)
router.put(
  "/:id/complete",
  protect,
  authorize("FleetManager"),
  async (req, res) => {
    try {
      const log = await Maintenance.findById(req.params.id);
      if (!log) {
        return res
          .status(404)
          .json({ success: false, message: "Service log not found" });
      }

      if (log.status === "Completed") {
        return res
          .status(400)
          .json({
            success: false,
            message: "Service record is already completed",
          });
      }

      log.status = "Completed";
      await log.save();

      // Transition vehicle back to 'Available'
      await Vehicle.findByIdAndUpdate(log.vehicleId, { status: "Available" });

      res.json({ success: true, data: log });
    } catch (error) {
      console.error("Error completing service record:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error completing service record",
        });
    }
  },
);

export default router;
