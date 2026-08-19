import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";
import Maintenance from "../models/Maintenance.js";
import Alert from "../models/Alert.js";

const router = express.Router();

// @desc    Get all trips (Live Board)
// @route   GET /api/trips
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("vehicleId")
      .populate("driverId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: trips });
  } catch (error) {
    console.error("Error fetching trips:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching trips" });
  }
});

// @desc    Create/Dispatch a trip
// @route   POST /api/trips
// @access  Private (Driver only)
router.post("/", protect, authorize("Driver"), async (req, res) => {
  try {
    const {
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeightKg,
      plannedDistanceKm,
      status,
    } = req.body;

    // 1. Generate unique sequential tripId (e.g. TR001)
    const lastTrip = await Trip.findOne().sort({ createdAt: -1 });
    let nextIdNum = 1;
    if (lastTrip && lastTrip.tripId) {
      const match = lastTrip.tripId.match(/\d+/);
      if (match) {
        nextIdNum = parseInt(match[0]) + 1;
      }
    }
    const tripId = `TR${String(nextIdNum).padStart(3, "0")}`;

    // 2. Fetch vehicle & driver for validation
    let vehicle = null;
    let driver = null;

    if (vehicleId) {
      vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res
          .status(400)
          .json({ success: false, message: "Vehicle not found" });
      }
    }

    if (driverId) {
      driver = await Driver.findById(driverId);
      if (!driver) {
        return res
          .status(400)
          .json({ success: false, message: "Driver not found" });
      }
    }

    // 3. Validation if status is Dispatched (Draft trips are just queues)
    const isDispatched = status === "Dispatched";

    if (isDispatched) {
      if (!vehicle || !driver) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Vehicle and Driver are required for dispatching a trip",
          });
      }

      // Check vehicle availability
      if (vehicle.status !== "Available") {
        return res
          .status(400)
          .json({
            success: false,
            message: `Vehicle ${vehicle.registrationNo} is currently ${vehicle.status} — dispatch blocked`,
          });
      }

      // Check driver availability
      if (driver.status !== "Available") {
        return res
          .status(400)
          .json({
            success: false,
            message: `Driver ${driver.name} is currently ${driver.status} — dispatch blocked`,
          });
      }

      // Check driver license expiry
      if (new Date(driver.licenseExpiry) < new Date()) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Driver ${driver.name}'s license has expired — dispatch blocked`,
          });
      }

      // Check vehicle capacity
      if (cargoWeightKg > vehicle.capacityKg) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Vehicle Capacity: ${vehicle.capacityKg} kg. Cargo Weight: ${cargoWeightKg} kg. Capacity exceeded by ${cargoWeightKg - vehicle.capacityKg} kg — dispatch blocked`,
          });
      }
    }

    // 4. Create Trip
    const trip = await Trip.create({
      tripId,
      source,
      destination,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      cargoWeightKg,
      plannedDistanceKm,
      status: status || "Draft",
    });

    // 5. Update vehicle & driver status if dispatched
    if (isDispatched) {
      await Vehicle.findByIdAndUpdate(vehicleId, { status: "OnTrip" });
      await Driver.findByIdAndUpdate(driverId, { status: "OnTrip" });
    }

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error("Error creating trip:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error creating trip" });
  }
});

// @desc    Update trip status (Complete or Cancel)
// @route   PUT /api/trips/:id/status
// @access  Private (Driver only)
router.put("/:id/status", protect, authorize("Driver"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Completed", "Cancelled", "Dispatched"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid target status" });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    if (trip.status === "Completed" || trip.status === "Cancelled") {
      return res
        .status(400)
        .json({
          success: false,
          message: `Cannot change status of a ${trip.status.toLowerCase()} trip`,
        });
    }

    const oldStatus = trip.status;
    trip.status = status;
    if (status === "Completed") {
      trip.completedAt = Date.now();
    }
    await trip.save();

    // Perform transitions
    if (status === "Completed") {
      // Vehicle back to Available or InShop if threshold crossed, add odometer
      if (trip.vehicleId) {
        const vehicle = await Vehicle.findById(trip.vehicleId);
        if (vehicle) {
          const oldOdo = vehicle.odometerKm || 0;
          const distance = trip.plannedDistanceKm || 0;
          const newOdo = oldOdo + distance;
          vehicle.odometerKm = newOdo;

          // Check if odometer has crossed a multiple of 10,000 km
          const oldMultiple = Math.floor(oldOdo / 10000);
          const newMultiple = Math.floor(newOdo / 10000);
          const triggersMaintenance = newMultiple > oldMultiple;

          if (triggersMaintenance) {
            vehicle.status = "InShop"; // Automatically switch its status to "In Shop"
            await vehicle.save();

            // Auto-create active maintenance record
            await Maintenance.create({
              vehicleId: vehicle._id,
              serviceType: "Scheduled Maintenance (Odometer Triggered)",
              cost: 0,
              date: new Date(),
              status: "Active",
            });

            // Auto-create High Alert
            await Alert.create({
              vehicleId: vehicle._id,
              type: "Maintenance",
              severity: "High",
              message: `Vehicle ${vehicle.registrationNo} has crossed a 10,000 km mileage threshold (reached ${newOdo} km). Scheduled Maintenance order generated automatically.`,
            });
          } else {
            vehicle.status = "Available";
            await vehicle.save();
          }
        }
      }
      // Driver back to Available
      if (trip.driverId) {
        await Driver.findByIdAndUpdate(trip.driverId, { status: "Available" });
      }
    } else if (status === "Cancelled") {
      // Vehicle back to Available
      if (trip.vehicleId && oldStatus === "Dispatched") {
        await Vehicle.findByIdAndUpdate(trip.vehicleId, {
          status: "Available",
        });
      }
      // Driver back to Available
      if (trip.driverId && oldStatus === "Dispatched") {
        await Driver.findByIdAndUpdate(trip.driverId, { status: "Available" });
      }
    } else if (status === "Dispatched" && oldStatus === "Draft") {
      // Transitioning draft to dispatched
      // Perform validations again since it was a draft
      const vehicle = await Vehicle.findById(trip.vehicleId);
      const driver = await Driver.findById(trip.driverId);

      if (!vehicle || !driver) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Vehicle and Driver are required to dispatch a trip",
          });
      }

      if (vehicle.status !== "Available") {
        return res
          .status(400)
          .json({
            success: false,
            message: `Vehicle is ${vehicle.status} — dispatch blocked`,
          });
      }

      if (driver.status !== "Available") {
        return res
          .status(400)
          .json({
            success: false,
            message: `Driver is ${driver.status} — dispatch blocked`,
          });
      }

      if (new Date(driver.licenseExpiry) < new Date()) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Driver's license is expired — dispatch blocked`,
          });
      }

      if (trip.cargoWeightKg > vehicle.capacityKg) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Capacity exceeded — dispatch blocked`,
          });
      }

      // Update statuses
      vehicle.status = "OnTrip";
      await vehicle.save();

      driver.status = "OnTrip";
      await driver.save();
    }

    res.json({ success: true, data: trip });
  } catch (error) {
    console.error("Error updating trip status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating trip status" });
  }
});

export default router;
