import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { StudentSummary, Classroom } from "../types";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { School, Award, Calendar, CheckCircle2, AlertTriangle, ChevronRight, BookOpen } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentSummary | null>(null);
  const [myClassrooms, setMyClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchStudentSummary = async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      // Parallel fetch cumulative metrics and actual classrooms list
      const [summaryRes, classesRes] = await Promise.all([
        axios.get(`/api/analytics/student/${user.id}`),
        axios.get(`/api/classrooms?userId=${user.id}`),
      ]);
      setData(summaryRes.data);
      setMyClassrooms(classesRes.data);
    } catch (e: any) {
      console.error(e);
      setErr("Failed to load student dashboard. Please sync again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentSummary();
  }, [user]);

  if (loading) {
    return <Loader message="Analyzing student files..." />;
  }

  if (err && !data) {
    return <ErrorMessage message={err} onRetry={fetchStudentSummary} />;
  }

  const attendancePercent = data?.averageAttendancePercent || 0;
  const historyList = data?.history || [];

  return (
    <div className="space-y-8 font-sans" id="student-dashboard-page">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome back, {user?.name || "Student"}
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Review your enrolled classes, status indices, and attendance record archives.
        </p>
      </div>

      {/* Cumulative Metrics Bento Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <School className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Enrolled Courses</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-0.5">{myClassrooms.length}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-sans">Attendance Ratio</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-0.5">{attendancePercent}%</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5.5 w-5.5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Present Markings</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-0.5">{data?.presentCount || 0}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5.5 w-5.5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Absent Markings</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-0.5">{data?.absentCount || 0}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Enrolled Courses Summary Grid Component */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950 mb-1">Enrolled Classrooms</h3>
            <p className="text-xs text-slate-400 font-medium">Classes you are active in this semester.</p>
          </div>

          <div className="mt-5 space-y-3.5 flex-1">
            {myClassrooms.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No active classroom registries.
              </div>
            ) : (
              myClassrooms.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative hover:border-blue-500 transition group flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                      {cls.name}
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400 leading-none">
                      Instructor: {cls.teacherName} • {cls.subject}
                    </span>
                  </div>
                  <Link
                    to={`/analytics/${cls.id}`}
                    className="p-1 text-slate-400 hover:text-blue-600 transition"
                    title="See detailed class visual metrics"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Timetable Attendance Evaluation History */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950 mb-1">Attendance Roll History</h3>
            <p className="text-xs text-slate-400 font-medium">Chronological evaluation logs filed for your profile.</p>
          </div>

          <div className="mt-5 overflow-x-auto flex-1">
            {historyList.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No attendance evaluation logs have been compiled for you yet.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-3 py-2.5">Class Subject / Code</th>
                    <th className="px-3 py-2.5">Course Name</th>
                    <th className="px-3 py-2.5 text-center">Session Date</th>
                    <th className="px-3 py-2.5 text-right">Status Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyList.map((hist) => (
                    <tr key={hist.sessionId} className="hover:bg-slate-50/50 transition">
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-600">{hist.subject}</span>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-900">{hist.classroomName}</td>
                      <td className="px-3 py-3 text-center text-slate-500 font-mono">
                        {hist.date}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hist.status === "present"
                            ? "bg-blue-50 text-blue-800 border border-blue-100"
                            : "bg-red-50 text-red-800 border border-red-100"
                        }`}>
                          {hist.status === "present" ? "Present ✔" : "Absent ✘"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
