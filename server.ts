import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// MongoDB MVC backend imports for when MONGO_URI is configured
import { connectDB } from "./backend/config/db.js";
import authRoutes from "./backend/routes/authRoutes.js";
import classroomRoutes from "./backend/routes/classroomRoutes.js";
import attendanceRoutes from "./backend/routes/attendanceRoutes.js";
import analyticsRoutes from "./backend/routes/analyticsRoutes.js";
import aiRoutes from "./backend/routes/aiRoutes.js";
// @ts-ignore
import gradeRoutes from "./backend/routes/gradeRoutes.js";
import { handleError } from "./backend/utils/errorHandler.js";
import { sendOTPEmail, sendPasswordResetEmail } from "./backend/services/emailService.js";

dotenv.config();


// Helper to generate 24-character hex MongoDB ObjectId standard strings
const generateMongoId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16));
  return timestamp + random;
};

// Define strong typings
interface User {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  passwordHash: string; // Plain password for college proto comparison
}

interface Classroom {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  students: string[]; // List of Student IDs
}

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent";
}

interface AttendanceSession {
  id: string;
  classroomId: string;
  date: string; // YYYY-MM-DD
  records: AttendanceRecord[];
}

// Memory database with seeded values
const mockOtpStore = new Map();

const users: User[] = [
  { id: "T01", name: "Dr. Sarah Jenkins", email: "teacher@scas.edu", role: "teacher", passwordHash: "password" },
];

const classrooms: Classroom[] = [];

const sessions: AttendanceSession[] = [];

interface Assignment {
  id: string;
  classroomId: string;
  title: string;
  maxPoints: number;
  dueDate: string;
}

interface GradeRecord {
  id: string;
  assignmentId: string;
  classroomId: string;
  studentId: string;
  score: number;
  remarks?: string;
}

const assignments: Assignment[] = [];

const gradeRecords: GradeRecord[] = [];

// Lazy initialization of Gemini SDK as requested in instructions
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY env variable is absent. Using procedural simulation fallback.");
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Highly accurate, rich procedural analysis when Gemini lacks key
function getProceduralSummary(
  classroom: Classroom,
  classSessions: AttendanceSession[],
  classAssignments: Assignment[],
  classGradeRecords: GradeRecord[],
  studentId?: string
) {
  if (studentId) {
    const studentUser = users.find((u) => u.id === studentId);
    const name = studentUser ? studentUser.name : "Student";

    // Compute student attendance
    let presentCount = 0;
    let absentCount = 0;
    classSessions.forEach((sess) => {
      const rec = sess.records.find((r) => r.studentId === studentId);
      if (rec) {
        if (rec.status === "present") presentCount++;
        else absentCount++;
      }
    });
    const totalSess = presentCount + absentCount;
    const attRate = totalSess > 0 ? (presentCount / totalSess) * 100 : 100;

    // Compute student grades
    const myGrades = classGradeRecords.filter((g) => g.studentId === studentId);
    let earnedSum = 0;
    let possibleSum = 0;
    const myRemarks: string[] = [];
    myGrades.forEach((g) => {
      const asg = classAssignments.find((a) => a.id === g.assignmentId);
      if (asg) {
        earnedSum += g.score;
        possibleSum += asg.maxPoints;
      }
      if (g.remarks && g.remarks.trim().length > 0) {
        const title = asg ? asg.title : "Assignment";
        myRemarks.push(`"${g.remarks.trim()}" on ${title}`);
      }
    });
    const gradeRate = possibleSum > 0 ? (earnedSum / possibleSum) * 100 : 100;

    let summary = `Personal academic brief for ${name} in "${classroom.name}". You hold an attendance rate of ${attRate.toFixed(1)}% (${presentCount} out of ${totalSess} sessions attended)`;
    if (possibleSum > 0) {
      summary += ` and a cumulative grading standard of ${gradeRate.toFixed(1)}% across completed evaluations.`;
      const gradesList = myGrades.map((g) => {
        const asg = classAssignments.find((a) => a.id === g.assignmentId);
        const title = asg ? asg.title : "Assessment";
        const max = asg ? asg.maxPoints : 100;
        return `${title}: ${g.score}/${max} marks`;
      }).join(", ");
      summary += ` Your evaluated performance breakdown: ${gradesList}.`;
    } else {
      summary += `. No graded course assignments have been registered under your profile yet.`;
    }
    summary += ` This progress trend demonstrates your active engagement with course materials.`;

    const issues: string[] = [];
    if (attRate < 80) {
      issues.push(`Your attendance rate is ${attRate.toFixed(1)}%, which is below the target minimum threshold of 80%. Let's work to attend more sessions.`);
    }
    if (possibleSum > 0 && gradeRate < 70) {
      issues.push(`Your average competency score of ${gradeRate.toFixed(1)}% is below standard criteria. Reviewing materials before quizzes will help.`);
    }
    if (myRemarks.length > 0) {
      issues.push(`Recent instructor feedback comments: ${myRemarks.slice(0, 3).join("; ")}.`);
    }
    if (issues.length === 0) {
      issues.push("Excellent work! You are maintaining strong indicators across both attendance registries and class assignments.");
    }

    const recommendations = [
      "Set aside designated daily times to preview lecture syllabus logs and project criteria sheets.",
      "Engage actively in live course forums or visit the lead lecturer's open office hours.",
    ];
    if (attRate < 80) {
      recommendations.unshift("Prioritize classroom attendance to capture crucial practical walkthrough highlights.");
    }
    if (possibleSum > 0 && gradeRate < 70) {
      recommendations.unshift("Revise marked assignments and notes, focusing on constructive feedback comments published by the instructor.");
    }
    if (myRemarks.length > 0) {
      recommendations.push("Directly follow up on the recent instructor feedback comments to resolve learning blockers.");
    }

    return { summary, issues, recommendations };
  }

  // Teacher fallback
  let totalPresent = 0;
  let totalAbsent = 0;
  const studentStats: { [id: string]: { name: string; present: number; absent: number; earned: number; possible: number } } = {};

  classroom.students.forEach((id) => {
    const u = users.find((user) => user.id === id);
    studentStats[id] = { name: u ? u.name : "Student " + id, present: 0, absent: 0, earned: 0, possible: 0 };
  });

  classSessions.forEach((sess) => {
    sess.records.forEach((rec) => {
      if (studentStats[rec.studentId]) {
        if (rec.status === "present") {
          studentStats[rec.studentId].present++;
          totalPresent++;
        } else {
          studentStats[rec.studentId].absent++;
          totalAbsent++;
        }
      }
    });
  });

  let classEarnedSum = 0;
  let classPossibleSum = 0;
  const recentRemarks: string[] = [];

  classGradeRecords.forEach((g) => {
    if (studentStats[g.studentId]) {
      const asg = classAssignments.find((a) => a.id === g.assignmentId);
      if (asg) {
        studentStats[g.studentId].earned += g.score;
        studentStats[g.studentId].possible += asg.maxPoints;
        classEarnedSum += g.score;
        classPossibleSum += asg.maxPoints;
      }
      if (g.remarks && g.remarks.trim().length > 0) {
        recentRemarks.push(`${studentStats[g.studentId].name}: "${g.remarks.trim()}"`);
      }
    }
  });

  const totalPossible = totalPresent + totalAbsent;
  const rate = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 100;
  const classGradeRate = classPossibleSum > 0 ? (classEarnedSum / classPossibleSum) * 100 : null;

  const lowAtt: string[] = [];
  const lowGrade: string[] = [];

  Object.keys(studentStats).forEach((id) => {
    const stats = studentStats[id];
    const total = stats.present + stats.absent;
    const studentAttRate = total > 0 ? (stats.present / total) * 100 : 100;
    const studentGradeRate = stats.possible > 0 ? (stats.earned / stats.possible) * 100 : 100;

    if (studentAttRate < 80) {
      lowAtt.push(`${stats.name} (${Math.round(studentAttRate)}% attendance)`);
    }
    if (stats.possible > 0 && studentGradeRate < 70) {
      lowGrade.push(`${stats.name} (${Math.round(studentGradeRate)}% competency average)`);
    }
  });

  // Compute class-wide averages for each assignment
  const assignmentAverages: string[] = [];
  classAssignments.forEach((asg) => {
    const asgGrades = classGradeRecords.filter((g) => g.assignmentId === asg.id);
    if (asgGrades.length > 0) {
      const sum = asgGrades.reduce((acc, curr) => acc + curr.score, 0);
      const avg = sum / asgGrades.length;
      const pct = (avg / asg.maxPoints) * 100;
      assignmentAverages.push(`${asg.title} average: ${avg.toFixed(1)}/${asg.maxPoints} (${pct.toFixed(0)}%)`);
    }
  });

  let summary = `Classroom metrics summary for "${classroom.name}". The overall student attendance rate stands at ${rate.toFixed(1)}% across ${classSessions.length} sessions.`;
  if (classGradeRate !== null) {
    summary += ` Academically, the class-wide grade average is ${classGradeRate.toFixed(1)}% across completed assignments with grading active.`;
    if (assignmentAverages.length > 0) {
      summary += ` Specific evaluation statistics: [${assignmentAverages.join(", ")}].`;
    }
  } else {
    summary += ` No syllabus evaluative grades have been indexed yet.`;
  }
  summary += ` Specific student profiles show minor deviations requiring targeted support.`;

  const issues: string[] = [];
  if (lowAtt.length > 0) {
    issues.push(`Multiple students have fallen below the 80% attendance threshold: ${lowAtt.join(", ")}.`);
  }
  if (lowGrade.length > 0) {
    issues.push(`Multiple students have average course grades below 70%: ${lowGrade.join(", ")}.`);
  }
  if (recentRemarks.length > 0) {
    issues.push(`Recent evaluation remarks & feedback comments: ${recentRemarks.slice(0, 3).join("; ")}.`);
  }
  if (issues.length === 0) {
    issues.push("Overall attendance is strong, and student profiles are currently maintaining satisfactory margins across evaluations.");
  }

  const recommendations = [
    "Distribute early warnings or automatic ledger alerts to students below satisfactory levels.",
    "Introduce high-engagement active learning strategies during mid-week lectures to encourage attendance.",
    "Schedule physical office hours right after lecture periods to enhance academic accessibility.",
    "Provide supplementary credit recovery avenues for students with grades below standard targets."
  ];

  if (lowAtt.length > 0 || lowGrade.length > 0) {
    recommendations.unshift("Arrange brief 1-on-1 check-ins with at-risk students to assess learning difficulties or scheduling conflicts.");
  }
  if (recentRemarks.length > 0) {
    recommendations.push("Directly follow up on recent grading feedback and suggestions added in remarks.");
  }

  return { summary, issues, recommendations };
}

export const appPromise = (async () => {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Log endpoints for troubleshooting
  app.use((req, res, next) => {
    if (req.url.startsWith("/api")) {
      console.log(`[API REQUEST] ${req.method} ${req.url}`);
    }
    next();
  });

  // Try to connect to MongoDB Atlas
  const conn = await connectDB();
  const useRealDB = conn !== null;

  if (useRealDB) {
    console.log("🚀 MongoDB Atlas detected. Mounting real MVC endpoints.");
    // Mount MongoDB MVC backend routers
    app.use("/api/auth", authRoutes);
    app.use("/api/classrooms", classroomRoutes);
    app.use("/api/attendance", attendanceRoutes);
    app.use("/api/analytics", analyticsRoutes);
    app.use("/api/ai", aiRoutes);
    app.use("/api/grades", gradeRoutes);
    app.use("/api", handleError);
  } else {
    // Fall back to local testing environment logs
    console.log("ℹ️ Skipping MongoDB mount. Initializing high-fidelity in-memory storage.");
  }

  if (!useRealDB) {
    // --- Auth API ---
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "Email address is already registered in our system." });
    }

    // Generate simulated 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    mockOtpStore.set(email.toLowerCase(), { otp, expiry });

    // Call sendOTPEmail
    const mailResult = await sendOTPEmail(email.toLowerCase(), otp);

    if (mailResult.success === false) {
      return res.status(500).json({ error: `SMTP Transmission Failure: ${mailResult.error || "Failed online dispatch"}` });
    }

    res.json({
      success: true,
      message: "Simulated 6-digit OTP code has been sent successfully to your email.",
      otp: mailResult.simulated ? otp : undefined, // only expose OTP to frontend if we are running in mail simulation mode
    });
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role, otp } = req.body;

    if (!name || !email || !password || !role || !otp) {
      return res.status(400).json({ error: "All registration fields and the OTP code are required." });
    }

    // Validate OTP
    const otpRecord = mockOtpStore.get(email.toLowerCase());
    if (!otpRecord) {
      return res.status(400).json({ error: "No verification session found. Please request an OTP code first." });
    }

    if (otpRecord.otp !== String(otp)) {
      return res.status(400).json({ error: "The verification code you provided is invalid." });
    }

    if (Date.now() > otpRecord.expiry) {
      mockOtpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: "This OTP verification code has already expired. Please request a new one." });
    }

    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "Email address is already registered." });
    }

    const newUser: User = {
      id: (role === "teacher" ? "T" : "S") + String(users.length + 1).padStart(2, "0"),
      name,
      email: email.toLowerCase(),
      role: role === "teacher" ? "teacher" : "student",
      passwordHash: password, // For mock simulation, match plaintext
    };

    users.push(newUser);
    mockOtpStore.delete(email.toLowerCase());

    // If student, automatically enroll them in the primary intro CS classroom (C01) for convenient demo purposes
    if (newUser.role === "student") {
      const mainClass = classrooms.find((c) => c.id === "C01");
      if (mainClass) {
        mainClass.students.push(newUser.id);
      }
    }

    res.json({
      success: true,
      token: `MOCK_JWT_FOR_USER_${newUser.id}`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  });


  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid email or password combination." });
    }

    res.json({
      success: true,
      token: `MOCK_JWT_FOR_USER_${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "No user is registered with this email address in our ledger." });
    }

    // Provision a mock secure token and update user state
    const resetToken = "TOKEN-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    (user as any).resetToken = resetToken;

    // resetUrl
    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const mailResult = await sendPasswordResetEmail(user.email, resetUrl, resetToken);

    if (mailResult.success === false) {
      return res.status(500).json({ error: `SMTP Transmission Failure: ${mailResult.error}` });
    }

    res.json({
      success: true,
      message: "Security reset dispatch initiated successfully.",
      resetUrl: mailResult.simulated ? resetUrl : undefined,
      resetToken: mailResult.simulated ? resetToken : undefined,
      url: mailResult.simulated ? `/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}` : undefined,
    });
  });

  app.post("/api/auth/reset-password", (req, res) => {
    const { email, password, token } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and new password are required." });
    }

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "Matching account details was not found." });
    }

    // Set new credential hash
    user.passwordHash = password;
    if ((user as any).resetToken) {
      delete (user as any).resetToken;
    }

    res.json({
      success: true,
      message: "Credentials updated successfully. Proceed to log in using your new password.",
    });
  });

  // --- Classrooms API ---
  app.get("/api/classrooms", (req, res) => {
    // Note: To make it dynamic without standard header validation layers:
    // Support query param client authentication via ?userId=S01 or ?userId=T01 if needed, otherwise return all
    const { userId } = req.query;

    const mapClassroomWithDetails = (c: any) => {
      const enrolledStudents = users.filter((u) => c.students.includes(u.id));
      return {
        ...c,
        studentDetails: enrolledStudents.map((s) => ({ id: s.id, name: s.name, email: s.email })),
      };
    };

    if (!userId) {
      return res.json(classrooms.map(mapClassroomWithDetails));
    }

    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.json(classrooms.map(mapClassroomWithDetails));
    }

    if (user.role === "teacher") {
      const activeClassrooms = classrooms.filter((c) => c.teacherId === user.id);
      return res.json(activeClassrooms.map(mapClassroomWithDetails));
    } else {
      const enrolledClassrooms = classrooms.filter((c) => c.students.includes(user.id));
      return res.json(enrolledClassrooms.map(mapClassroomWithDetails));
    }
  });

  app.get("/api/classrooms/students/all", (req, res) => {
    const students = users.filter((u) => u.role === "student");
    const result = students.map((s) => {
      const studentClassrooms = classrooms.filter((c) => c.students.includes(s.id));
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        classrooms: studentClassrooms.map((c) => ({ id: c.id, name: c.name })),
      };
    });
    res.json(result);
  });

  app.get("/api/classrooms/:id", (req, res) => {
    const classroom = classrooms.find((c) => c.id === req.params.id);
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found." });
    }

    // Include detailed list of enrolled student structures
    const enrolledStudents = users.filter((u) => classroom.students.includes(u.id));
    res.json({
      ...classroom,
      studentDetails: enrolledStudents.map((s) => ({ id: s.id, name: s.name, email: s.email })),
    });
  });

  app.post("/api/classrooms", (req, res) => {
    const { name, subject, teacherId } = req.body;

    if (!name || !subject || !teacherId) {
      return res.status(400).json({ error: "Classroom name, subject, and teacherId are required." });
    }

    const teacher = users.find((u) => u.id === teacherId);
    if (!teacher) {
      return res.status(400).json({ error: "Valid teacher ID must be specified." });
    }

    const newClassroom: Classroom = {
      id: "C" + String(classrooms.length + 1).padStart(2, "0"), // Everyday classroom code (e.g. C04)
      name,
      subject,
      teacherId,
      teacherName: teacher.name,
      students: [],
    };

    classrooms.push(newClassroom);
    res.json({ success: true, classroom: newClassroom });
  });

  // Enroll/Register a student to a classroom
  app.post("/api/classrooms/:classroomId/enroll", (req, res) => {
    const { classroomId } = req.params;
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Student email is required for registration." });
    }

    const classroom = classrooms.find((c) => c.id === classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found." });
    }

    // Find student or auto-create them as student role
    let student = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!student) {
      const studentNum = users.filter((u) => u.role === "student").length + 1;
      student = {
        id: "S" + String(studentNum).padStart(2, "0"), // Everyday student code (e.g. S06)
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        role: "student",
        passwordHash: "password",
      };
      users.push(student);
    }

    if (student.role !== "student") {
      return res.status(400).json({ error: "The account associated with this email is not a student." });
    }

    if (classroom.students.includes(student.id)) {
      return res.status(400).json({ error: "Student is already registered to this classroom." });
    }

    classroom.students.push(student.id);

    // Generate a simple, everyday enrollment code instead of 24-character hexadecimal MongoDB ObjectId
    const enrollmentId = "ENR-" + Math.floor(1000 + Math.random() * 9000);

    res.json({
      success: true,
      message: `Successfully registered student ${student.name} to classroom.`,
      enrollmentId,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
    });
  });

  // --- Attendance API ---
  app.post("/api/attendance", (req, res) => {
    const { classroomId, date, records } = req.body;

    if (!classroomId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: "ClassroomId, date, and valid structures are required." });
    }

    // Check if session on this date already exists. If yes, replace it to allow updating attendance records!
    const existingIndex = sessions.findIndex((s) => s.classroomId === classroomId && s.date === date);

    const newSession: AttendanceSession = {
      id: existingIndex >= 0 ? sessions[existingIndex].id : "SESS" + String(sessions.length + 1).padStart(3, "0"),
      classroomId,
      date,
      records: records.map((r: any) => ({
        studentId: r.studentId,
        status: r.status === "present" ? "present" : "absent",
      })),
    };

    if (existingIndex >= 0) {
      sessions[existingIndex] = newSession;
    } else {
      sessions.push(newSession);
    }

    res.json({ success: true, session: newSession });
  });

  // Fetch all attendance logs for a classroom
  app.get("/api/attendance/classroom/:id", (req, res) => {
    const classSessions = sessions.filter((s) => s.classroomId === req.params.id);
    res.json(classSessions);
  });

  // --- Analytics API ---
  app.get("/api/analytics/classroom/:id", (req, res) => {
    const classroomId = req.params.id;
    const classroom = classrooms.find((c) => c.id === classroomId);

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found for analytics." });
    }

    const reqUserId = req.query.userId as string;
    const reqUser = users.find((u) => u.id === reqUserId);
    const isStudent = reqUser?.role === "student";

    const classSessions = sessions.filter((s) => s.classroomId === classroomId);

    // Calculate analytics metrics
    let totalPresent = 0;
    let totalAbsent = 0;

    const finalSessions = classSessions.map((sess) => {
      const filteredRecords = isStudent
        ? sess.records.filter((r) => r.studentId === reqUserId)
        : sess.records;

      filteredRecords.forEach((rec) => {
        if (rec.status === "present") totalPresent++;
        else totalAbsent++;
      });

      return {
        ...sess,
        records: filteredRecords,
      };
    });

    const totalRecords = totalPresent + totalAbsent;
    const averageAttendance = totalRecords > 0 ? parseFloat(((totalPresent / totalRecords) * 100).toFixed(1)) : 0;

    // Daily history chart data: { date, present, absent, rate }
    const dailyHistory = finalSessions
      .map((sess) => {
        let p = 0;
        let a = 0;
        sess.records.forEach((r) => {
          if (r.status === "present") p++;
          else a++;
        });
        const total = p + a;
        return {
          date: sess.date,
          present: p,
          absent: a,
          rate: total > 0 ? parseFloat(((p / total) * 100).toFixed(1)) : 100,
        };
      })
      .sort((x, y) => x.date.localeCompare(y.date));

    // Student performance breakdown
    let studentPerformance: any[] = [];
    if (isStudent && reqUser) {
      let presentCount = 0;
      let sessionCount = 0;
      classSessions.forEach((sess) => {
        const studentRec = sess.records.find((r) => r.studentId === reqUserId);
        if (studentRec) {
          sessionCount++;
          if (studentRec.status === "present") presentCount++;
        }
      });
      const rate = sessionCount > 0 ? parseFloat(((presentCount / sessionCount) * 100).toFixed(1)) : 100;
      studentPerformance = [{
        studentId: reqUserId,
        studentName: reqUser.name,
        studentEmail: reqUser.email,
        totalSessions: sessionCount,
        presentSessions: presentCount,
        absentSessions: sessionCount - presentCount,
        rate: rate,
      }];
    } else {
      const roster = users.filter((u) => classroom.students.includes(u.id));
      studentPerformance = roster.map((student) => {
        let presentCount = 0;
        let sessionCount = 0;

        classSessions.forEach((sess) => {
          const studentRec = sess.records.find((r) => r.studentId === student.id);
          if (studentRec) {
            sessionCount++;
            if (studentRec.status === "present") {
              presentCount++;
            }
          }
        });

        const rate = sessionCount > 0 ? parseFloat(((presentCount / sessionCount) * 100).toFixed(1)) : 100;

        return {
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          totalSessions: sessionCount,
          presentSessions: presentCount,
          absentSessions: sessionCount - presentCount,
          rate: rate,
        };
      });
    }

    const classAssignments = assignments.filter((a) => a.classroomId === classroomId);
    const classGrades = gradeRecords.filter((g) => g.classroomId === classroomId);

    const filteredGrades = isStudent
      ? classGrades.filter((g) => g.studentId === reqUserId)
      : classGrades;

    res.json({
      classroomId: classroom.id,
      classroomName: classroom.name,
      teacherId: classroom.teacherId,
      teacherName: classroom.teacherName,
      totalClassesHeld: isStudent ? studentPerformance[0]?.totalSessions || 0 : classSessions.length,
      averageAttendance,
      summary: {
        present: totalPresent,
        absent: totalAbsent,
      },
      dailyHistory,
      studentPerformance,
      assignments: classAssignments,
      grades: filteredGrades,
    });
  });

  // Global statistical endpoints for quick teacher summary dashboard
  app.get("/api/analytics/teacher/:teacherId", (req, res) => {
    const teacherId = req.params.teacherId;
    const teacherClasses = classrooms.filter((c) => c.teacherId === teacherId);

    const classroomAnalytics = teacherClasses.map((c) => {
      const classSessions = sessions.filter((s) => s.classroomId === c.id);
      let presentOfClass = 0;
      let totalOfClass = 0;
      classSessions.forEach((sess) => {
        sess.records.forEach((rec) => {
          totalOfClass++;
          if (rec.status === "present") presentOfClass++;
        });
      });
      const attendanceRate = totalOfClass > 0 ? Math.round((presentOfClass / totalOfClass) * 100) : 0;
      return {
        classroomId: c.id,
        classroomName: c.name,
        subject: c.subject,
        studentsCount: c.students.length,
        classesHeld: classSessions.length,
        attendanceRate,
      };
    });

    // Global combined counts
    const totalClassrooms = teacherClasses.length;
    let totalStudentsSum = teacherClasses.reduce((sum, c) => sum + c.students.length, 0);

    // Summing overall sessions
    const totalSessionsRecorded = sessions.filter((s) =>
      teacherClasses.some((tc) => tc.id === s.classroomId)
    ).length;

    res.json({
      totalClassrooms,
      totalStudentsSum,
      totalSessionsRecorded,
      classroomAnalytics,
    });
  });

  // Student cumulative history for student dashboard
  app.get("/api/analytics/student/:studentId", (req, res) => {
    const studentId = req.params.studentId;
    
    // Find all classes registered
    const studentClasses = classrooms.filter((c) => c.students.includes(studentId));

    // Walk sessions that contain records for this student
    const history: any[] = [];
    let presentCount = 0;
    let totalCount = 0;

    sessions.forEach((sess) => {
      const myRecord = sess.records.find((rec) => rec.studentId === studentId);
      if (myRecord) {
        const cls = classrooms.find((c) => c.id === sess.classroomId);
        if (cls) {
          totalCount++;
          if (myRecord.status === "present") presentCount++;

          history.push({
            sessionId: sess.id,
            classroomId: cls.id,
            classroomName: cls.name,
            subject: cls.subject,
            date: sess.date,
            status: myRecord.status,
          });
        }
      }
    });

    const averageRate = totalCount > 0 ? parseFloat(((presentCount / totalCount) * 100).toFixed(1)) : 0;

    res.json({
      studentId,
      classesCount: studentClasses.length,
      averageAttendancePercent: averageRate,
      presentCount,
      absentCount: totalCount - presentCount,
      history: history.sort((a,b) => b.date.localeCompare(a.date)), // Sort newest first
    });
  });

  // --- Grades API ---
  // Get assignments and grade records for a classroom
  app.get("/api/grades/classroom/:classroomId", (req, res) => {
    const { classroomId } = req.params;
    const classAssignments = assignments.filter((a) => a.classroomId === classroomId);
    const classGrades = gradeRecords.filter((g) => g.classroomId === classroomId);
    res.json({
      assignments: classAssignments,
      grades: classGrades,
    });
  });

  // Get grades for a specific student across all classrooms
  app.get("/api/grades/student/:studentId", (req, res) => {
    const { studentId } = req.params;
    const studentGrades = gradeRecords.filter((g) => g.studentId === studentId);
    const studentAssignments = assignments.filter((a) => studentGrades.some((g) => g.assignmentId === a.id));
    res.json({
      assignments: studentAssignments,
      grades: studentGrades,
    });
  });

  // Create or update an assignment
  app.post("/api/grades/assignment", (req, res) => {
    const { classroomId, title, maxPoints, dueDate, id } = req.body;

    if (!classroomId || !title || !maxPoints || !dueDate) {
      return res.status(400).json({ error: "Classroom ID, title, max points, and due date are required." });
    }

    if (id) {
      const idx = assignments.findIndex((a) => a.id === id);
      if (idx >= 0) {
        assignments[idx] = {
          ...assignments[idx],
          title,
          maxPoints: Number(maxPoints),
          dueDate,
        };
        return res.json({ success: true, assignment: assignments[idx] });
      }
    }

    const newId = "A" + String(assignments.length + 1).padStart(2, "0");
    const newAssignment = {
      id: newId,
      classroomId,
      title,
      maxPoints: Number(maxPoints),
      dueDate,
    };
    assignments.push(newAssignment);
    res.json({ success: true, assignment: newAssignment });
  });

  // Enter or update grade records
  app.post("/api/grades/record", (req, res) => {
    const { assignmentId, classroomId, studentId, score, remarks } = req.body;

    if (!assignmentId || !classroomId || !studentId || score === undefined) {
      return res.status(400).json({ error: "Assignment ID, classroom ID, student ID, and score are required." });
    }

    const existingIndex = gradeRecords.findIndex(
      (g) => g.assignmentId === assignmentId && g.studentId === studentId
    );

    const record = {
      id: existingIndex >= 0 ? gradeRecords[existingIndex].id : "G" + String(gradeRecords.length + 1).padStart(2, "0"),
      assignmentId,
      classroomId,
      studentId,
      score: Number(score),
      remarks: remarks || "",
    };

    if (existingIndex >= 0) {
      gradeRecords[existingIndex] = record;
    } else {
      gradeRecords.push(record);
    }

    res.json({ success: true, record });
  });

  // --- AI Insights API ---
  app.post("/api/ai/classroom-summary/:id", async (req, res) => {
    const classroomId = req.params.id;
    const classroom = classrooms.find((c) => c.id === classroomId);

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found for AI summarization." });
    }

    const { studentId } = { ...(req.query || {}), ...(req.body || {}) };

    const classSessions = sessions.filter((s) => s.classroomId === classroomId);
    const enrolledStudents = users.filter((u) => classroom.students.includes(u.id));
    const classAssignments = assignments.filter((a) => a.classroomId === classroomId);
    const classGrades = gradeRecords.filter((g) => g.classroomId === classroomId);

    const aiClient = getGeminiClient();
    if (aiClient) {
      try {
        let promptText = "";
        if (studentId) {
          const studentUser = users.find((u) => u.id === studentId);
          const studentSessions = classSessions.map((s) => ({
            date: s.date,
            status: s.records.find((r) => r.studentId === studentId)?.status || "absent"
          }));
          const studentGrades = classGrades.filter((g) => g.studentId === studentId).map((g) => {
            const asg = classAssignments.find((a) => a.id === g.assignmentId);
            return {
              title: asg ? asg.title : "Assessment",
              score: g.score,
              maxPoints: asg ? asg.maxPoints : 100,
              remarks: g.remarks || ""
            };
          });

          promptText = `You are an expert AI Academic Coach. Analyze the individual student's performance metrics for the course "${classroom.name}" and provide a deep summary, identified issues/learning blockers, and supportive, actionable study recommendations.
Student Information:
- Name: ${studentUser ? studentUser.name : "Student"}
- ID: ${studentId}

Individual Attendance Record History:
${JSON.stringify(studentSessions, null, 2)}

Logged Evaluation Grades Standard:
${JSON.stringify(studentGrades, null, 2)}

CRITICAL DIRECTIVE: You MUST analyze and discuss the student's assignment grades and evaluation scores ("marks") in detail. Mention specific marks, scores, and grade percentages achieved in your summary and recommendations. Do not limit your insights to attendance turnout; the user explicitly wants deep insight on assignment marks, graded outcomes, and instructor remarks.

In your analysis, ensure you:
1. Academic performance: Focus deeply on the student's assignment grades (both individual score standards and overall percentage grades).
2. Instructor remarks: Explicitly mention and address any specific remarks or critiques left by the instructor in their grade files.
3. Integration: Relate how attendance patterns are supporting or hindering their academic performance.
`;
        } else {
          promptText = `You are an expert AI Pedagogical Director. Analyze student attendance records and graded standard assignment metrics for course "${classroom.name}" and provide an overview summary, identified classroom issues (at-risk attendance or grade metrics), and teacher recommendations.
Classroom Info:
- Name: ${classroom.name}
- Subject: ${classroom.subject}
- Instructor: ${classroom.teacherName}

Recorded Attendance Sessions:
${JSON.stringify(classSessions, null, 2)}

Classroom Syllabus Assignments Outline:
${JSON.stringify(classAssignments, null, 2)}

Roster Graded Records:
${JSON.stringify(classGrades, null, 2)}

Enrolled Roster Student Profiles:
${JSON.stringify(enrolledStudents.map(s => ({ id: s.id, name: s.name, email: s.email })), null, 2)}

CRITICAL DIRECTIVE: You MUST analyze and discuss the marks and class-wide grades in detail. Mention specific evaluation names, graded averages, and percentage ranges in your summary, issues list, and recommendations. Do not limit your insights to class turnout; the user explicitly wants deep analysis of graded evaluations, marks, and academic standing trends.

In your analysis, ensure you:
1. Class-wide academic metrics: Analyze class grade averages, top-performing assignments, or assignment score gaps.
2. Low performers: Detect and highlight specific students whose overall or specific assignment grades fall below the 70% threshold.
3. Instructor Remarks: Compile and extract important comments or instructions left in the remarks section across different student grades.
4. Actionable recommendations: Suggest specific grade-improvement workshops, remedial efforts, or follow-ups on the feedback left in student remarks.
`;
        }

        let geminiResponse;
        const configSchema = {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "A comprehensive paragraphs-long analysis of class attendance trends, grading fluctuations, academic standards, and personal classroom engagement."
              },
              issues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key bullet point complaints, specific attendance anomalies, grade drops, or at-risk identifiers."
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Actionable concrete interventions the teacher or student could implement to progress further."
              }
            },
            required: ["summary", "issues", "recommendations"],
          },
        };

        try {
          geminiResponse = await aiClient.models.generateContent({
            model: "gemini-3.5-flash",
            contents: promptText,
            config: configSchema,
          });
        } catch (firstErr) {
          console.warn("🔄 Primary Gemini model busy or returned unavailable. Trying resilient backup model 'gemini-3.1-flash-lite'...");
          try {
            geminiResponse = await aiClient.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: promptText,
              config: configSchema,
            });
          } catch (secondErr) {
            console.warn("⚠️ Both primary and backup Gemini attempts occupied. Falling back smoothly to procedural generator.");
            geminiResponse = null;
          }
        }

        if (geminiResponse && geminiResponse.text) {
          try {
            const parsed = JSON.parse(geminiResponse.text.trim());
            return res.json(parsed);
          } catch (jsonErr) {
            console.warn("Parser warning: Failed to parse Gemini output as JSON, fallback to procedural:", (jsonErr as any).message || jsonErr);
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini call fell back to procedural:", (geminiErr as any).message || geminiErr);
      }
    }

    // High quality procedural analysis fallback
    const result = getProceduralSummary(classroom, classSessions, classAssignments, classGrades, studentId);
    res.json(result);
  });
  }

  // --- Vite Middleware Routing ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen on port if not running in Vercel serverless atmosphere
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[SCAS Express DevServer] Running on http://localhost:${PORT}`);
    });
  }

  return app;
})();

appPromise.catch((err) => {
  console.error("Failed to initialize server application", err);
});
