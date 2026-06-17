import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import {
  Award,
  PlusCircle,
  Save,
  BookOpen,
  Users,
  CheckCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Percent,
  ListPlus,
  ArrowRight,
  HelpCircle,
  X,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";
import { Classroom, Assignment, GradeRecord } from "../types";

export default function Grades() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>([]);
  const [gradesList, setGradesList] = useState<GradeRecord[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  // Assignment Modal/Inline Create State
  const [isCreatingAssignment, setIsCreatingAssignment] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newMaxPoints, setNewMaxPoints] = useState<number>(100);
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [creatingError, setCreatingError] = useState<string | null>(null);

  // Grade Edit Overlay State
  const [activeCellEdit, setActiveCellEdit] = useState<{
    studentId: string;
    studentName: string;
    assignmentId: string;
    assignmentTitle: string;
    score: number;
    remarks: string;
  } | null>(null);
  const [savingGrade, setSavingGrade] = useState<boolean>(false);
  const [gradeEditError, setGradeEditError] = useState<string | null>(null);

  // Load classrooms list
  const fetchClassrooms = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setErrorHeader(null);
      const res = await axios.get(`/api/classrooms?userId=${user.id}`);
      setClassrooms(res.data);
      if (res.data.length > 0) {
        setSelectedClassId(res.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorHeader("Failed to retrieve course list records.");
      setLoading(false);
    }
  };

  // Load grade stats for selected classroom
  const fetchGradesData = async () => {
    if (!selectedClassId) return;
    try {
      const res = await axios.get(`/api/grades/classroom/${selectedClassId}`);
      setAssignmentsList(res.data.assignments || []);
      setGradesList(res.data.grades || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  useEffect(() => {
    if (selectedClassId) {
      fetchGradesData();
    }
  }, [selectedClassId]);

  const activeClassroom = classrooms.find((c) => c.id === selectedClassId);

  // Create Assignment Action Handler
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    if (!newTitle.trim()) {
      setCreatingError("Please provide an assignment or assessment title.");
      return;
    }
    if (Number(newMaxPoints) <= 0) {
      setCreatingError("Max possible points must be positive score.");
      return;
    }
    if (!newDueDate) {
      setCreatingError("Please select a target deadline date.");
      return;
    }

    setCreatingError(null);
    try {
      const res = await axios.post("/api/grades/assignment", {
        classroomId: selectedClassId,
        title: newTitle.trim(),
        maxPoints: Number(newMaxPoints),
        dueDate: newDueDate,
      });

      if (res.data.success) {
        setAssignmentsList((prev) => [...prev, res.data.assignment]);
        setIsCreatingAssignment(false);
        setNewTitle("");
        setNewMaxPoints(100);
        setNewDueDate("");
        // Reload all data to ensure indices are consistent
        fetchGradesData();
      }
    } catch (err: any) {
      console.error(err);
      setCreatingError(err.response?.data?.error || "Failed to catalog assignment description.");
    }
  };

  // Save specific student grade
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCellEdit) return;

    const assignment = assignmentsList.find((a) => a.id === activeCellEdit.assignmentId);
    if (!assignment) return;

    if (activeCellEdit.score < 0 || activeCellEdit.score > assignment.maxPoints) {
      setGradeEditError(`Score must be between 0 and the maximum score of ${assignment.maxPoints}.`);
      return;
    }

    setGradeEditError(null);
    setSavingGrade(true);
    try {
      const res = await axios.post("/api/grades/record", {
        assignmentId: activeCellEdit.assignmentId,
        classroomId: selectedClassId,
        studentId: activeCellEdit.studentId,
        score: activeCellEdit.score,
        remarks: activeCellEdit.remarks,
      });

      if (res.data.success) {
        // Update local state list
        setGradesList((prev) => {
          const idx = prev.findIndex(
            (g) => g.assignmentId === activeCellEdit.assignmentId && g.studentId === activeCellEdit.studentId
          );
          const updated = [...prev];
          if (idx >= 0) {
            updated[idx] = res.data.record;
          } else {
            updated.push(res.data.record);
          }
          return updated;
        });
        setActiveCellEdit(null);
      }
    } catch (err: any) {
      console.error(err);
      setGradeEditError(err.response?.data?.error || "Failed to record student performance entry.");
    } finally {
      setSavingGrade(false);
    }
  };

  // Student specific calculations
  const getOverallPerformance = () => {
    if (!user || user.role === "teacher" || assignmentsList.length === 0) return { percent: 0, grade: "N/A" };

    let earnedSum = 0;
    let possibleSum = 0;

    assignmentsList.forEach((asg) => {
      const gr = gradesList.find((g) => g.assignmentId === asg.id && g.studentId === user.id);
      if (gr) {
        earnedSum += gr.score;
        possibleSum += asg.maxPoints;
      }
    });

    if (possibleSum === 0) return { percent: 0, grade: "N/A" };
    const pct = Math.round((earnedSum / possibleSum) * 100);

    let ltr = "F";
    if (pct >= 90) ltr = "A";
    else if (pct >= 80) ltr = "B";
    else if (pct >= 70) ltr = "C";
    else if (pct >= 60) ltr = "D";

    return { percent: pct, grade: ltr };
  };

  // Convert points to a dynamic Grade letter
  const getGradeLetter = (score: number, maxPoints: number) => {
    const pct = (score / maxPoints) * 100;
    if (pct >= 90) return { letter: "A", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (pct >= 80) return { letter: "B", color: "text-blue-600 bg-blue-50 border-blue-200" };
    if (pct >= 70) return { letter: "C", color: "text-amber-600 bg-amber-50 border-amber-200" };
    if (pct >= 60) return { letter: "D", color: "text-orange-600 bg-orange-50 border-orange-200" };
    return { letter: "F", color: "text-rose-600 bg-rose-50 border-rose-200" };
  };

  // Dynamic Chart arrays formatted for Recharts Receptacles
  const getTeacherChartData = () => {
    return assignmentsList.map((asg) => {
      const recordsForAsg = gradesList.filter((g) => g.assignmentId === asg.id);
      const averagePoints =
        recordsForAsg.length > 0
          ? parseFloat(
              (recordsForAsg.reduce((sum, g) => sum + g.score, 0) / recordsForAsg.length).toFixed(1)
            )
          : 0;
      const averagePercent = asg.maxPoints > 0 ? Math.round((averagePoints / asg.maxPoints) * 100) : 0;

      return {
        name: asg.title,
        "Class Avg %": averagePercent,
        "Max Score": asg.maxPoints,
      };
    });
  };

  const getStudentChartData = () => {
    if (!user) return [];
    return assignmentsList.map((asg) => {
      const myRecord = gradesList.find((g) => g.assignmentId === asg.id && g.studentId === user.id);
      const myPercent = myRecord && asg.maxPoints > 0 ? Math.round((myRecord.score / asg.maxPoints) * 100) : 0;

      const recordsForAsg = gradesList.filter((g) => g.assignmentId === asg.id);
      const averagePoints =
        recordsForAsg.length > 0
          ? recordsForAsg.reduce((sum, g) => sum + g.score, 0) / recordsForAsg.length
          : 0;
      const averagePercent = asg.maxPoints > 0 ? Math.round((averagePoints / asg.maxPoints) * 100) : 0;

      return {
        name: asg.title,
        "My Score %": myRecord ? myPercent : 0,
        "Class Average %": averagePercent,
      };
    });
  };

  if (loading && classrooms.length === 0) {
    return <Loader message="Accessing secure academic grade ledger entries..." />;
  }

  if (errorHeader) {
    return <ErrorMessage message={errorHeader} onRetry={fetchClassrooms} />;
  }

  return (
    <div className="space-y-8 font-sans" id="sec-grades-syllabus-page">
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="h-4 w-4 text-blue-600" />
            <span>Academic Performance Centre</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {user?.role === "teacher" ? "Lecturers Gradebook" : "My Course Transcript"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {user?.role === "teacher"
              ? "Publish assessment outlines, record student points and maintain feedback comments."
              : "Review grading statistics, instructor feedback, and progress markers across semesters."}
          </p>
        </div>

        {/* Course Selection Dropdown Button */}
        {classrooms.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="text-xs font-black text-slate-600 uppercase tracking-wide">
              Selected Course:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setLoading(true);
                setSelectedClassId(e.target.value);
              }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-800 text-sm font-semibold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition"
            >
              {classrooms.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {classrooms.length === 0 ? (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <BookOpen className="h-10 w-10 mx-auto text-slate-400 mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">No Active Classrooms Enrolled</h3>
          <p className="text-sm text-slate-500 mt-1">
            You must be assigned or registered to a class to view grading ledgers.
          </p>
        </div>
      ) : (
        <>
          {/* ================= TEACHER OR FACULTY VIEW ================= */}
          {user?.role === "teacher" && activeClassroom && (
            <div className="space-y-8 animate-fade-in">
              {/* Analytics Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-xs transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Evaluations Active
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mt-2">
                    {assignmentsList.length}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Graded syllabus elements
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-xs transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Enrolled Students
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mt-2">
                    {activeClassroom.studentDetails?.length || activeClassroom.students.length || 0}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Student rosters in course
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-xs transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Grades cataloged
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mt-2">
                    {gradesList.length}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Cumulative mark scores logged
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-xs transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Avg Turnout Score
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <Percent className="h-5 w-5" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mt-2">
                    {assignmentsList.length > 0 && gradesList.length > 0
                      ? Math.round(
                          (gradesList.reduce((sum, r) => {
                            const asg = assignmentsList.find((a) => a.id === r.assignmentId);
                            if (asg && asg.maxPoints > 0) {
                              return sum + (r.score / asg.maxPoints);
                            }
                            return sum;
                          }, 0) /
                            gradesList.length) *
                            100
                        )
                      : 0}
                    %
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1 font-sans">
                    Average syllabus competency
                  </p>
                </div>
              </div>

              {/* Chart & Create Assignment Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Grading statistics Chart */}
                <div className="lg:col-span-8 bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6">
                  <h3 className="text-slate-800 font-bold text-md mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
                    Class Performance Curve (%)
                  </h3>
                  {assignmentsList.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getTeacherChartData()}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" fontSize={11} stroke="#64748B" />
                          <YAxis domain={[0, 100]} fontSize={11} stroke="#64748B" />
                          <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.05)" }} />
                          <Legend wrapperStyle={{ fontSize: "11px" }} />
                          <Bar
                            dataKey="Class Avg %"
                            fill="#3B82F6"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                      <HelpCircle className="h-8 w-8 text-slate-300 mb-1" />
                      <p className="text-sm">Publish assignments to trigger dynamic visual graphics</p>
                    </div>
                  )}
                </div>

                {/* Create Assignment Form Side Area */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-800 font-bold text-md flex items-center gap-2">
                        <ListPlus className="h-4.5 w-4.5 text-blue-600" />
                        Create Syllabus Outline
                      </h3>
                    </div>

                    {!isCreatingAssignment ? (
                      <div className="py-6 text-center">
                        <p className="text-slate-500 text-sm mb-4">
                          Need to draft a homework session, semester exam, or team project submission?
                        </p>
                        <button
                          onClick={() => setIsCreatingAssignment(true)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition cursor-pointer"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Evaluation Task
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleCreateAssignment} className="space-y-4">
                        {creatingError && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-650 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{creatingError}</span>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Task / Assessment Title:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Midterm Programming Exam"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                              Max Score (Points):
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={newMaxPoints}
                              onChange={(e) => setNewMaxPoints(Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                              Deadline Date:
                            </label>
                            <input
                              type="date"
                              value={newDueDate}
                              onChange={(e) => setNewDueDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingAssignment(false);
                              setCreatingError(null);
                            }}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl transition cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer"
                          >
                            Catalog Task
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Master Grade Spreadsheet Grid */}
              <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 text-md">Course Roster Assessment Grid</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Click any grade cell to quickly change scores or add personalized feedback comments.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg px-2.5 py-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Real-time persistence</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-150/80 rounded-xl">
                  {activeClassroom.studentDetails && activeClassroom.studentDetails.length > 0 ? (
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-150">
                          <th className="py-4 px-4 text-xs font-bold text-slate-650 uppercase tracking-wider">
                            Student Identity
                          </th>
                          {assignmentsList.map((asg) => (
                            <th
                              key={asg.id}
                              className="py-4 px-4 text-xs font-bold text-slate-650 uppercase tracking-wider text-center"
                              title={`Maximum Marks: ${asg.maxPoints} pts`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-sans font-extrabold text-slate-800">
                                  {asg.title}
                                </span>
                                <span className="text-[10px] text-blue-500 font-mono font-medium mt-0.5">
                                  {asg.maxPoints} pts • {asg.dueDate}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="py-4 px-4 text-xs font-bold text-slate-650 uppercase tracking-wider text-right">
                            Average Competency
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeClassroom.studentDetails.map((student) => {
                          let studentScores = 0;
                          let studentMaxPossibles = 0;

                          return (
                            <tr key={student.id} className="hover:bg-slate-50/40 transition">
                              <td className="py-4 px-4">
                                <div className="font-semibold text-slate-950 text-sm">
                                  {student.name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {student.email} • ID: {student.id}
                                </div>
                              </td>

                              {assignmentsList.map((asg) => {
                                const grade = gradesList.find(
                                  (g) => g.assignmentId === asg.id && g.studentId === student.id
                                );

                                if (grade) {
                                  studentScores += grade.score;
                                }
                                studentMaxPossibles += asg.maxPoints;

                                const displayMark = grade ? `${grade.score}` : "-";
                                const isPassing = grade ? (grade.score / asg.maxPoints) >= 0.6 : false;

                                return (
                                  <td
                                    key={asg.id}
                                    onClick={() => {
                                      setActiveCellEdit({
                                        studentId: student.id,
                                        studentName: student.name,
                                        assignmentId: asg.id,
                                        assignmentTitle: asg.title,
                                        score: grade ? grade.score : 0,
                                        remarks: grade && grade.remarks ? grade.remarks : "",
                                      });
                                    }}
                                    className="py-4 px-4 text-center cursor-pointer hover:bg-blue-50/40 transition"
                                    title="Click to edit grade evaluation"
                                  >
                                    <div className="inline-flex flex-col items-center justify-center p-1.5 rounded-lg border border-transparent hover:border-blue-200 hover:bg-white text-center">
                                      <span
                                        className={`text-sm font-extrabold ${
                                          grade
                                            ? isPassing
                                              ? "text-slate-900"
                                              : "text-rose-600"
                                            : "text-slate-400 italic"
                                        }`}
                                      >
                                        {displayMark}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                        / {asg.maxPoints} pts
                                      </span>
                                      {grade?.remarks && (
                                        <span className="inline-block mt-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" title={grade.remarks} />
                                      )}
                                    </div>
                                  </td>
                                );
                              })}

                              <td className="py-4 px-4 text-right">
                                {studentMaxPossibles > 0 ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm font-black text-slate-900 font-sans">
                                      {Math.round((studentScores / studentMaxPossibles) * 100)}%
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      {studentScores} / {studentMaxPossibles} pts
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">No tasks yet</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-sans text-sm">
                      No enrolled students found on this course roster. Enroll students from the dashboard page first.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STUDENT VIEW ================= */}
          {user?.role === "student" && (
            <div className="space-y-8 animate-fade-in">
              {/* Overall Progress Dial & Letter Grade Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Summary Panel */}
                <div className="md:col-span-5 bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">
                      My Academic Standing
                    </span>

                    <div className="flex items-center gap-6">
                      {/* Metric Dial */}
                      <div className="relative h-28 w-28 shrink-0 flex items-center justify-center rounded-full bg-blue-50 border-4 border-blue-500 shadow-inner">
                        <div className="text-center">
                          <span className="block text-3xl font-black text-blue-800 leading-none">
                            {getOverallPerformance().percent}%
                          </span>
                          <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mt-1.5 inline-block">
                            Cumulative
                          </span>
                        </div>
                      </div>

                      {/* Grade description */}
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Grade Point Index:</div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-5xl font-black text-slate-900 leading-none">
                            {getOverallPerformance().grade}
                          </span>
                          <span className="text-xs font-bold text-slate-500">Letter Standard</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 italic leading-relaxed">
                          Weighted performance average based on all evaluated, graded and published classroom exams.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Assignments Graded
                      </span>
                      <p className="text-xl font-black text-slate-800 mt-0.5">
                        {gradesList.filter((g) => g.studentId === user.id).length} / {assignmentsList.length}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Average Class Percent
                      </span>
                      <p className="text-xl font-black text-slate-800 mt-0.5">
                        {assignmentsList.length > 0 && gradesList.length > 0
                          ? Math.round(
                              (gradesList.reduce((sum, r) => {
                                const asg = assignmentsList.find((a) => a.id === r.assignmentId);
                                if (asg && asg.maxPoints > 0) {
                                  return sum + (r.score / asg.maxPoints);
                                }
                                return sum;
                              }, 0) /
                                gradesList.length) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Chart student relative average */}
                <div className="md:col-span-7 bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6">
                  <h3 className="text-slate-800 font-bold text-sm mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
                    My Progress vs. Classroom Average (%)
                  </h3>
                  {assignmentsList.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getStudentChartData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="name" fontSize={11} stroke="#64748B" />
                          <YAxis domain={[0, 100]} fontSize={11} stroke="#64748B" />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: "11px" }} />
                          <Line
                            type="monotone"
                            dataKey="My Score %"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="Class Average %"
                            stroke="#94A3B8"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-60 flex flex-col items-center justify-center text-slate-400">
                      <HelpCircle className="h-8 w-8 text-slate-300 mb-1" />
                      <p className="text-sm">Classroom averages are computed when results are cataloged</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Individual assessment breakdown cards */}
              <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6">
                <h3 className="font-extrabold text-slate-950 text-md mb-6">Detailed Grades Transcript</h3>

                <div className="space-y-4">
                  {assignmentsList.map((asg) => {
                    const grade = gradesList.find((g) => g.assignmentId === asg.id && g.studentId === user.id);
                    const percent = grade ? Math.round((grade.score / asg.maxPoints) * 100) : 0;
                    const letterObj = grade ? getGradeLetter(grade.score, asg.maxPoints) : null;

                    return (
                      <div
                        key={asg.id}
                        className="p-5 border border-slate-100 rounded-xl hover:border-slate-250 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                      >
                        {/* Assignment Details */}
                        <div className="space-y-1 md:w-1/3">
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-2">
                            {asg.title}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold uppercase">
                            <Calendar className="h-3.5 w-3.5" />
                            Due date: {asg.dueDate}
                          </span>
                        </div>

                        {/* score percentages bar */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-400">Evaluation Marks:</span>
                            <span className="text-slate-800 font-bold">
                              {grade ? `${grade.score} / ${asg.maxPoints} pts` : "Ungraded / No attempt"}
                              {grade && <span className="text-blue-600 font-black ml-2">({percent}%)</span>}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition ${
                                percent >= 80 ? "bg-emerald-500" : percent >= 60 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Letter grade and remarks */}
                        <div className="flex flex-col md:items-end justify-center gap-2 md:w-1/4">
                          {grade && letterObj ? (
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-block px-3 py-1 font-black text-sm border rounded-lg ${letterObj.color}`}
                              >
                                {letterObj.letter}
                              </span>
                              <div className="text-left md:text-right">
                                <span className="block text-[11px] text-slate-400 font-bold uppercase">Remarks</span>
                                <span className="text-xs text-slate-600 block line-clamp-1 italic" title={grade.remarks}>
                                  {grade.remarks || "No supplementary feed details."}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No score registered</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {assignmentsList.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      No evaluation tasks have been cataloged for this course.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Grade Editor Modal / Sidebar slide for Faculty */}
      {activeCellEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl border border-slate-205 shadow-2xl w-full max-w-md overflow-hidden transform transition">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  Grades Assessment Panel
                </span>
                <h3 className="text-base font-black tracking-tight">{activeCellEdit.studentName}</h3>
              </div>
              <button
                onClick={() => {
                  setActiveCellEdit(null);
                  setGradeEditError(null);
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-6 space-y-4">
              {gradeEditError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-750 text-xs p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{gradeEditError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Evaluation Element:
                </label>
                <p className="text-sm font-black text-slate-900">
                  {activeCellEdit.assignmentTitle}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                  Awarded Score / Marks:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={activeCellEdit.score}
                    onChange={(e) =>
                      setActiveCellEdit((prev) =>
                        prev ? { ...prev, score: Number(e.target.value) } : null
                      )
                    }
                    className="w-24 bg-slate-50 border border-slate-250 font-sans font-black text-lg text-slate-900 text-center rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-400 text-sm font-semibold">
                    out of {assignmentsList.find((a) => a.id === activeCellEdit.assignmentId)?.maxPoints} max points
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-555 uppercase tracking-wider mb-1.5">
                  Instructor Remarks / Feedback:
                </label>
                <textarea
                  rows={3}
                  placeholder="Insert constructive notes or grading explanation..."
                  value={activeCellEdit.remarks}
                  onChange={(e) =>
                    setActiveCellEdit((prev) =>
                      prev ? { ...prev, remarks: e.target.value } : null
                    )
                  }
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCellEdit(null);
                    setGradeEditError(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {savingGrade ? (
                    "Saving Record..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Mark
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
