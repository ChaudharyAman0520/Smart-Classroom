import express from "express";
import { getAIClassroomSummary } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // Secure prediction routes

router.post("/classroom-summary/:id", getAIClassroomSummary);

export default router;
