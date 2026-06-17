import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, ArrowRight, ArrowLeft, Send } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mockResetUrl, setMockResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setMockResetUrl(null);

    if (!email) {
      setError("Please specify your institutional email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger recovery flow.");
      }

      setSuccessMsg(data.message || "Password recovery instructions dispatched.");
      // For demonstration convenience, let's display the mock reset URL:
      if (data.url) {
        setMockResetUrl(data.url);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="forgot-password-page-wrapper"
      className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900">
          Recover Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium font-mono">
          SCAS Ledger Security Dispatch
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-slate-100 rounded-3xl sm:px-10 space-y-6">
          {!successMsg ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <p className="text-xs text-slate-500 leading-normal font-medium">
                Enter your registered credential email address below. We'll simulate transmitting a secure temporary authorization override key directly to your screen.
              </p>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold" id="forgot-error">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="recover-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                >
                  Institutional Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="recover-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@scas.edu"
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition"
              >
                {loading ? "Transmitting override..." : "Send Reset Link"}
                <Send className="h-4 w-4 ml-1" />
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center" id="recovery-success-box">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-800 text-left font-semibold space-y-2">
                <p>✔ {successMsg}</p>
                <p className="font-medium text-slate-500 leading-normal">
                  In a real operational environment, this reset command dispatch link would be routed securely to your SMTP inbox. For immediate demo purposes, click the generated credential override payload link below:
                </p>
              </div>

              {mockResetUrl && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black mb-1">Generated override route</p>
                  <Link
                    to={mockResetUrl}
                    className="text-xs font-mono font-bold text-blue-600 hover:text-blue-800 break-all underline flex items-center gap-1.5"
                  >
                    Click to Reset Password
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="text-center pt-2 border-t border-slate-100">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to login portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
