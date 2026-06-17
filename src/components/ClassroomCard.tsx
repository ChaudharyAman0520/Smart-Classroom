import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Award, ArrowRight } from "lucide-react";
import { Classroom } from "../types";

interface ClassroomCardProps {
  classroom: Classroom;
  role: "teacher" | "student";
}

export default function ClassroomCard({ classroom, role }: ClassroomCardProps) {
  return (
    <div
      id={`classroom-card-${classroom.id}`}
      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
            {classroom.code || classroom.id}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {classroom.subject}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
          {classroom.name}
        </h3>

        <div className="mt-4 space-y-2.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="font-medium text-slate-800">{classroom.subject}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              <strong>{classroom.students?.length || 0}</strong> Students enrolled
            </span>
          </div>

          {role === "student" && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-2 text-xs">
              <span className="text-slate-400">Instructor:</span>
              <span className="font-semibold text-slate-700">{classroom.teacherName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
        <Link
          to={`/analytics/${classroom.id}`}
          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
        >
          <Award className="h-3.5 w-3.5" />
          Analytics
        </Link>

        {role === "teacher" ? (
          <Link
            to={`/attendance/${classroom.id}`}
            className="inline-flex items-center justify-center gap-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Mark Run
            <ArrowRight className="h-3 w-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <div className="text-right flex items-center justify-end">
            <span className="text-xs font-medium text-slate-400">Enrolled ✔</span>
          </div>
        )}
      </div>
    </div>
  );
}
