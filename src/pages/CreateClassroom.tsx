import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { School, BookOpen, ChevronLeft, ArrowRight, Loader2 } from "lucide-react";

export default function CreateClassroom() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!name || !subject) {
      setErr("Please fulfill all configurations for this classroom module.");
      return;
    }

    if (!user) {
      setErr("Authorization state expired. Please re-authenticate.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/classrooms", {
        name,
        subject,
        teacherId: user.id,
      });
      // Redirect back to Classroom List pages
      navigate("/classrooms");
    } catch (error: any) {
      console.error(error);
      setErr(error.response?.data?.error || "Failed to create active classroom directory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans select-none" id="create-classroom-page">
      {/* Back CTA link header button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Cancel & Return
        </button>
      </div>

      {/* Main card box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mb-3">
            <School className="h-5.5 w-5.5" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Create Classroom Registry</h2>
          <p className="text-xs text-slate-400 font-medium">Establish a new classroom module and enroll students from directories.</p>
        </div>

        {err && (
          <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-bold">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label
              htmlFor="class-name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Classroom Course Title
            </label>
            <div className="relative rounded-xl shadow-xs mt-1.5">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <School className="h-4 w-4" />
              </div>
              <input
                id="class-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CS 101: Intro to Computer Science"
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Specify both the academic course designation code and clear subject descriptor.</p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="subject"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Primary Subject Domain
            </label>
            <div className="relative rounded-xl shadow-xs mt-1.5">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <BookOpen className="h-4 w-4" />
              </div>
              <input
                id="subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science, Web Development"
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs font-semibold">
            <span className="text-[10px] text-slate-400 max-w-[220px]">
              Note: New classrooms are automatically initialized with 3 enrolled students to speed up demonstration logs.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 py-3 px-5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Spinning up...
                </>
              ) : (
                <>
                  Create Classroom
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
