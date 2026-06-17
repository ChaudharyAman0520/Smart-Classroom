import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { GraduationCap, ShieldAlert, Key, Check, ArrowRight, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email coordinates must be specified.");
      return;
    }

    if (!password) {
      setError("Please input your new security password.");
      return;
    }

    if (password.length < 6) {
      setError("Security requirements: Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Credentials mismatch. Password fields must match perfectly.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          token: tokenParam,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update security credentials.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="reset-password-page-wrapper"
      className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900">
          Define Credentials
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium font-mono">
          Reset Identity Key Ledger
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-slate-100 rounded-3xl sm:px-10 space-y-6">
          {!success ? (
            <form className="space-y-4.5" onSubmit={handleSubmit}>
              <p className="text-xs text-slate-400 font-medium leading-normal mb-3">
                Change security details for your classroom ledger identity. Set a strong password.
              </p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2" id="reset-error">
                  <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                >
                  Confirm Account Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@scas.edu"
                  className="block w-full px-3.5 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition"
                />
              </div>

              <div>
                <label
                  htmlFor="new-pwd"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                >
                  New Pass-key
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    id="new-pwd"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-pwd"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                >
                  Confirm Pass-key
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-pwd"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 mt-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition"
                id="reset-submit-btn"
              >
                {loading ? "Re-establishing key..." : "Reset Password"}
                <Check className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center" id="reset-success-box">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                <Check className="h-6 w-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Security Reset Completed</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Your identity credential keys have been updated. You can now access all classroom analysis resources using your newly minted security code.
                </p>
              </div>

              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 transition shadow-sm"
              >
                Advance to Authorized Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {!success && (
            <div className="text-center pt-2 border-t border-slate-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to login page
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
