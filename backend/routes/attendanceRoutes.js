import express from "express";
import { markAttendance, getAttendanceByClassroom, getAttendanceByStudent } from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // Secure logging endpoints

router.post("/", markAttendance);
router.get("/classroom/:id", getAttendanceByClassroom);
router.get("/student/:id", getAttendanceByStudent);

export default router;
