import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Classroom name is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Classroom", classroomSchema);
