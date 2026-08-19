import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Driver from "../models/Driver.js";
import Alert from "../models/Alert.js";

const router = express.Router();

// @desc    Check for expiring driver licenses and auto-create alerts
// @route   GET /api/license-reminders/check
// @access  Private
router.get("/check", protect, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    // Find drivers with licenses expiring within 30 days or already expired
    const expiringDrivers = await Driver.find({
      licenseExpiry: { $lte: thirtyDaysFromNow },
      status: { $ne: "Suspended" }, // Don't alert for already suspended drivers
    });

    const createdAlerts = [];

    for (const driver of expiringDrivers) {
      const isExpired = new Date(driver.licenseExpiry) < now;
      const daysUntilExpiry = Math.ceil(
        (new Date(driver.licenseExpiry) - now) / (1000 * 60 * 60 * 24),
      );

      // Check if an unresolved alert already exists for this driver
      const existingAlert = await Alert.findOne({
        type: "LicenseExpiry",
        resolved: false,
        message: { $regex: driver.licenseNo, $options: "i" },
      });

      if (!existingAlert) {
        const severity = isExpired
          ? "High"
          : daysUntilExpiry <= 7
            ? "High"
            : "Medium";
        const message = isExpired
          ? `Driver ${driver.name} (License: ${driver.licenseNo}) — License EXPIRED on ${new Date(driver.licenseExpiry).toLocaleDateString()}. Dispatch blocked.`
          : `Driver ${driver.name} (License: ${driver.licenseNo}) — License expires in ${daysUntilExpiry} day(s) on ${new Date(driver.licenseExpiry).toLocaleDateString()}. Renewal required.`;

        const alert = await Alert.create({
          type: "LicenseExpiry",
          severity,
          message,
        });
        createdAlerts.push(alert);
      }
    }

    res.json({
      success: true,
      data: {
        driversChecked: expiringDrivers.length,
        alertsCreated: createdAlerts.length,
        expiringDrivers: expiringDrivers.map((d) => ({
          name: d.name,
          licenseNo: d.licenseNo,
          licenseExpiry: d.licenseExpiry,
          isExpired: new Date(d.licenseExpiry) < now,
          daysUntilExpiry: Math.ceil(
            (new Date(d.licenseExpiry) - now) / (1000 * 60 * 60 * 24),
          ),
        })),
      },
    });
  } catch (error) {
    console.error("Error checking license reminders:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error checking license reminders",
      });
  }
});

export default router;
