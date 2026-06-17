import Classroom from "../models/Classroom.js";
import Attendance from "../models/Attendance.js";
import Assignment from "../models/Assignment.js";
import Grade from "../models/Grade.js";
import { generateClassroomSummary } from "../services/geminiService.js";
import { AppError } from "../utils/errorHandler.js";

// AI Analytics Classroom Summary
// POST /api/ai/classroom-summary/:id
export const getAIClassroomSummary = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findById(id)
      .populate("students", "name email");

    if (!classroom) {
      throw new AppError("Course code not found or invalid.", 404);
    }

    const { studentId } = { ...(req.query || {}), ...(req.body || {}) };

    const attendanceRecords = await Attendance.find({ classroom: id });
    const assignments = await Assignment.find({ classroom: id });
    const grades = await Grade.find({ classroom: id });

    console.log(`[AI Insights API] Request for classroom ${id}, studentId: ${studentId || "None"}`);
    console.log(`[AI Insights API] Loaded ${attendanceRecords.length} attendance, ${assignments.length} assignments, ${grades.length} grade records.`);

    // Call service to run Gemini query or fallback proactively
    const report = await generateClassroomSummary(
      classroom,
      classroom.students,
      attendanceRecords,
      assignments,
      grades,
      studentId
    );

    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};
