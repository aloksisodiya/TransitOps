import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import Driver from "../models/Driver.js";

const router = express.Router();

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ name: 1 });
    res.json({ success: true, data: drivers });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching drivers" });
  }
});

// @desc    Create a driver
// @route   POST /api/drivers
// @access  Private (SafetyOfficer only)
router.post("/", protect, authorize("SafetyOfficer"), async (req, res) => {
  try {
    const {
      name,
      licenseNo,
      licenseCategory,
      licenseExpiry,
      contact,
      tripCompletionPct,
      safetyScore,
      status,
    } = req.body;

    // Check duplicate license
    const existing = await Driver.findOne({
      licenseNo: licenseNo.toUpperCase(),
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "License number must be unique" });
    }

    const driver = await Driver.create({
      name,
      licenseNo,
      licenseCategory,
      licenseExpiry,
      contact,
      tripCompletionPct: tripCompletionPct || 0,
      safetyScore: safetyScore || 100,
      status: status || "Available",
    });

    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    console.error("Error creating driver:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error creating driver" });
  }
});

// @desc    Toggle/Update driver status or profile
// @route   PUT /api/drivers/:id
// @access  Private (SafetyOfficer only)
router.put("/:id", protect, authorize("SafetyOfficer"), async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!driver) {
      return res
        .status(404)
        .json({ success: false, message: "Driver not found" });
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    console.error("Error updating driver:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating driver" });
  }
});

export default router;
