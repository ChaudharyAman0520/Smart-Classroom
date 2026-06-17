import mongoose from "mongoose";
import User from "../models/User.js";
import Classroom from "../models/Classroom.js";
import Attendance from "../models/Attendance.js";
import Assignment from "../models/Assignment.js";
import Grade from "../models/Grade.js";
import bcrypt from "bcryptjs";

// Automated DB Seeder for clean initial setups or local machine testing
const seedDatabase = async () => {
  try {
    const classroomCount = await Classroom.countDocuments();
    const userCount = await User.countDocuments();

    // Only seed if no classrooms exist to protect existing work on restarts
    if (classroomCount > 0 && userCount > 1) {
      console.log("ℹ️ Database already has records. Skipping automated demo seeding.");
      return;
    }

    console.log("🧹 Flushing database... Seeding rich, realistic classroom profiles, attendance records, and assignment marks!");
    
    // Clear all existing data across all collections for a fresh start
    await User.deleteMany({});
    await Classroom.deleteMany({});
    await Attendance.deleteMany({});
    await Assignment.deleteMany({});
    await Grade.deleteMany({});

    console.log("🌱 Seeding classroom demo data...");

    // Standard local dev password pass-key is "password"
    const passwordHash = await bcrypt.hash("password", 10);

    // 1. Create Teacher Account
    const teacher = await User.create({
      name: "Dr. Sarah Jenkins",
      email: "teacher@scas.edu",
      role: "teacher",
      password: passwordHash,
    });

    // 2. Create Student Accounts
    const student1 = await User.create({
      name: "Aman Chaudhary",
      email: "student@scas.edu",
      role: "student",
      password: passwordHash,
    });

    const student2 = await User.create({
      name: "Emma Watson",
      email: "emma@scas.edu",
      role: "student",
      password: passwordHash,
    });

    const student3 = await User.create({
      name: "John Doe",
      email: "john@scas.edu",
      role: "student",
      password: passwordHash,
    });

    // 3. Create Classroom Space and enroll students
    const classroom = await Classroom.create({
      className: "Advanced Calculus (MATH-301)",
      subject: "Mathematics",
      teacher: teacher._id,
      students: [student1._id, student2._id, student3._id],
    });

    // 4. Create Evaluation Assignments
    const asg1 = await Assignment.create({
      classroom: classroom._id,
      title: "Midterm Exam",
      maxPoints: 100,
      dueDate: "2026-06-30",
    });

    const asg2 = await Assignment.create({
      classroom: classroom._id,
      title: "Homework 1 - Derivations",
      maxPoints: 50,
      dueDate: "2026-06-20",
    });

    const asg3 = await Assignment.create({
      classroom: classroom._id,
      title: "Homework 2 - Integrals",
      maxPoints: 50,
      dueDate: "2026-07-15",
    });

    // 5. Create Grade Marks Records
    // Aman Chaudhary - Perfect/Excellent Standing
    await Grade.create({
      assignment: asg1._id,
      classroom: classroom._id,
      student: student1._id,
      score: 92,
      remarks: "Outstanding analytical skill shown! Perfect proofs.",
    });
    await Grade.create({
      assignment: asg2._id,
      classroom: classroom._id,
      student: student1._id,
      score: 46,
      remarks: "Excellent derivations and clear layout.",
    });

    // Emma Watson - Good Standing
    await Grade.create({
      assignment: asg1._id,
      classroom: classroom._id,
      student: student2._id,
      score: 85,
      remarks: "Great work, very accurate calculations.",
    });
    await Grade.create({
      assignment: asg2._id,
      classroom: classroom._id,
      student: student2._id,
      score: 45,
      remarks: "Clear reasoning in solutions.",
    });

    // John Doe - Critical Warning Risks
    await Grade.create({
      assignment: asg1._id,
      classroom: classroom._id,
      student: student3._id,
      score: 58,
      remarks: "Low score standard. Requires practice with trigonometry-based integrations.",
    });
    await Grade.create({
      assignment: asg2._id,
      classroom: classroom._id,
      student: student3._id,
      score: 28,
      remarks: "Incomplete assignment submitted. Please visit office hours to review calculus rules.",
    });

    // 6. Create Historical Attendance (5 sessions)
    const dates = [
      new Date("2026-06-01T10:00:00Z"),
      new Date("2026-06-03T10:00:00Z"),
      new Date("2026-06-08T10:00:00Z"),
      new Date("2026-06-10T10:00:00Z"),
      new Date("2026-06-15T10:00:00Z"),
    ];

    for (const date of dates) {
      // Aman (100% Attendance)
      await Attendance.create({
        classroom: classroom._id,
        student: student1._id,
        date: date,
        status: "Present",
      });

      // Emma (80% Attendance)
      const isEmmaPresent = date.getUTCDate() !== 10;
      await Attendance.create({
        classroom: classroom._id,
        student: student2._id,
        date: date,
        status: isEmmaPresent ? "Present" : "Absent",
      });

      // John Doe (20% Attendance)
      const isJohnPresent = date.getUTCDate() === 3;
      await Attendance.create({
        classroom: classroom._id,
        student: student3._id,
        date: date,
        status: isJohnPresent ? "Present" : "Absent",
      });
    }

    console.log("✨ MongoDB database successfully populated with comprehensive classrooms, students, attendance logs, assignments, grades, and comments!");
  } catch (err) {
    console.error("❌ Auto-seeding database failed:", err.message);
  }
};

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.warn("\n========================================================");
    console.warn("⚠️  WARNING: MONGO_URI environment variable is not defined!");
    console.warn("MongoDB Atlas connection skipped. Please configure MONGO_URI in .env.");
    console.warn("========================================================\n");
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    
    // Seed database asynchronously
    seedDatabase().catch((err) => console.error("Async seed failed:", err));
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not crash the process so the environment's live dev server keeps running
    return null;
  }
};
