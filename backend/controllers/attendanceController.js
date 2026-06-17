import Attendance from "../models/Attendance.js";
import Classroom from "../models/Classroom.js";
import User from "../models/User.js";
import { AppError } from "../utils/errorHandler.js";

// Mark Attendance
// POST /api/attendance
export const markAttendance = async (req, res, next) => {
  try {
    const { classroomId, date, records } = req.body;

    if (!classroomId || !date || !records || !Array.isArray(records)) {
      throw new AppError("Classroom reference, session date, and student log records are required.", 400);
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      throw new AppError("Target classroom does not exist.", 404);
    }

    // Set stable date format (removing timezone drift for single-day comparison)
    const sessionDate = new Date(date);
    sessionDate.setUTCHours(0, 0, 0, 0);

    const savedRecords = [];

    for (const rec of records) {
      const { studentId, status } = rec;
      if (!studentId || !status) continue;

      // Update if already logged for the student on this day, otherwise write fresh
      // Using standard uppercase / lowercase mapping dynamically
      const normalizedStatus = status.toLowerCase() === "present" ? "present" : "absent";

      const updatedLog = await Attendance.findOneAndUpdate(
        {
          classroom: classroomId,
          student: studentId,
          date: sessionDate,
        },
        {
          status: normalizedStatus,
        },
        {
          upsert: true,
          new: true,
        }
      );

      savedRecords.push(updatedLog);
    }

    res.status(200).json({
      success: true,
      message: "Attendance records logged and validated successfully.",
      count: savedRecords.length,
    });
  } catch (error) {
    next(error);
  }
};

// View Classroom Attendance Sessions
// GET /api/attendance/classroom/:id
export const getAttendanceByClassroom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      throw new AppError("Classroom records could not be located.", 404);
    }

    const attendanceRecords = await Attendance.find({ classroom: id })
      .populate("student", "name email");

    // Group logs programmatically by ISO date (YYYY-MM-DD) to map to "AttendanceSession" expected client structures
    const sessionsMap = {};

    attendanceRecords.forEach((record) => {
      if (!record.student) return;

      const dateStr = new Date(record.date).toISOString().split("T")[0];

      if (!sessionsMap[dateStr]) {
        sessionsMap[dateStr] = {
          id: `SESS-${dateStr}-${id}`,
          classroomId: id,
          date: dateStr,
          records: [],
        };
      }

      sessionsMap[dateStr].records.push({
        studentId: record.student._id.toString(),
        studentName: record.student.name,
        status: record.status.toLowerCase(), // "present" or "absent"
      });
    });

    const sessionsArray = Object.values(sessionsMap).sort((a, b) => b.date.localeCompare(a.date));

    res.status(200).json(sessionsArray);
  } catch (error) {
    next(error);
  }
};

// View Student Attendance History
// GET /api/attendance/student/:id
export const getAttendanceByStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await User.findById(id);
    if (!student) {
      throw new AppError("Student profile could not be found.", 404);
    }

    const logs = await Attendance.find({ student: id })
      .populate({
        path: "classroom",
        populate: { path: "teacher", select: "name" },
      });

    const mappedLogs = logs.map((log) => {
      const cls = log.classroom;
      return {
        id: log._id.toString(),
        classroomId: cls?._id?.toString() || "",
        classroomName: cls?.className || "Deleted Course Space",
        subject: cls?.subject || "N/A",
        teacherName: cls?.teacher?.name || "Dr. Sarah Jenkins",
        date: new Date(log.date).toISOString().split("T")[0],
        status: log.status.toLowerCase(), // "present" or "absent"
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    res.status(200).json(mappedLogs);
  } catch (error) {
    next(error);
  }
};
