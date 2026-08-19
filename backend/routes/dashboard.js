import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";
import Trip from "../models/Trip.js";

const router = express.Router();

// @desc    Get dashboard metrics & recent activities
// @route   GET /api/dashboard/stats
// @access  Private (Admin has full access)
router.get(
  "/stats",
  protect,
  authorize(
    "Admin",
    "Dispatcher",
    "FleetManager",
    "SafetyOfficer",
    "FinancialAnalyst",
  ),
  async (req, res) => {
    try {
      // 1. Gather vehicle stats
      const totalVehicles = await Vehicle.countDocuments();
      const activeVehicles = await Vehicle.countDocuments({ status: "OnTrip" });
      const availableVehicles = await Vehicle.countDocuments({
        status: "Available",
      });
      const vehiclesInMaintenance = await Vehicle.countDocuments({
        status: "InShop",
      });
      const retiredVehicles = await Vehicle.countDocuments({
        status: "Retired",
      });

      // 2. Gather trip stats
      const activeTrips = await Trip.countDocuments({ status: "Dispatched" });
      const pendingTrips = await Trip.countDocuments({ status: "Draft" });

      // 3. Gather driver stats
      const driversOnDuty = await Driver.countDocuments({ status: "OnTrip" });

      // 4. Calculate Fleet Utilization
      // Utilization = (Active Vehicles / Total Operational Vehicles) * 100
      // Operational vehicles are those not retired.
      const operationalVehiclesCount = totalVehicles - retiredVehicles;
      let fleetUtilization = 0;
      if (operationalVehiclesCount > 0) {
        fleetUtilization = Math.round(
          (activeVehicles / operationalVehiclesCount) * 100,
        );
      }

      // 5. Get Recent Trips (populated with Vehicle & Driver details)
      const recentTrips = await Trip.find()
        .populate("vehicleId", "registrationNo name type")
        .populate("driverId", "name contact safetyScore")
        .sort({ createdAt: -1 })
        .limit(10);

      // Format recent trips for easier frontend rendering
      const formattedRecentTrips = recentTrips.map((trip) => ({
        id: trip._id,
        tripId: trip.tripId,
        source: trip.source,
        destination: trip.destination,
        vehicle: trip.vehicleId ? trip.vehicleId.registrationNo : "—",
        vehicleName: trip.vehicleId ? trip.vehicleId.name : "—",
        vehicleType: trip.vehicleId ? trip.vehicleId.type : "—",
        driver: trip.driverId ? trip.driverId.name : "—",
        status: trip.status,
        createdAt: trip.createdAt,
        // ETA calculation (mocked for demo, e.g. based on remaining time or static values)
        eta:
          trip.status === "Dispatched"
            ? "45 min"
            : trip.status === "Draft"
              ? "Awaiting vehicle"
              : "—",
      }));

      res.json({
        success: true,
        data: {
          metrics: {
            activeVehicles,
            availableVehicles,
            vehiclesInMaintenance,
            activeTrips,
            pendingTrips,
            driversOnDuty,
            fleetUtilization,
          },
          vehicleStatus: {
            available: availableVehicles,
            onTrip: activeVehicles,
            inShop: vehiclesInMaintenance,
            retired: retiredVehicles,
          },
          recentTrips: formattedRecentTrips,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: "Server error fetching operational statistics",
      });
    }
  },
);

export default router;
