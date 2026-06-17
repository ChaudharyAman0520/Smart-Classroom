import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Classroom, ClassroomAnalytics } from "../types";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import AnalyticsChart from "../components/AnalyticsChart";
import { ChevronLeft, School, Award, TrendingUp, Presentation } from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const { id: urlId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Selected state options
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [analytics, setAnalytics] = useState<ClassroomAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 1. Fetch classrooms that are authorised for the user
  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`/api/classrooms?userId=${user.id}`);
        setClassrooms(res.data);

        if (urlId) {
          setSelectedId(urlId);
        } else if (res.data.length > 0) {
          setSelectedId(res.data[0].id);
        } else {
          setLoading(false);
        }
      } catch (e: any) {
        console.error(e);
        setErr("Failed to load list of available classrooms.");
        setLoading(false);
      }
    };
    fetchClassrooms();
  }, [user, urlId]);

  // 2. Fetch specific classroom analytical aggregates on selection change
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedId) return;
      setLoadingChart(true);
      setErr(null);
      try {
        const res = await axios.get(`/api/analytics/classroom/${selectedId}?userId=${user?.id || ""}`);
        setAnalytics(res.data);
      } catch (e: any) {
        console.error(e);
        setErr("Could not retrieve analytical summaries for this classroom layout.");
      } finally {
        setLoading(false);
        setLoadingChart(false);
      }
    };
    fetchAnalytics();
  }, [selectedId, user]);

  if (loading) {
    return <Loader message="Analyzing demographic database profiles..." />;
  }

  return (
    <div className="space-y-6 font-sans select-none" id="analytics-master-container">
      {/* Header Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Performance & Insights
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Visual statistics, timelines, and student performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {/* Quick manual selection dropdown option list */}
          {classrooms.length > 0 && (
            <div className="relative rounded-xl shadow-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <School className="h-4 w-4" />
              </span>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="block w-full pl-9 pr-3.5 py-2 text-xs font-bold border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl bg-white transition"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code || c.id}] {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      {err && <ErrorMessage message={err} />}

      {/* Main Analytical Section */}
      {loadingChart ? (
        <Loader message="Recalculating trend indexes..." />
      ) : analytics ? (
        <div className="space-y-6">
          {/* Active stats details summary bars */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">
                <Presentation className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-50 leading-none">
                  {analytics.classroomName}
                </h3>
                <span className="text-[10px] text-slate-300 leading-none mt-1 inline-block">
                  Instructor: <strong>{analytics.teacherName}</strong>
                </span>
              </div>
            </div>

            <div className="text-left md:text-right text-xs">
              <span className="text-slate-400 font-medium">Classroom Code:</span>{" "}
              <strong className="font-mono text-blue-400">{analytics.classroomId}</strong>
            </div>
          </div>

          <AnalyticsChart analytics={analytics} userRole={user?.role} />
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">No data found.</p>
          <p className="text-slate-400 text-xs mt-1">Please configure class registries first to capture logs.</p>
        </div>
      )}
    </div>
  );
}
