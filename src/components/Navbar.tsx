import React from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, GraduationCap, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav
      id="scas-navbar"
      className="bg-slate-900 text-white h-16 px-6 flex items-center justify-between border-b border-slate-800 shadow-sm shrink-0"
    >
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
        <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-tight leading-none text-white">SCAS</h1>
          <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
            Smart Classroom Analytics
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Card */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50">
          <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            <UserIcon className="h-3.5 w-3.5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 leading-none mb-0.5">
              {user.name}
              <span className={`inline-block px-1.5 py-0.2 px-1 text-[9px] font-extrabold uppercase rounded leading-none ${
                user.role === "teacher"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              }`}>
                {user.role}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono leading-none">{user.email}</div>
          </div>
        </div>

        {/* Mobile Sign out Icon */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition rounded-xl border border-slate-700"
          title="Sign out of system"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
