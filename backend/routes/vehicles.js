import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type && type !== "All") filter.type = type;
    if (status && status !== "All") filter.status = status;

    const vehicles = await Vehicle.find(filter).sort({ registrationNo: 1 });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching vehicles" });
  }
});

// @desc    Create a vehicle
// @route   POST /api/vehicles
// @access  Private (FleetManager only)
router.post("/", protect, authorize("FleetManager"), async (req, res) => {
  try {
    const {
      registrationNo,
      name,
      type,
      capacityKg,
      odometerKm,
      acquisitionCost,
      status,
    } = req.body;

    // Check if duplicate registration
    const existing = await Vehicle.findOne({
      registrationNo: registrationNo.toUpperCase(),
    });
    if (existing) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Registration number must be unique",
        });
    }

    const vehicle = await Vehicle.create({
      registrationNo,
      name,
      type,
      capacityKg,
      odometerKm,
      acquisitionCost,
      status: status || "Available",
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error creating vehicle" });
  }
});

// @desc    Add a document to a vehicle
// @route   POST /api/vehicles/:id/documents
// @access  Private (FleetManager only)
router.post(
  "/:id/documents",
  protect,
  authorize("FleetManager"),
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, message: "Vehicle not found" });
      }

      const { name, type, documentNo, issueDate, expiryDate, notes } = req.body;

      if (!name || !type) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Document name and type are required",
          });
      }

      vehicle.documents.push({
        name,
        type,
        documentNo: documentNo || "",
        issueDate: issueDate || null,
        expiryDate: expiryDate || null,
        notes: notes || "",
      });

      await vehicle.save();

      res.status(201).json({ success: true, data: vehicle });
    } catch (error) {
      console.error("Error adding document:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error adding document" });
    }
  },
);

// @desc    Delete a document from a vehicle
// @route   DELETE /api/vehicles/:id/documents/:docId
// @access  Private (FleetManager only)
router.delete(
  "/:id/documents/:docId",
  protect,
  authorize("FleetManager"),
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, message: "Vehicle not found" });
      }

      const docIndex = vehicle.documents.findIndex(
        (d) => d._id.toString() === req.params.docId,
      );
      if (docIndex === -1) {
        return res
          .status(404)
          .json({ success: false, message: "Document not found" });
      }

      vehicle.documents.splice(docIndex, 1);
      await vehicle.save();

      res.json({ success: true, data: vehicle });
    } catch (error) {
      console.error("Error deleting document:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error deleting document" });
    }
  },
);

export default router;
