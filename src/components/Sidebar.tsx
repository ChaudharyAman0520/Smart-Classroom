import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FolderLock,
  PlusCircle,
  ClipboardCheck,
  TrendingUp,
  School,
  ChevronRight,
  Sparkles,
  Award,
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  // Render lists depending on teacher / student role attributes
  const isTeacher = user.role === "teacher";

  return (
    <aside
      id="scas-sidebar"
      className="bg-slate-900 border-r border-slate-800 w-64 flex flex-col justify-between hidden md:flex shrink-0 font-sans"
    >
      <div className="p-5 flex-1 space-y-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Control Console
          </span>

          <div className="mt-3.5 space-y-1">
            {isTeacher ? (
              <>
                <NavLink
                  to="/teacher-dashboard"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>

                <NavLink
                  to="/classrooms"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <School className="h-4.5 w-4.5 shrink-0" />
                    <span>My Classrooms</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>

                <NavLink
                  to="/create-classroom"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>Create Classroom</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>

                <NavLink
                  to="/attendance"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="h-4.5 w-4.5 shrink-0" />
                    <span>Take Attendance</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>

                <NavLink
                  to="/ai-insights"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4.5 w-4.5 shrink-0 text-blue-400" />
                    <span>AI Insights</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>

                <NavLink
                  to="/grades"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Award className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                    <span>Gradebook</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/student-dashboard"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
                    <span>My Dashboard</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>

                <NavLink
                  to="/classrooms"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <School className="h-4.5 w-4.5 shrink-0" />
                    <span>Classroom List</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>

                <NavLink
                  to="/grades"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Award className="h-4.5 w-4.5 shrink-0 text-amber-400" />
                    <span>My Grades</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>

                <NavLink
                  to="/ai-insights"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4.5 w-4.5 shrink-0 text-blue-400" />
                    <span>AI Insights</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </NavLink>
              </>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            System Identity
          </span>
          <div className="mt-2.5 bg-slate-800 border border-slate-750/50 rounded-xl p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">SCAS Applet v1.0</p>
            <p className="mt-1 line-clamp-2">Autonomous Student Directory & Visual Analytics Platform.</p>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
        Powered by Google Cloud Run
      </div>
    </aside>
  );
}
