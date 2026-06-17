import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendWelcomeEmail, sendPasswordResetEmail, sendOTPEmail } from "../services/emailService.js";
import { AppError } from "../utils/errorHandler.js";

const otpStore = new Map(); // Simple in-memory: email (lowercase) -> { otp, expiry }

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "fallback_secret_key",
    { expiresIn: "30d" }
  );
};

export const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError("Email coordinate is required to dispatch verification code.", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError("Account registration failed: Email has already been taken.", 400);
    }

    // Generate a 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase(), { otp, expiry });

    // Send the OTP verification email
    const mailResult = await sendOTPEmail(email.toLowerCase(), otp);

    if (mailResult.success === false) {
      throw new AppError(`SMTP Transmission Failure: ${mailResult.error || "Failed online dispatch"}`, 500);
    }

    res.status(200).json({
      success: true,
      message: "A 6-digit security OTP code has been dispatched to your email.",
      otp: mailResult.simulated ? otp : undefined, // only expose OTP to frontend if we are running in mail simulation mode
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, otp } = req.body;

    if (!name || !email || !password || !role || !otp) {
      throw new AppError("All registration fields including the OTP code are required.", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password strength requirement unmet (minimum 6 characters).", 400);
    }

    // Check OTP validity
    const otpRecord = otpStore.get(email.toLowerCase());
    if (!otpRecord) {
      throw new AppError("No verification code found for this email address. Please request a new OTP.", 400);
    }

    if (otpRecord.otp !== otp) {
      throw new AppError("The verification code you provided is invalid. Please try again.", 400);
    }

    if (Date.now() > otpRecord.expiry) {
      otpStore.delete(email.toLowerCase());
      throw new AppError("The verification code has expired. Please request a new OTP.", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError("Account registration failed: Email has already been taken.", 400);
    }

    // Hash the password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in DB
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    // Clear verification session
    otpStore.delete(email.toLowerCase());

    // Send Welcome Email
    sendWelcomeEmail(newUser.email, newUser.name);

    // Generate JWT token
    const token = signToken(newUser._id);

    // Format final response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Please provide both email credentials and access pass-keys.", 400);
    }

    // Find the user and select password field
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError("Invalid account credentials. Access denied.", 401);
    }

    // Compare passkey with bcrypt
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new AppError("Invalid account credentials. Access denied.", 401);
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email coordinate must be provided.", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError("No account is currently mapped to this email coordinate.", 404);
    }

    // Create highly secure random string token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Assign token and 1-hour expiry
    user.resetToken = hashedResetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // Reset url link
    // Supporting local relative development testing
    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Dispatch the pass-key reset email
    const mailResult = await sendPasswordResetEmail(user.email, resetUrl, resetToken);

    if (mailResult.success === false) {
      throw new AppError(`SMTP Transmission Failure: ${mailResult.error}`, 500);
    }

    res.status(200).json({
      success: true,
      message: "Security reset link dispatched successfully.",
      resetUrl: mailResult.simulated ? resetUrl : undefined,
      resetToken: mailResult.simulated ? resetToken : undefined,
      url: mailResult.simulated ? `/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}` : undefined
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, password, token } = req.body;

    if (!email || !password || !token) {
      throw new AppError("Required security parameters (email, token, password) are absent.", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password strength requirement unmet (minimum 6 characters).", 400);
    }

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Retrieve user and check validity
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: hashedResetToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("Security token is invalid or has expired.", 400);
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Credentials successfully updated. Proceed to login.",
    });
  } catch (error) {
    next(error);
  }
};
