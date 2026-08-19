import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Alert from "../models/Alert.js";

const router = express.Router();

// @desc    Get all unresolved alerts
// @route   GET /api/alerts
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const alerts = await Alert.find({ resolved: false })
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching alerts" });
  }
});

// @desc    Mark an alert as resolved
// @route   PUT /api/alerts/:id/resolve
// @access  Private
router.put("/:id/resolve", protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res
        .status(404)
        .json({ success: false, message: "Alert not found" });
    }

    alert.resolved = true;
    await alert.save();

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error resolving alert" });
  }
});

// @desc    Create an alert
// @route   POST /api/alerts
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { vehicleId, type, severity, message } = req.body;

    const alert = await Alert.create({
      vehicleId: vehicleId || null,
      type,
      severity: severity || "Medium",
      message,
    });

    res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error creating alert" });
  }
});

export default router;
