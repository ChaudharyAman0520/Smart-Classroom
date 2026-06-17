import express from "express";
import { register, login, forgotPassword, resetPassword, sendOTP } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-otp", sendOTP);

export default router;
