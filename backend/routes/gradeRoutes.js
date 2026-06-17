import express from "express";
import {
  getGradesByClassroom,
  getGradesByStudent,
  createOrUpdateAssignment,
  createOrUpdateGradeRecord,
} from "../controllers/gradeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // Secure grade routes

router.get("/classroom/:classroomId", getGradesByClassroom);
router.get("/student/:studentId", getGradesByStudent);
router.post("/assignment", createOrUpdateAssignment);
router.post("/record", createOrUpdateGradeRecord);

export default router;
