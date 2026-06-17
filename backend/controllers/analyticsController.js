import Classroom from "../models/Classroom.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Assignment from "../models/Assignment.js";
import Grade from "../models/Grade.js";
import { AppError } from "../utils/errorHandler.js";

// Classroom Analytics
// GET /api/analytics/classroom/:id
export const getClassroomAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findById(id)
      .populate("teacher", "name")
      .populate("students", "name email");

    if (!classroom) {
      throw new AppError("Requested classroom analytics dashboard not found.", 404);
    }

    const attendanceRecords = await Attendance.find({ classroom: id });

    // Determine if the requester is a student
    const isStudent = req.user.role === "student";
    const studentIdStr = req.user._id.toString();

    // Filter attendance records to student-specific if requesting user is a student
    const relevantRecords = isStudent
      ? attendanceRecords.filter((r) => r.student.toString() === studentIdStr)
      : attendanceRecords;

    const totalStudents = isStudent ? 1 : classroom.students.length;
    const presentCount = relevantRecords.filter((r) => ["Present", "present"].includes(r.status)).length;
    const absentCount = relevantRecords.filter((r) => ["Absent", "absent"].includes(r.status)).length;
    const totalRecords = presentCount + absentCount;
    const attendancePercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 100;

    // Compile Daily History from relevant records
    const dateGroups = {};
    relevantRecords.forEach((record) => {
      const dateStr = new Date(record.date).toISOString().split("T")[0];
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = { present: 0, absent: 0 };
      }
      if (["Present", "present"].includes(record.status)) {
        dateGroups[dateStr].present += 1;
      } else {
        dateGroups[dateStr].absent += 1;
      }
    });

    const dailyHistory = Object.keys(dateGroups)
      .map((dateKey) => {
        const { present, absent } = dateGroups[dateKey];
        const dayTotal = present + absent;
        return {
          date: dateKey,
          present,
          absent,
          rate: dayTotal > 0 ? Math.round((present / dayTotal) * 100) : 100,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Compile Unique Dates as Sessions Held (for student, only count their own sessions)
    const uniqueDatesCount = Object.keys(dateGroups).length;

    // Compile Student Performance (restrict completely to only the logged-in student if they are a student)
    let studentPerformance = [];
    if (isStudent) {
      const studentObj = classroom.students.find((s) => s._id.toString() === studentIdStr) || req.user;
      const studentRecords = attendanceRecords.filter((r) => r.student.toString() === studentIdStr);
      
      const sPresent = studentRecords.filter((r) => ["Present", "present"].includes(r.status)).length;
      const sAbsent = studentRecords.filter((r) => ["Absent", "absent"].includes(r.status)).length;
      const sTotal = sPresent + sAbsent;

      studentPerformance = [
        {
          studentId: studentIdStr,
          studentName: studentObj.name,
          studentEmail: studentObj.email,
          totalSessions: sTotal,
          presentSessions: sPresent,
          absentSessions: sAbsent,
          rate: sTotal > 0 ? Math.round((sPresent / sTotal) * 100) : 100,
        }
      ];
    } else {
      studentPerformance = classroom.students.map((student) => {
        const studentIdStrInner = student._id.toString();
        const studentRecords = attendanceRecords.filter((r) => r.student.toString() === studentIdStrInner);
        
        const sPresent = studentRecords.filter((r) => ["Present", "present"].includes(r.status)).length;
        const sAbsent = studentRecords.filter((r) => ["Absent", "absent"].includes(r.status)).length;
        const sTotal = sPresent + sAbsent;

        return {
          studentId: studentIdStrInner,
          studentName: student.name,
          studentEmail: student.email,
          totalSessions: sTotal,
          presentSessions: sPresent,
          absentSessions: sAbsent,
          rate: sTotal > 0 ? Math.round((sPresent / sTotal) * 100) : 100,
        };
      });
    }

    // Fetch classroom assignments and score details/marks
    const assignments = await Assignment.find({ classroom: id });
    const grades = await Grade.find({ classroom: id });

    const mappedAssignments = assignments.map((a) => ({
      id: a._id.toString(),
      classroomId: a.classroom.toString(),
      title: a.title,
      maxPoints: a.maxPoints,
      dueDate: a.dueDate,
    }));

    // If student, filter grade records so they only see their own marks
    const filteredGrades = isStudent
      ? grades.filter((g) => g.student.toString() === studentIdStr)
      : grades;

    const mappedGrades = filteredGrades.map((g) => ({
      id: g._id.toString(),
      assignmentId: g.assignment.toString(),
      classroomId: g.classroom.toString(),
      studentId: g.student.toString(),
      score: g.score,
      remarks: g.remarks || "",
    }));

    res.status(200).json({
      totalStudents,
      presentCount,
      absentCount,
      attendancePercentage: Math.round(attendancePercentage),

      classroomId: classroom._id.toString(),
      classroomName: classroom.className,
      teacherId: classroom.teacher?._id?.toString() || classroom.teacher?.toString() || "",
      teacherName: classroom.teacher?.name || "Lead Instructor",
      totalClassesHeld: uniqueDatesCount,
      averageAttendance: Math.round(attendancePercentage),
      summary: {
        present: presentCount,
        absent: absentCount,
      },
      dailyHistory,
      studentPerformance,

      // Include assignments and grades info for frontend custom rendering
      assignments: mappedAssignments,
      grades: mappedGrades,
    });
  } catch (error) {
    next(error);
  }
};

// Teacher Dashboard Aggregates
// GET /api/analytics/teacher/:id
export const getTeacherAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classroomsList = await Classroom.find({ teacher: id });
    const classroomsIds = classroomsList.map((c) => c._id);

    const attendanceRecords = await Attendance.find({ classroom: { $in: classroomsIds } });

    // Calculate total unique students enrolled across all of this teacher's rooms
    const uniqueStudents = new Set();
    classroomsList.forEach((c) => {
      c.students.forEach((sId) => uniqueStudents.add(sId.toString()));
    });

    // Group records by unique class periods / session dates
    const sessionDatesSet = new Set();
    attendanceRecords.forEach((rec) => {
      const dateStr = new Date(rec.date).toISOString().split("T")[0];
      sessionDatesSet.add(`${rec.classroom.toString()}_${dateStr}`);
    });

    const classroomAnalytics = [];

    for (const cls of classroomsList) {
      const clsIdStr = cls._id.toString();
      const clsRecords = attendanceRecords.filter((rec) => rec.classroom.toString() === clsIdStr);
      
      const present = clsRecords.filter((rec) => ["Present", "present"].includes(rec.status)).length;
      const absent = clsRecords.filter((rec) => ["Absent", "absent"].includes(rec.status)).length;
      const total = present + absent;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 100;

      const clsDates = new Set(
        clsRecords.map((r) => new Date(r.date).toISOString().split("T")[0])
      );

      classroomAnalytics.push({
        classroomId: clsIdStr,
        classroomName: cls.className,
        subject: cls.subject,
        studentsCount: cls.students.length,
        classesHeld: clsDates.size,
        attendanceRate,
      });
    }

    res.status(200).json({
      totalClassrooms: classroomsList.length,
      totalStudentsSum: uniqueStudents.size,
      totalSessionsRecorded: sessionDatesSet.size,
      classroomAnalytics,
    });
  } catch (error) {
    next(error);
  }
};

// Student Dashboard Aggregates
// GET /api/analytics/student/:id
export const getStudentAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const studentClassrooms = await Classroom.find({ students: id })
      .populate("teacher", "name");

    const studentClassroomsIds = studentClassrooms.map((c) => c._id);

    const logs = await Attendance.find({
      student: id,
      classroom: { $in: studentClassroomsIds },
    }).populate("classroom", "className subject");

    const presentCount = logs.filter((log) => ["Present", "present"].includes(log.status)).length;
    const absentCount = logs.filter((log) => ["Absent", "absent"].includes(log.status)).length;
    const totalLogs = presentCount + absentCount;
    const averageAttendancePercent = totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 100;

    const history = logs.map((log) => {
      const cls = log.classroom;
      const dateStr = new Date(log.date).toISOString().split("T")[0];
      return {
        sessionId: `SESS-${dateStr}-${cls?._id?.toString() || "deleted"}`,
        classroomId: cls?._id?.toString() || "",
        classroomName: cls?.className || "Deleted Course Space",
        subject: cls?.subject || "N/A",
        date: dateStr,
        status: log.status.toLowerCase() === "present" ? "present" : "absent",
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    res.status(200).json({
      studentId: id,
      classesCount: studentClassrooms.length,
      averageAttendancePercent,
      presentCount,
      absentCount,
      history,
    });
  } catch (error) {
    next(error);
  }
};
