import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Zod schemas for input validation
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  role: z.string().optional(),
});

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  role: z.enum([
    "Admin",
    "FleetManager",
    "Driver",
    "SafetyOfficer",
    "FinancialAnalyst",
  ]),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Reset token is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

// Helper to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Map to store reset tokens in-memory (mocking email behavior for hackathon)
// In a real application, these would be saved in DB with expiry
const resetTokens = new Map();

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
    }

    const { email, password, role } = validation.data;

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Verify selected role matches user role (normalize Driver and Dispatcher for cross-compatibility)
    const checkRole = role === "Driver" ? "Dispatcher" : role;
    if (checkRole && user.role !== checkRole) {
      return res.status(401).json({
        success: false,
        message: `Role mismatch. Your account is registered as '${user.role}' not '${role}'`,
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const remainingTime = Math.ceil(
        (user.lockedUntil - Date.now()) / 1000 / 60,
      );
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${remainingTime} minute(s).`,
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        user.failedLoginAttempts = 0; // Reset counter for after lockout expires
        await user.save();
        return res.status(423).json({
          success: false,
          message: "Account locked after 5 failed attempts.",
        });
      } else {
        await user.save();
        const remainingAttempts = 5 - user.failedLoginAttempts;
        return res.status(401).json({
          success: false,
          message: `Invalid credentials. ${remainingAttempts} attempt(s) remaining.`,
        });
      }
    }

    // Success! Reset attempts, updates last login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    const oldLastLogin = user.lastLogin; // preserve for dashboard display if needed
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: oldLastLogin || user.lastLogin,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @desc    Register user & get token
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
    }

    const { name, email, password, role } = validation.data;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const dbRole = role === "Driver" ? "Dispatcher" : role;
    const user = await User.create({
      name,
      email,
      password,
      role: dbRole,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @desc    Forgot Password (Mock Email sending)
// @route   POST /api/auth/forgot-password
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
    }

    const { email } = validation.data;
    const user = await User.findOne({ email });

    if (!user) {
      // Security practice: don't reveal if user exists, but for mock flow we'll return success anyway
      return res.json({
        success: true,
        message:
          "If that email exists in our system, we have sent a password reset link to it.",
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    resetTokens.set(resetToken, {
      userId: user._id,
      expiry: tokenExpiry,
    });

    // Mock link (points to frontend reset path)
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    res.json({
      success: true,
      message:
        "If that email exists in our system, we have sent a password reset link to it.",
      mockLink: resetUrl, // Send link in response so UI can show it for simple hackathon flow
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
router.post("/reset-password", async (req, res) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
    }

    const { token, password } = validation.data;

    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(token);
      return res
        .status(400)
        .json({ success: false, message: "Password reset token has expired" });
    }

    const user = await User.findById(tokenData.userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // Update password
    user.password = password;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    // Clean up token
    resetTokens.delete(token);

    res.json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
