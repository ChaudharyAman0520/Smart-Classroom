import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { TeacherSummary } from "../types";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { School, Award, ClipboardCheck, ArrowRight, BookOpen, Users, PlusCircle, Sparkles, TrendingUp, Lightbulb, AlertTriangle, UserPlus, X, CheckCircle } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<TeacherSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Tab controls & student list state
  const [activeTab, setActiveTab] = useState<"classrooms" | "students">("classrooms");
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [searchStudent, setSearchStudent] = useState("");

  // Enrollment Modal States
  const [enrollClass, setEnrollClass] = useState<{ id: string; name: string } | null>(null);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollName, setEnrollName] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<{ enrollmentId: string; studentName: string; studentEmail: string; classroomId: string } | null>(null);

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollClass) return;
    if (!enrollEmail) {
      setEnrollError("Student email address is required.");
      return;
    }

    setIsEnrolling(true);
    setEnrollError(null);
    try {
      const res = await axios.post(`/api/classrooms/${enrollClass.id}/enroll`, {
        email: enrollEmail,
        name: enrollName,
      });
      if (res.data.success) {
        setEnrollSuccess({
          enrollmentId: res.data.enrollmentId,
          studentName: res.data.student.name,
          studentEmail: res.data.student.email,
          classroomId: enrollClass.id,
        });
        // Reload dashboard stats and student list if on student directory
        const response = await axios.get(`/api/analytics/teacher/${user?.id}`);
        setData(response.data);
        if (activeTab === "students") {
          fetchStudents();
        }
      } else {
        setEnrollError(res.data.error || "Enrollment failed.");
      }
    } catch (err: any) {
      console.error(err);
      setEnrollError(err.response?.data?.error || "Error enrolling student. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    setStudentsError(null);
    try {
      const response = await axios.get("/api/classrooms/students/all");
      setStudentsList(response.data);
    } catch (e: any) {
      console.error(e);
      setStudentsError("Could not retrieve the registered students directory.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchSummary = async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const response = await axios.get(`/api/analytics/teacher/${user.id}`);
      setData(response.data);
    } catch (e: any) {
      console.error(e);
      setErr("Failed to load teacher analytics summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [user]);

  useEffect(() => {
    if (activeTab === "students") {
      fetchStudents();
    }
  }, [activeTab]);

  if (loading) {
    return <Loader message="Compiling overall class reports..." />;
  }

  if (err && !data) {
    return <ErrorMessage message={err} onRetry={fetchSummary} />;
  }

  // Calculate cumulative average across all classes managed
  const classCount = data?.totalClassrooms || 0;
  const classesList = data?.classroomAnalytics || [];
  
  const totalRatePre = classesList.reduce((sum, item) => sum + item.attendanceRate, 0);
  const aggregateAverage = classesList.length > 0 ? Math.round(totalRatePre / classesList.length) : 0;

  return (
    <div className="space-y-8 font-sans" id="teacher-dashboard-page">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Hi, {user?.name || "Instructor"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Welcome back to the Smart Classroom Analytics control panel.
          </p>
        </div>
        
        <Link
          to="/create-classroom"
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs cursor-pointer self-start sm:self-center"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Classroom
        </Link>
      </div>

      {/* Hero Quick Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <School className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Classroom Modules</p>
            <h4 className="text-3xl font-black text-slate-900 mt-1">{classCount}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Aggregate Mean Average</p>
            <h4 className="text-3xl font-black text-slate-900 mt-1">
              {classesList.length > 0 ? `${aggregateAverage}%` : "0%"}
            </h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-sans">Lecture Directories Filed</p>
            <h4 className="text-3xl font-black text-slate-900 mt-1">
              {data?.totalSessionsRecorded || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* Dynamic 2-Column Bento section for AI Insights & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-bento-section">
        {/* Left Span: AI Attendance Insights Dashboard Widget */}
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 relative overflow-hidden shadow-xl" id="dashboard-ai-insights-widget">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 mb-5 border-b border-slate-800 pb-4">
            <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Sparkles className="h-5.5 w-5.5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-blue-400">Autonomous synthesis</span>
                <span className="inline-block h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-white">AI Attendance Insights</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
            {/* Trend descriptor */}
            <div className="p-3.5 bg-slate-800/80 border border-slate-750/50 rounded-2xl flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-slate-100">Attendance Stability Outlook</p>
                <p className="text-slate-300 mt-1.5 leading-relaxed font-medium">
                  Classroom attendance averages steady at <strong className="text-blue-400 text-sm font-black">{classesList.length > 0 ? `${aggregateAverage}%` : "0%"}</strong>. Weekly logs reveal high participation during initial sessions, with subtle risk thresholds met in mid-week chemistry slots.
                </p>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="p-3.5 bg-slate-800/80 border border-slate-750/50 rounded-2xl flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-slate-100">Smart Action Items</p>
                <ul className="space-y-1 text-slate-300 mt-1.5 list-disc pl-3 text-[11px] font-medium leading-relaxed">
                  <li>Send alert notifications directly to students displaying metrics under 80%.</li>
                  <li>Incorporate office hour checkins following low-turnout slots.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Risk indicators list */}
          <div className="pt-3 border-t border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              Active Attendance Risk Alerts ({classesList.filter(c => c.attendanceRate < 80).length})
            </p>
            <div className="space-y-2">
              {classesList.filter(c => c.attendanceRate < 80).map((c, i) => (
                <div key={i} className="px-3 py-2 bg-red-950/25 border border-red-900/30 rounded-xl text-xs text-red-200 flex items-center justify-between">
                  <span>Course Warning: Class <strong>{c.classroomName}</strong> matches under 80% attendance limit ({c.attendanceRate}%)</span>
                  <Link to={`/ai-insights/${c.classroomId}`} className="text-[10px] bg-red-900/40 px-2.5 py-1 rounded-md hover:bg-red-900/60 text-red-300 font-bold flex items-center gap-1 shrink-0 transition" id={`alert-warn-link-${i}`}>
                    Diagnose <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              ))}
              {classesList.filter(c => c.attendanceRate < 80).length === 0 && (
                <div className="px-3 py-2 bg-slate-850 border border-slate-800 rounded-xl text-xs text-slate-400">
                  No active low-attendance course warnings found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Span: Recent Activity logs */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between" id="dashboard-recent-activity">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Activity Log</h3>
              <p className="text-xs text-slate-400 font-medium">Real-time chronicle of transactions and changes.</p>
            </div>

            <div className="space-y-4">
              {classesList.length > 0 ? (
                <>
                  <div className="flex gap-3 relative pb-4 before:content-[''] before:absolute before:left-3.5 before:top-8 before:bottom-0 before:w-0.5 before:bg-slate-100">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-extrabold text-slate-800">Academic Portal Active</p>
                      <p className="text-slate-500 mt-0.5">Courses and roster state engines online.</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Real-time Tracker</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No recent ledger transaction records found. Create a classroom above to get started.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-5 text-center">
            <Link to="/ai-insights" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition">
              View all AI reports
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Switcher & Data Views */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-150 bg-slate-50/50 px-5 pt-3">
          <button
            onClick={() => setActiveTab("classrooms")}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-colors duration-150 cursor-pointer ${
              activeTab === "classrooms"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            My Classrooms ({classesList.length})
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "students"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            id="tab-students"
          >
            <Users className="h-4 w-4" />
            Student Directory
          </button>
        </div>

        <div className="p-5">
          {activeTab === "classrooms" ? (
            <div>
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-950">Evaluating Classrooms Summary</h3>
                <p className="text-xs text-slate-400 font-medium">Overview ledger tracking attendance performance across modules.</p>
              </div>

              {classesList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <School className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-semibold">No classrooms are registered under your name.</p>
                  <Link
                    to="/create-classroom"
                    className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    Configure your first class roster right now
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold">
                        <th className="px-4 py-3.5 text-xs uppercase tracking-wider">Classroom Code & Title</th>
                        <th className="px-4 py-3.5 text-xs uppercase tracking-wider">Core Course Subject</th>
                        <th className="px-4 py-3.5 text-xs uppercase tracking-wider text-center">Student Roster</th>
                        <th className="px-4 py-3.5 text-xs uppercase tracking-wider text-center">Classes Run</th>
                        <th className="px-4 py-3.5 text-xs uppercase tracking-wider text-center">Mean Margin</th>
                        <th className="px-4 py-3.5 text-xs uppercase tracking-wider text-right">Administrative</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classesList.map((cls) => (
                        <tr key={cls.classroomId} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-900">{cls.classroomName}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cls.classroomId}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-semibold text-slate-600">{cls.subject}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center gap-1 text-slate-700 font-bold bg-slate-100 py-1 px-2.5 rounded-md text-xs">
                              <Users className="h-3 w-3 text-slate-400" />
                              {cls.studentsCount}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-slate-600 font-medium">
                            {cls.classesHeld} Sessions
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ${
                              cls.attendanceRate >= 75
                                ? "bg-emerald-50 text-emerald-800"
                                : cls.attendanceRate >= 50
                                ? "bg-amber-50 text-amber-800"
                                : "bg-red-50 text-red-800"
                            }`}>
                              {cls.attendanceRate}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2 text-xs">
                              <button
                                onClick={() => {
                                  setEnrollClass({ id: cls.classroomId, name: cls.classroomName });
                                  setEnrollEmail("");
                                  setEnrollName("");
                                  setEnrollSuccess(null);
                                  setEnrollError(null);
                                }}
                                className="font-bold text-emerald-600 hover:text-emerald-800 hover:underline px-2 py-1 rounded cursor-pointer"
                              >
                                Register Student
                              </button>
                              <Link
                                to={`/attendance/${cls.classroomId}`}
                                className="font-bold text-slate-900 hover:text-blue-700 hover:underline px-2 py-1 rounded"
                              >
                                Mark Attendance
                              </Link>
                              <Link
                                to={`/analytics/${cls.classroomId}`}
                                className="font-bold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded"
                              >
                                Insights
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Institutional Student Directory</h3>
                  <p className="text-xs text-slate-400 font-medium">Manage and audit all registered student information across departments.</p>
                </div>
                <input
                  type="text"
                  placeholder="Filter students by name or email..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium w-full sm:w-64"
                  id="student-search-input"
                />
              </div>

              {loadingStudents ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium animate-pulse">
                  Querying server registry files...
                </div>
              ) : studentsError ? (
                <div className="p-4 bg-red-50 text-red-800 text-xs font-semibold rounded-xl border border-red-100">
                  {studentsError}
                </div>
              ) : (
                (() => {
                  const filtered = studentsList.filter(
                    (s) =>
                      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
                      s.email.toLowerCase().includes(searchStudent.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <Users className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-xs font-semibold">
                          No student accounts match "{searchStudent}"
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold">
                            <th className="px-4 py-3.5 text-xs uppercase tracking-wider">Student Name</th>
                            <th className="px-4 py-3.5 text-xs uppercase tracking-wider">Institutional Email</th>
                            <th className="px-4 py-3.5 text-xs uppercase tracking-wider">Enrolled Course Profiles</th>
                            <th className="px-4 py-3.5 text-xs uppercase tracking-wider text-right">Quick Register</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filtered.map((student) => (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs capitalize">
                                    {student.name.slice(0, 2)}
                                  </div>
                                  <span className="font-bold text-slate-900">{student.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="font-mono text-xs text-slate-500 font-medium">{student.email}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-wrap gap-1">
                                  {student.classrooms && student.classrooms.length > 0 ? (
                                    student.classrooms.map((c: any) => (
                                      <span
                                        key={c.id}
                                        className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]"
                                      >
                                        {c.name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-[11px] italic font-medium">
                                      Not enrolled in any classrooms
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {classesList.length > 0 ? (
                                  <select
                                    defaultValue=""
                                    onChange={async (e) => {
                                      const classroomId = e.target.value;
                                      if (!classroomId) return;
                                      const cls = classesList.find((c) => c.classroomId === classroomId);
                                      if (!cls) return;

                                      try {
                                        await axios.post(`/api/classrooms/${classroomId}/enroll`, {
                                          email: student.email,
                                          name: student.name,
                                        });
                                        fetchStudents();
                                        fetchSummary();
                                        alert(`Registered ${student.name} in "${cls.classroomName}" successfully!`);
                                      } catch (err: any) {
                                        alert(err.response?.data?.error || "Error enrolling student.");
                                      }
                                      e.target.value = "";
                                    }}
                                    className="text-xs bg-slate-50 border border-slate-250 hover:bg-slate-100 rounded-lg py-1 px-2.5 font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                  >
                                    <option value="">+ Enroll in Class...</option>
                                    {classesList.map((c) => (
                                      <option key={c.classroomId} value={c.classroomId}>
                                        {c.classroomName}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-slate-350 text-[11px] font-medium">Create a class first</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>

      {/* Premium Register/Enroll Student Backdrop Modal */}
      {enrollClass && (
        <div id="enroll-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <button
              onClick={() => setEnrollClass(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Register Student</h3>
                  <p className="text-xs text-slate-500 font-medium">Add student to specific classroom roster</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classroom Details</div>
                <div className="text-sm font-bold text-slate-800 mt-1">{enrollClass.name}</div>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-blue-50 text-blue-800 text-[11px] font-mono rounded font-medium">
                  Classroom ID: {enrollClass.id}
                </div>
              </div>

              {enrollSuccess ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-slide-up">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="grow">
                      <div className="text-sm font-extrabold text-emerald-900">Successfully Registered!</div>
                      <p className="text-xs text-emerald-800 mt-1">
                        Student <strong>{enrollSuccess.studentName}</strong> has been enrolled successfully in the classroom list.
                      </p>
                      
                      <div className="mt-3 pt-3 border-t border-emerald-100/50 space-y-2">
                        <div>
                          <span className="block text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Registered Email</span>
                          <span className="text-xs font-medium text-slate-700">{enrollSuccess.studentEmail}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Classroom ID</span>
                          <span className="text-xs font-mono font-medium text-slate-700">{enrollSuccess.classroomId}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Enrollment ID (24-character Hex)</span>
                          <span className="text-xs font-mono font-bold text-emerald-900 select-all">{enrollSuccess.enrollmentId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnrollClass(null)}
                    className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnrollSubmit} className="space-y-4">
                  {enrollError && (
                    <div className="p-3 bg-red-50 text-red-800 text-xs font-medium rounded-xl border border-red-100">
                      {enrollError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Student Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Johnathan Doe"
                      value={enrollName}
                      onChange={(e) => setEnrollName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Student Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@scas.edu"
                      value={enrollEmail}
                      onChange={(e) => setEnrollEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      If no user matches this email, a new student account will be registered automatically with a default password.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEnrollClass(null)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEnrolling}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isEnrolling ? "Registering..." : "Register Student"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
