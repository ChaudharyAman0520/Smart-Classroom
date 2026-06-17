import React from "react";
import { AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface RiskAlertCardProps {
  issues: string[];
  loading?: boolean;
}

export default function RiskAlertCard({ issues, loading = false }: RiskAlertCardProps) {
  return (
    <div
      id="risk-alert-card"
      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative"
    >
      <div className="flex items-center gap-3 mb-4.5 border-b border-slate-100 pb-3">
        <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          <AlertCircle className="h-5.5 w-5.5" />
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-wider font-extrabold text-slate-400">Classroom Warnings</h3>
          <p className="text-base font-extrabold text-slate-900 tracking-tight">Academic & Attendance Risks</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-slate-100 rounded-md w-[95%]" />
          <div className="h-4 bg-slate-100 rounded-md w-[88%]" />
        </div>
      ) : issues.length === 0 ? (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-emerald-800">
          <ShieldCheck className="h-5.5 w-5.5 shrink-0 text-emerald-600" />
          <span className="text-xs font-bold">Excellent academic & attendance standing! No persistent risks detected.</span>
        </div>
      ) : (
        <div className="space-y-3" id="risk-alert-items">
          {issues.map((issue, idx) => (
            <div
              key={idx}
              id={`risk-issue-${idx}`}
              className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50/20 border border-red-100 hover:border-red-200 transition-all duration-300"
            >
              <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
              <span className="text-xs text-red-800 font-semibold leading-relaxed">
                {issue}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
