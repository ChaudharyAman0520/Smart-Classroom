import React from "react";
import { Sparkles, Brain, Clock } from "lucide-react";

interface AIInsightCardProps {
  summary: string;
  loading?: boolean;
}

export default function AIInsightCard({ summary, loading = false }: AIInsightCardProps) {
  return (
    <div
      id="ai-insight-card"
      className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-500/30"
    >
      {/* Decorative gradient background circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

      <div className="relative flex flex-col md:flex-row md:items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <Brain className="h-6 w-6 text-white" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-widest font-black text-blue-400">Ledger Intelligence</span>
              <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3" />
              <span>Real-time synthesis</span>
            </div>
          </div>

          <h3 className="text-md sm:text-lg font-extrabold text-slate-100 tracking-tight">AI Generated Academic & Performance Summary</h3>

          {loading ? (
            <div className="space-y-2 py-2 animate-pulse">
              <div className="h-3.5 bg-slate-800 rounded-md w-full" />
              <div className="h-3.5 bg-slate-800 rounded-md w-[92%]" />
              <div className="h-3.5 bg-slate-800 rounded-md w-[85%]" />
            </div>
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed font-normal">
              {summary || "Run the AI classroom summarization engine to compile cumulative student records and generate a pedagogical trend analysis."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
