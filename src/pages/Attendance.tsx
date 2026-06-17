import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Classroom } from "../types";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import AttendanceTable from "../components/AttendanceTable";
import { Calendar, School, Save, ChevronLeft, ArrowRight, ToggleLeft, CheckCircle } from "lucide-react";

export default function Attendance() {
  const { user } = useAuth();
  const { id: urlId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Classroom selection, lists and loaders
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [activeClassroom, setActiveClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form states
  const [evalDate, setEvalDate] = useState("2026-06-12"); // Local simulated time default
  const [records, setRecords] = useState<Record<string, "present" | "absent">>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Fetch available classroom lists managed by Teacher
  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`/api/classrooms?userId=${user.id}`);
        setClassrooms(res.data);

        // If URL ID exists, select it
        if (urlId) {
          setSelectedClassroomId(urlId);
        } else if (res.data.length > 0) {
          setSelectedClassroomId(res.data[0].id);
        }
      } catch (e: any) {
        console.error(e);
        setErr("Failed to load class roster directories for attendance taking.");
      } finally {
        setLoading(false);
      }
    };
    fetchClassrooms();
  }, [user, urlId]);

  // 2. Fetch selected classroom detailed student roster
  useEffect(() => {
    const fetchClassroomDetails = async () => {
      if (!selectedClassroomId) return;
      setLoadingMembers(true);
      setErr(null);
      setSaveSuccess(false);
      try {
        const res = await axios.get(`/api/classrooms/${selectedClassroomId}`);
        setActiveClassroom(res.data);

        // Initialize records: set all enrolled students as Present by default to streamline operation!
        const initialRecords: Record<string, "present" | "absent"> = {};
        if (res.data.studentDetails) {
          res.data.studentDetails.forEach((stud: any) => {
            initialRecords[stud.id] = "present";
          });
        }
        setRecords(initialRecords);
      } catch (e: any) {
        console.error(e);
        setErr("Failed to load selected student roster details.");
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchClassroomDetails();
  }, [selectedClassroomId]);

  const handleToggleStatus = (studentId: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroomId || !activeClassroom) return;

    setSaving(true);
    setErr(null);
    setSaveSuccess(false);

    const formattedRecords = Object.entries(records).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      await axios.post("/api/attendance", {
        classroomId: selectedClassroomId,
        date: evalDate,
        records: formattedRecords,
      });

      setSaveSuccess(true);
      // Wait for feedback effect, then navigate to classroom insights
      setTimeout(() => {
        navigate(`/analytics/${selectedClassroomId}`);
      }, 1200);
    } catch (e: any) {
      console.error(e);
      setErr("Failed to submit and commit attendance records. Please review input specifications.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Accessing active evaluation modules..." />;
  }

  return (
    <div className="space-y-6 font-sans select-none" id="attendance-taking-page">
      {/* Header Back CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Mark Session Attendance
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Fill evaluation registers and compile statistical trends metrics.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-white border border-slate-200 px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Selector Deck */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Settings options Column */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5 h-fit">
          <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider pb-2 border-b border-slate-100">
            Attendance Parameter
          </h3>

          {/* Classroom option list selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Select Classroom</label>
            <div className="relative rounded-xl shadow-xs mt-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <School className="h-4 w-4" />
              </span>
              <select
                value={selectedClassroomId}
                onChange={(e) => {
                  setSelectedClassroomId(e.target.value);
                  setSaveSuccess(false);
                }}
                className="block w-full pl-9 pr-3 py-2.5 sm:text-xs border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl bg-white transition"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code || c.id}] {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Evaluation Date Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Evaluation Date</label>
            <div className="relative rounded-xl shadow-xs mt-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                value={evalDate}
                onChange={(e) => setEvalDate(e.target.value)}
                required
                className="block w-full pl-9 pr-3 py-2 sm:text-xs border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl bg-white transition"
              />
            </div>
            <p className="text-[10px] text-slate-400">Default logs initialized for {evalDate}.</p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-3 border-t border-slate-100">
            {saveSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 justify-center">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Roll Saved! Rendering details...
              </div>
            ) : (
              <button
                type="button"
                disabled={saving || !activeClassroom || activeClassroom.students?.length === 0}
                onClick={handleSaveAttendance}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-40 transition"
              >
                <Save className="h-4 w-4" />
                {saving ? "Filing records..." : "Commit Attendance"}
              </button>
            )}
          </div>
        </div>

        {/* Student Roster evaluation Section Column */}
        <div className="md:col-span-8 space-y-4">
          {err && <ErrorMessage message={err} />}

          {loadingMembers ? (
            <Loader message="Accessing student rosters..." />
          ) : activeClassroom ? (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs leading-none flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-none">
                    Roster Evaluation Ledger
                  </h3>
                  <span className="text-[10px] text-indigo-600 font-mono mt-1 inline-block">
                    {activeClassroom.name} ({activeClassroom.subject})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium">
                    Members enrolled: <strong>{activeClassroom.studentDetails?.length || 0}</strong>
                  </span>
                </div>
              </div>

              {/* Attendance Table rendering student rosters */}
              <AttendanceTable
                students={activeClassroom.studentDetails || []}
                records={records}
                onToggleStatus={handleToggleStatus}
              />
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 p-12 rounded-2xl text-center text-slate-400 text-sm">
              Please finalize parameter definitions to load directories.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
