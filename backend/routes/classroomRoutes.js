import express from "express";
import { createClassroom, getClassrooms, getClassroomById, enrollStudent, getAllStudents } from "../controllers/classroomController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // Secure course routes

router.post("/", createClassroom);
router.get("/", getClassrooms);
router.get("/students/all", getAllStudents);
router.get("/:id", getClassroomById);
router.post("/:classroomId/enroll", enrollStudent);

export default router;
