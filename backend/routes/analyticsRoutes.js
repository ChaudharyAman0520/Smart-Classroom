import express from "express";
import { getClassroomAnalytics, getTeacherAnalytics, getStudentAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // Secure query points

router.get("/classroom/:id", getClassroomAnalytics);
router.get("/teacher/:id", getTeacherAnalytics);
router.get("/student/:id", getStudentAnalytics);

export default router;
