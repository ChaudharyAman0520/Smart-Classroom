import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Key, Mail, ArrowRight } from "lucide-react";

export default function Login() {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    clearError();

    if (!email || !password) {
      setLocalErr("Please define both authentication parameters.");
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      // Determine dashboard redirection based on authorized user role
      const storedUser = localStorage.getItem("scas_user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.role === "teacher") {
          navigate("/teacher-dashboard");
        } else {
          navigate("/student-dashboard");
        }
      } else {
        navigate("/");
      }
    }
  };

  const handleQuickLogin = async (em: string) => {
    setLoading(true);
    setLocalErr(null);
    clearError();
    const success = await login(em, "password");
    setLoading(false);
    if (success) {
      const storedUser = localStorage.getItem("scas_user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.role === "teacher") {
          navigate("/teacher-dashboard");
        } else {
          navigate("/student-dashboard");
        }
      } else {
        navigate("/");
      }
    }
  };

  return (
    <div
      id="login-page-wrapper"
      className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900">
          Smart Classroom Analytics
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Secure Authorization Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-slate-100 rounded-3xl sm:px-10 space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {(localErr || error) && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold">
                {localErr || error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
              >
                Institutional Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@scas.edu"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Access Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition"
              >
                {loading ? "Authenticating Session..." : "Secure Login"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Demo Administrator Login
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <div className="text-center">
            <button
              onClick={() => handleQuickLogin("teacher@scas.edu")}
              className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer"
            >
              👩‍🏫 Instructor (Admin)
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              New user on this classroom ledger?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 underline"
                onClick={clearError}
              >
                Register an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
