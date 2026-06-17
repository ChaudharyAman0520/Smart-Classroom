import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Award, Users, BookOpen, Clock } from "lucide-react";
import { ClassroomAnalytics } from "../types";

interface AnalyticsChartProps {
  analytics: ClassroomAnalytics & {
    assignments?: {
      id: string;
      classroomId: string;
      title: string;
      maxPoints: number;
      dueDate: string;
    }[];
    grades?: {
      id: string;
      assignmentId: string;
      classroomId: string;
      studentId: string;
      score: number;
      remarks?: string;
    }[];
  };
  userRole?: string;
}

export default function AnalyticsChart({ analytics, userRole }: AnalyticsChartProps) {
  // Aggregate data for Pie Chart
  const pieData = [
    { name: "Present", value: analytics.summary.present, color: "#2563eb" }, // Blue-600
    { name: "Absent", value: analytics.summary.absent, color: "#dc2626" },   // Red-600
  ].filter(item => item.value > 0);

  // Fallback to empty if has no sessions
  const hasData = analytics.totalClassesHeld > 0;

  const isStudent = userRole === "student";

  return (
    <div className="space-y-8" id="scas-analytics-chart-container">
      {/* 4 Multi-Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {isStudent ? "My Attendance Rate" : "Average Attendance"}
            </p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{analytics.averageAttendance}%</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {isStudent ? "My Course Lectures" : "Lectures Evaluated"}
            </p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{analytics.totalClassesHeld}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-sans">
              {isStudent ? "My Present Days" : "Total Present Marks"}
            </p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{analytics.summary.present}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {isStudent ? "My Absent Days" : "Total Absent Marks"}
            </p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{analytics.summary.absent}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950 mb-1">
              {isStudent ? "My Attendance Timeline" : "Attendance Trend Analysis"}
            </h3>
            <p className="text-xs text-slate-400 font-medium">Session-by-session overview reflecting attendance percentages.</p>
          </div>
          <div className="h-80 w-full mt-6">
            {!hasData ? (
              <div className="flex h-full items-center justify-center text-slate-400 text-sm italic">
                No active session logs recorded for this classroom module.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.dailyHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" }}
                    labelClassName="text-slate-400 font-semibold text-xs mb-1"
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name={isStudent ? "My Attendance Status (%)" : "Attendance Rate (%)"}
                    stroke="#2563eb"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Breakdown Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950 mb-1">Presence Distribution</h3>
            <p className="text-xs text-slate-400 font-medium">Relative aggregate sharing of all evaluation records.</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center mt-4">
            {!hasData || pieData.length === 0 ? (
              <div className="text-slate-400 text-sm italic">
                No breakdown statistics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {hasData && (
            <div className="flex justify-around text-xs font-semibold uppercase tracking-wider text-slate-500 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                <span>Present ({analytics.summary.present})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-600" />
                <span>Absent ({analytics.summary.absent})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Marks / Grades Section */}
      {isStudent && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" id="student-marks-per-course-container">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
              <Award className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 leading-tight">My Graded Assessments & Marks</h3>
              <p className="text-xs text-slate-400 font-medium">Evaluation outcomes and instructors feedback responses for this course.</p>
            </div>
          </div>

          {!analytics.assignments || analytics.assignments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 italic font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No graded assignments or assessment rubrics are currently set for this syllabus.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold text-left">
                    <th className="px-4 py-3 text-xs uppercase tracking-wider">Assessment Title</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Due Date</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Your Score</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Max Points</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Percentage</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-left">Remarks & Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.assignments.map((asg) => {
                    const grade = analytics.grades?.find((g) => g.assignmentId === asg.id);
                    const percentage = grade ? (grade.score / asg.maxPoints) * 100 : null;

                    return (
                      <tr key={asg.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-800">{asg.title}</td>
                        <td className="px-4 py-3 text-center text-slate-500 font-mono text-xs">
                          {new Date(asg.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {grade ? (
                            <span className="font-extrabold text-blue-600">{grade.score}</span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not graded</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 font-medium font-mono">{asg.maxPoints}</td>
                        <td className="px-4 py-3 text-center">
                          {percentage !== null ? (
                            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-black leading-none ${
                              percentage >= 80 ? "bg-emerald-50 text-emerald-800" :
                              percentage >= 60 ? "bg-amber-50 text-amber-800" :
                              "bg-red-50 text-red-800"
                            }`}>
                              {percentage.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs font-mono">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-left">
                          {grade?.remarks ? (
                            <p className="text-xs text-slate-600 italic bg-blue-50/40 p-2 rounded-lg inline-block border border-blue-100/50">
                              "{grade.remarks}"
                            </p>
                          ) : grade ? (
                            <span className="text-xs text-slate-300 italic font-mono">No feedback provided</span>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Student Personal attendance registry logs list view (for students) */}
      {isStudent ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" id="student-attendance-log-container">
          <h3 className="text-base font-bold text-slate-950 mb-1">My Attendance Session Log</h3>
          <p className="text-xs text-slate-400 font-medium mb-4">Detailed chronological list of your turnout status for each held lecture.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold text-left">
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-right">Turnout Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.dailyHistory?.slice().reverse().map((day) => (
                  <tr key={day.date} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-800 font-mono text-xs">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black uppercase leading-none ${
                        day.present > 0
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200/55"
                          : "bg-red-50 text-red-800 border border-red-200/55"
                      }`}>
                        {day.present > 0 ? "Present" : "Absent"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-xs text-slate-500 text-right block">
                        {day.present > 0 ? "100%" : "0%"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Classroom Detailed Performance Data Grid (old standard view for teachers) */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-base font-bold text-slate-950 mb-4">Student Performance Ledger</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold text-left">
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Student Name</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Enrolled ID</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Sessions Held</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Present</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-center">Absent</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider text-right">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.studentPerformance?.map((stud) => (
                  <tr key={stud.studentId} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-800">{stud.studentName}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500 text-xs">{stud.studentId}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{stud.totalSessions}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-700">{stud.presentSessions}</td>
                    <td className="px-4 py-3 text-center font-semibold text-red-600">{stud.absentSessions}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold leading-none ${
                        stud.rate >= 75
                          ? "bg-emerald-50 text-emerald-800"
                          : stud.rate >= 50
                          ? "bg-amber-50 text-amber-800"
                          : "bg-red-50 text-red-800"
                      }`}>
                        {stud.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
