import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import FuelLog from "../models/FuelLog.js";
import Expense from "../models/Expense.js";
import Maintenance from "../models/Maintenance.js";
import Vehicle from "../models/Vehicle.js";
import Trip from "../models/Trip.js";

const router = express.Router();

// @desc    Get all fuel logs, other expenses, and total operational cost
// @route   GET /api/expenses
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const fuelLogs = await FuelLog.find()
      .populate("vehicleId")
      .sort({ createdAt: -1 });
    const otherExpenses = await Expense.find()
      .populate({
        path: "tripId",
        select: "tripId status",
      })
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    // Calculate operational costs
    const totalFuel = fuelLogs.reduce((acc, curr) => acc + (curr.cost || 0), 0);

    // Get all completed maintenance logs to calculate maintenance totals
    const maintenanceLogs = await Maintenance.find();
    const totalMaint = maintenanceLogs.reduce(
      (acc, curr) => acc + (curr.cost || 0),
      0,
    );

    const totalTollsOther = otherExpenses.reduce(
      (acc, curr) => acc + (curr.toll || 0) + (curr.other || 0),
      0,
    );

    const totalOperationalCost = totalFuel + totalMaint + totalTollsOther;

    res.json({
      success: true,
      data: {
        fuelLogs,
        otherExpenses,
        metrics: {
          totalFuel,
          totalMaintenance: totalMaint,
          totalTollsOther,
          totalOperationalCost,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching expenses" });
  }
});

// @desc    Log fuel purchase
// @route   POST /api/expenses/fuel
// @access  Private (FinancialAnalyst or FleetManager)
router.post(
  "/fuel",
  protect,
  authorize("FinancialAnalyst", "FleetManager"),
  async (req, res) => {
    try {
      const { vehicleId, date, liters, cost } = req.body;

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, message: "Vehicle not found" });
      }

      const log = await FuelLog.create({
        vehicleId,
        date: date || new Date(),
        liters,
        cost,
      });

      res.status(201).json({ success: true, data: log });
    } catch (error) {
      console.error("Error logging fuel:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error logging fuel purchase",
        });
    }
  },
);

// @desc    Log other operational expense (toll/misc)
// @route   POST /api/expenses/other
// @access  Private (FinancialAnalyst)
router.post(
  "/other",
  protect,
  authorize("FinancialAnalyst"),
  async (req, res) => {
    try {
      const { tripId, vehicleId, toll, other, maintenanceCost } = req.body;

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, message: "Vehicle not found" });
      }

      if (tripId) {
        const trip = await Trip.findById(tripId);
        if (!trip) {
          return res
            .status(404)
            .json({ success: false, message: "Trip not found" });
        }
      }

      const total =
        Number(toll || 0) + Number(other || 0) + Number(maintenanceCost || 0);

      const expense = await Expense.create({
        tripId: tripId || null,
        vehicleId,
        toll: toll || 0,
        other: other || 0,
        maintenanceCost: maintenanceCost || 0,
        total,
      });

      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      console.error("Error logging expense:", error);
      res
        .status(500)
        .json({ success: false, message: "Server error logging expense" });
    }
  },
);

export default router;
