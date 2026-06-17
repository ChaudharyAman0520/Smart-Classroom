import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Classroom, AIClassroomSummary } from "../types";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import AIInsightCard from "../components/AIInsightCard";
import RecommendationList from "../components/RecommendationList";
import RiskAlertCard from "../components/RiskAlertCard";

import { ChevronLeft, BookOpen, Sparkles, RefreshCw, Layers, Calendar } from "lucide-react";

export default function AIInsights() {
  const { user } = useAuth();
  const { classroomId: urlId } = useParams<{ classroomId?: string }>();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [insights, setInsights] = useState<AIClassroomSummary | null>(null);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Load general classrooms list for rotating selection
  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!user) return;
      try {
        setError(null);
        const res = await axios.get(`/api/classrooms?userId=${user.id}`);
        setClassrooms(res.data);

        if (urlId) {
          setSelectedId(urlId);
        } else if (res.data.length > 0) {
          setSelectedId(res.data[0].id);
        } else {
          setLoadingList(false);
        }
      } catch (err: any) {
        console.error("Failed to load classrooms:", err);
        setError("Unable to retrieve available course roster lists.");
        setLoadingList(false);
      }
    };
    fetchClassrooms();
  }, [user, urlId]);

  // 2. Load detailed classroom information and AI summary when selection shifts
  useEffect(() => {
    if (!selectedId) return;

    const loadClassroomAndAI = async () => {
      setLoadingInsights(true);
      setError(null);
      try {
        // Fetch detailed classroom metadata
        const classRes = await axios.get(`/api/classrooms/${selectedId}`);
        setClassroom(classRes.data);

        // Fetch AI compiled metrics
        const aiPayload = user?.role === "student" ? { studentId: user.id } : {};
        const aiRes = await axios.post(`/api/ai/classroom-summary/${selectedId}`, aiPayload);
        setInsights(aiRes.data);
      } catch (err: any) {
        console.error("AI Insights compilation failed:", err);
        setError("The AI summarization engine could not access/generate ledger coordinates.");
      } finally {
        setLoadingInsights(false);
        setLoadingList(false);
      }
    };

    loadClassroomAndAI();
  }, [selectedId, user]);

  // 3. Regeneration utility
  const handleRegenerate = async () => {
    if (!selectedId) return;
    setLoadingInsights(true);
    setError(null);
    try {
      const aiPayload = user?.role === "student" ? { studentId: user.id } : {};
      const aiRes = await axios.post(`/api/ai/classroom-summary/${selectedId}`, aiPayload);
      setInsights(aiRes.data);
    } catch (err: any) {
      console.error("AI Insights regeneration failed:", err);
      setError("Regeneration attempt timed out or failed to complete. Please retry.");
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loadingList && !classroom) {
    return <Loader message="Compiling student analytical grids..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans" id="ai-insights-page">
      {/* Navigation and Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-2"
            id="ai-insights-back"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to previous dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">AI Insights Portal</h1>
            <Sparkles className="h-5 w-5 text-blue-600 animate-pulse hidden sm:inline" />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Automated intelligence summaries and classroom risk diagnostics powered by standard model synthesis.
          </p>
        </div>

        {/* Classroom selector dropdown */}
        {classrooms.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-center" id="classroom-select-container">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:inline">Select Registry:</span>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                navigate(`/ai-insights/${e.target.value}`, { replace: true });
              }}
              className="block pl-3 pr-8 py-2 text-xs font-bold border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl bg-white transition cursor-pointer"
              id="ai-insights-classroom-select"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code || c.id} - {c.name.split(":")[0]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {classroom && (
        <div className="space-y-6">
          {/* Metadata classroom summary header bar */}
          <div
            id="classroom-meta-summary-bar"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-300 duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="h-5.5 w-5.5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  {classroom.name}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium font-mono">
                  <span>Subject: <strong className="text-slate-700 font-sans">{classroom.subject}</strong></span>
                  <span className="h-3 w-px bg-slate-200" />
                  <span>Enrolled: <strong className="text-slate-700 font-sans">{classroom.students?.length || 0} students</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 self-start md:self-auto border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
              <div className="hidden sm:block text-left md:text-right text-xs">
                <p className="text-slate-400 font-medium">Lead Instructor</p>
                <p className="font-extrabold text-slate-800">{classroom.teacherName}</p>
              </div>

              {user && (
                <button
                  onClick={handleRegenerate}
                  disabled={loadingInsights}
                  className="inline-flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 transition cursor-pointer"
                  id="regenerate-ai-insights-btn"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingInsights ? "animate-spin" : ""}`} />
                  {loadingInsights ? "Analyzing Course..." : "Refresh AI Guidance"}
                </button>
              )}
            </div>
          </div>

          {/* Primary Bento Cards Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Full-width Summary Segment on Tablet, span 3 columns on LG grids */}
            <div className="lg:col-span-3">
              <AIInsightCard
                summary={insights?.summary || ""}
                loading={loadingInsights}
              />
            </div>

            {/* Split Details view column spacing: 1 and 2 span */}
            <div className="lg:col-span-1">
              <RiskAlertCard
                issues={insights?.issues || []}
                loading={loadingInsights}
              />
            </div>

            <div className="lg:col-span-2">
              <RecommendationList
                recommendations={insights?.recommendations || []}
                loading={loadingInsights}
              />
            </div>
          </div>
        </div>
      )}

      {/* No classrooms found fallback state */}
      {!classroom && classrooms.length === 0 && !loadingList && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center" id="ai-insights-empty">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">No Roster Registries Found</h3>
          <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto mt-1 leading-normal">
            You must register or enroll in at least one active classroom space to compile intelligent log diagnostics.
          </p>
        </div>
      )}
    </div>
  );
}
