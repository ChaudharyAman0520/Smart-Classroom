import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import classroomRoutes from "./routes/classroomRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { handleError } from "./utils/errorHandler.js";

// Load environment variables
dotenv.config();

// Establish connection to MongoDB Atlas
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body payloads
app.use(cors());
app.use(express.json());

// API Endpoints Mapping
app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/ai", aiRoutes);

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", system: "SCAS Backend" });
});

// Centralized error handling middleware
app.use(handleError);

// Launch server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🤖 SCAS Backend running on port ${PORT}`);
});

export default app;
