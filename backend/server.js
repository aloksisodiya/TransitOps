import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import vehicleRoutes from "./routes/vehicles.js";
import driverRoutes from "./routes/drivers.js";
import tripRoutes from "./routes/trips.js";
import maintenanceRoutes from "./routes/maintenance.js";
import expenseRoutes from "./routes/expenses.js";
import alertRoutes from "./routes/alerts.js";
import licenseReminderRoutes from "./routes/licenseReminder.js";

// Connect to Database
connectDB();

const app = express();

// Standard Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // frontend origins
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/license-reminders", licenseReminderRoutes);

// Simple Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "TransitOps API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});
