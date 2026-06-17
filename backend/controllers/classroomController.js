import Classroom from "../models/Classroom.js";
import User from "../models/User.js";
import { AppError } from "../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Helper to extract clean classroom course code from dynamic course titles
export const getCode = (className, mongoId) => {
  if (className && className.includes(":")) {
    const part = className.split(":")[0].trim();
    if (part.length > 0 && part.length < 12) return part;
  }
  // Fallback to "C-" + last 4 uppercase characters of MongoDB ID
  return "C-" + mongoId.toString().slice(-4).toUpperCase();
};

// Create Classroom
// POST /api/classrooms
export const createClassroom = async (req, res, next) => {
  try {
    const { className, name, subject, teacherId, students } = req.body;
    const resolvedClassName = className || name;

    if (!resolvedClassName || !subject || !teacherId) {
      throw new AppError("Classroom name, subject, and teacher reference are required.", 400);
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new AppError("Invalid or unauthorized teacher ID.", 400);
    }

    // Resolve student list if provided as email strings or IDs, default to empty list
    let studentIds = [];
    if (Array.isArray(students)) {
      for (const std of students) {
        // Can be ID or email
        if (std.includes && std.includes("@")) {
          const sUser = await User.findOne({ email: std.toLowerCase(), role: "student" });
          if (sUser) studentIds.push(sUser._id);
        } else {
          studentIds.push(std);
        }
      }
    }

    const classroom = await Classroom.create({
      className: resolvedClassName,
      subject,
      teacher: teacherId,
      students: studentIds,
    });

    res.status(201).json({
      success: true,
      data: {
        id: classroom._id,
        name: classroom.className,
        code: getCode(classroom.className, classroom._id),
        subject: classroom.subject,
        teacherId: classroom.teacher,
        teacherName: teacher.name,
        students: classroom.students,
      },
    });
  } catch (error) {
    next(error);
  }
};

// View own classrooms or general list
// GET /api/classrooms
export const getClassrooms = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      throw new AppError("Query parameter 'userId' is required.", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("Requesting user profile could not be located.", 404);
    }

    let filter = {};
    if (user.role === "teacher") {
      filter = { teacher: userId };
    } else {
      filter = { students: userId };
    }

    const classroomsList = await Classroom.find(filter)
      .populate("teacher", "name")
      .populate("students", "name email");

    const mappedClassrooms = classroomsList.map((classroom) => {
      // Map structures directly to maintain full client-side presentation compatibility
      return {
        id: classroom._id.toString(),
        name: classroom.className,
        code: getCode(classroom.className, classroom._id),
        subject: classroom.subject,
        teacherId: classroom.teacher?._id?.toString() || classroom.teacher?.toString() || "",
        teacherName: classroom.teacher?.name || "Dr. Sarah Jenkins",
        students: classroom.students.map((s) => s._id ? s._id.toString() : s.toString()),
        studentDetails: classroom.students.map((s) => ({
          id: s._id ? s._id.toString() : s.toString(),
          name: s.name || s.email?.split("@")[0] || "Student",
          email: s.email || ""
        })),
      };
    });

    res.status(200).json(mappedClassrooms);
  } catch (error) {
    next(error);
  }
};

// View single classroom
// GET /api/classrooms/:id
export const getClassroomById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findById(id)
      .populate("teacher", "name")
      .populate("students", "name email");

    if (!classroom) {
      throw new AppError("Course code not found or invalid.", 404);
    }

    const mapped = {
      id: classroom._id.toString(),
      name: classroom.className,
      code: getCode(classroom.className, classroom._id),
      subject: classroom.subject,
      teacherId: classroom.teacher?._id?.toString() || classroom.teacher?.toString() || "",
      teacherName: classroom.teacher?.name || "Dr. Sarah Jenkins",
      students: classroom.students.map((s) => s._id ? s._id.toString() : s.toString()),
      studentDetails: classroom.students.map((s) => ({
        id: s._id ? s._id.toString() : s.toString(),
        name: s.name || s.email?.split("@")[0] || "Student",
        email: s.email || ""
      })),
    };

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

// Register/Enroll Student to a classroom
// POST /api/classrooms/:classroomId/enroll
export const enrollStudent = async (req, res, next) => {
  try {
    const { classroomId } = req.params;
    const { email, name } = req.body;

    if (!email) {
      throw new AppError("Student email is required for registration.", 400);
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      throw new AppError("Classroom matches no active record.", 404);
    }

    // Find student or auto-create them
    let student = await User.findOne({ email: email.toLowerCase() });
    if (!student) {
      // Hash a default password for the new student
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password", salt);

      student = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "student",
      });
    }

    if (student.role !== "student") {
      throw new AppError("The email entered belongs to a non-student account.", 400);
    }

    // Check if student is already in the class
    const isEnrolled = classroom.students.some((sId) => sId.toString() === student._id.toString());
    if (isEnrolled) {
      throw new AppError("Student is already registered to this classroom.", 400);
    }

    classroom.students.push(student._id);
    await classroom.save();

    // Generate a simple, everyday enrollment code instead of 24-character hexadecimal MongoDB ObjectId
    const enrollmentId = "ENR-" + Math.floor(1000 + Math.random() * 9000);

    res.status(200).json({
      success: true,
      message: `Successfully registered student ${student.name} to classroom.`,
      enrollmentId,
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// View all students for administrative view
// GET /api/classrooms/students/all
export const getAllStudents = async (req, res, next) => {
  try {
    const studentsList = await User.find({ role: "student" }).select("name email");
    const classroomsList = await Classroom.find({});

    const mapped = studentsList.map((s) => {
      const studentIdStr = s._id.toString();
      const sClassrooms = classroomsList.filter((c) =>
        c.students.some((stdId) => stdId.toString() === studentIdStr)
      );

      return {
        id: studentIdStr,
        name: s.name,
        email: s.email,
        classrooms: sClassrooms.map((c) => ({
          id: c._id.toString(),
          name: c.className
        }))
      };
    });

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

