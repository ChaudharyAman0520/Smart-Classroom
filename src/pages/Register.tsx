import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  GraduationCap, 
  Key, 
  Mail, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck, 
  Send, 
  RefreshCw, 
  Lock, 
  Inbox,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Register() {
  const { register, sendOtp, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [otp, setOtp] = useState("");
  
  const [otpSent, setOtpSent] = useState(false);
  const [capturedOtp, setCapturedOtp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLocalErr(null);
    clearError();
    setSuccessMsg(null);

    if (!name || !email || !password || !role) {
      setLocalErr("All registration fields must be filled before requesting an OTP code.");
      return;
    }

    if (password.length < 6) {
      setLocalErr("Password strength requirement unmet (minimum 6 characters).");
      return;
    }

    setSendingOtp(true);
    const result = await sendOtp(email);
    setSendingOtp(false);

    if (result.success) {
      setOtpSent(true);
      setSuccessMsg("Verification OTP code has been sent!");
      if (result.otp) {
        setCapturedOtp(result.otp);
        setOtp(result.otp); // Pre-fill for developer workspace convenience
      }
    } else {
      setLocalErr(result.error || "Could not dispatch verification code.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    clearError();

    if (!name || !email || !password || !role || !otp) {
      setLocalErr("All registration details and the OTP verification code are required.");
      return;
    }

    setLoading(true);
    const success = await register(name, email, password, role, otp);
    setLoading(false);

    if (success) {
      if (role === "teacher") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    }
  };

  const handleCopy = () => {
    if (!capturedOtp) return;
    navigator.clipboard.writeText(capturedOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="register-page-wrapper"
      className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans select-none"
    >
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900">
          Smart Classroom Analytics
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Create Academic Account with OTP Verification
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 shadow-md border border-slate-100 rounded-3xl sm:px-10 space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {(localErr || error) && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold leading-relaxed">
                {localErr || error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-semibold leading-relaxed flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Stage 1 fields */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="fullname"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    required
                    disabled={otpSent}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Amelia Earhart"
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>
              </div>

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
                    required
                    disabled={otpSent}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amelia@scas.edu"
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                >
                  Set Secure Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={otpSent}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="role-select"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                >
                  Academic Position Role
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <select
                    id="role-select"
                    name="role-select"
                    value={role}
                    disabled={otpSent}
                    onChange={(e) => setRole(e.target.value as "teacher" | "student")}
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl bg-white transition disabled:opacity-70 disabled:bg-slate-50"
                  >
                    <option value="student">Student Portal</option>
                    <option value="teacher">Teacher / Instructor Console</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Send OTP Trigger */}
            {!otpSent ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition"
                >
                  {sendingOtp ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Dispatching Code...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Get Registration OTP
                    </>
                  )}
                </button>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 pt-2 border-t border-slate-100"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="verification-otp"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-500"
                      >
                        Enter 6-Digit OTP
                      </label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition"
                      >
                        {sendingOtp ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Resend Code
                      </button>
                    </div>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="verification-otp"
                        name="otp"
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl font-mono tracking-widest text-center text-lg font-bold transition"
                      />
                    </div>
                  </div>

                  {/* capturedOtp simulation alert */}
                  {capturedOtp && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs space-y-1.5 text-blue-800 font-medium"
                    >
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                        <Inbox className="h-3.5 w-3.5 text-blue-600" />
                        <span>SCAS Dev Mailbox (Captured)</span>
                      </div>
                      <p className="leading-normal">
                        Since this is a simulated sandbox running offline, we captured the outbound registration OTP code for you:
                      </p>
                      <div className="flex items-center justify-between bg-white border border-blue-100 rounded-lg py-1 px-2.5 mt-1">
                        <span className="font-mono font-black text-blue-900 tracking-wider text-sm">
                          {capturedOtp}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md transition"
                        >
                          {copied ? "Copied!" : "Copy OTP"}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Reset form back to Edit mode if they entered wrong email/info */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setCapturedOtp(null);
                        setSuccessMsg(null);
                        setOtp("");
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600 transition"
                    >
                      Back to edit details
                    </button>
                  </div>

                  {/* Final register submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 transition"
                    >
                      {loading ? "Registering account..." : "Complete Registration"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Already have an SCAS ledger key?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 underline"
                onClick={clearError}
              >
                Secure Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
