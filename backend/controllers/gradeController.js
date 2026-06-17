import Assignment from "../models/Assignment.js";
import Grade from "../models/Grade.js";
import Classroom from "../models/Classroom.js";
import User from "../models/User.js";
import { AppError } from "../utils/errorHandler.js";
import mongoose from "mongoose";

// Get assignments and grades for a specific classroom
// GET /api/grades/classroom/:classroomId
export const getGradesByClassroom = async (req, res, next) => {
  try {
    const { classroomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      throw new AppError("Invalid Classroom ID format.", 400);
    }

    const assignments = await Assignment.find({ classroom: classroomId });
    const grades = await Grade.find({ classroom: classroomId });

    const mappedAssignments = assignments.map((a) => ({
      id: a._id.toString(),
      classroomId: a.classroom.toString(),
      title: a.title,
      maxPoints: a.maxPoints,
      dueDate: a.dueDate,
    }));

    const mappedGrades = grades.map((g) => ({
      id: g._id.toString(),
      assignmentId: g.assignment.toString(),
      classroomId: g.classroom.toString(),
      studentId: g.student.toString(),
      score: g.score,
      remarks: g.remarks || "",
    }));

    res.status(200).json({
      assignments: mappedAssignments,
      grades: mappedGrades,
    });
  } catch (error) {
    next(error);
  }
};

// Get grades and assignments for a student across all classrooms
// GET /api/grades/student/:studentId
export const getGradesByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError("Invalid Student ID format.", 400);
    }

    const grades = await Grade.find({ student: studentId });
    
    const assignmentIds = grades.map((g) => g.assignment);
    const assignments = await Assignment.find({ _id: { $in: assignmentIds } });

    const mappedAssignments = assignments.map((a) => ({
      id: a._id.toString(),
      classroomId: a.classroom.toString(),
      title: a.title,
      maxPoints: a.maxPoints,
      dueDate: a.dueDate,
    }));

    const mappedGrades = grades.map((g) => ({
      id: g._id.toString(),
      assignmentId: g.assignment.toString(),
      classroomId: g.classroom.toString(),
      studentId: g.student.toString(),
      score: g.score,
      remarks: g.remarks || "",
    }));

    res.status(200).json({
      assignments: mappedAssignments,
      grades: mappedGrades,
    });
  } catch (error) {
    next(error);
  }
};

// Create or update an assignment
// POST /api/grades/assignment
export const createOrUpdateAssignment = async (req, res, next) => {
  try {
    const { classroomId, title, maxPoints, dueDate, id } = req.body;

    if (!classroomId || !title || !maxPoints || !dueDate) {
      throw new AppError("Classroom ID, title, max points, and due date are required.", 400);
    }

    if (id && mongoose.Types.ObjectId.isValid(id)) {
      const updatedAssignment = await Assignment.findByIdAndUpdate(
        id,
        {
          title,
          maxPoints: Number(maxPoints),
          dueDate,
        },
        { new: true }
      );
      if (updatedAssignment) {
        return res.status(200).json({
          success: true,
          assignment: {
            id: updatedAssignment._id.toString(),
            classroomId: updatedAssignment.classroom.toString(),
            title: updatedAssignment.title,
            maxPoints: updatedAssignment.maxPoints,
            dueDate: updatedAssignment.dueDate,
          },
        });
      }
    }

    const newAssignment = await Assignment.create({
      classroom: classroomId,
      title,
      maxPoints: Number(maxPoints),
      dueDate,
    });

    res.status(201).json({
      success: true,
      assignment: {
        id: newAssignment._id.toString(),
        classroomId: newAssignment.classroom.toString(),
        title: newAssignment.title,
        maxPoints: newAssignment.maxPoints,
        dueDate: newAssignment.dueDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Enter or update grade records for students
// POST /api/grades/record
export const createOrUpdateGradeRecord = async (req, res, next) => {
  try {
    const { assignmentId, classroomId, studentId, score, remarks } = req.body;

    if (!assignmentId || !classroomId || !studentId || score === undefined) {
      throw new AppError("Assignment ID, classroom ID, student ID, and score are required.", 400);
    }

    const updatedGrade = await Grade.findOneAndUpdate(
      {
        assignment: assignmentId,
        student: studentId,
      },
      {
        classroom: classroomId,
        score: Number(score),
        remarks: remarks || "",
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      record: {
        id: updatedGrade._id.toString(),
        assignmentId: updatedGrade.assignment.toString(),
        classroomId: updatedGrade.classroom.toString(),
        studentId: updatedGrade.student.toString(),
        score: updatedGrade.score,
        remarks: updatedGrade.remarks || "",
      },
    });
  } catch (error) {
    next(error);
  }
};
