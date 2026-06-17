import React from "react";
import { Lightbulb, CheckCircle2 } from "lucide-react";

interface RecommendationListProps {
  recommendations: string[];
  loading?: boolean;
}

export default function RecommendationList({ recommendations, loading = false }: RecommendationListProps) {
  return (
    <div
      id="recommendation-list-card"
      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative"
    >
      <div className="flex items-center gap-3 mb-4.5 border-b border-slate-100 pb-3">
        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Lightbulb className="h-5.5 w-5.5 animate-bounce" />
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-wider font-extrabold text-slate-400">Classroom Directives</h3>
          <p className="text-base font-extrabold text-slate-900 tracking-tight">AI Generated Recommendations</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="flex gap-2.5">
            <div className="h-4 bg-slate-100 w-4 rounded-full mt-1 shrink-0" />
            <div className="h-4 bg-slate-100 rounded-md w-full" />
          </div>
          <div className="flex gap-2.5">
            <div className="h-4 bg-slate-100 w-4 rounded-full mt-1 shrink-0" />
            <div className="h-4 bg-slate-100 rounded-md w-[88%]" />
          </div>
          <div className="flex gap-2.5">
            <div className="h-4 bg-slate-100 w-4 rounded-full mt-1 shrink-0" />
            <div className="h-4 bg-slate-100 rounded-md w-[95%]" />
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <p className="text-xs font-semibold text-slate-400 py-2">No recommendations generated at this time.</p>
      ) : (
        <ul className="space-y-3" id="recommendation-list-items">
          {recommendations.map((rec, idx) => (
            <li
              key={idx}
              id={`recommendation-item-${idx}`}
              className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/10 transition-all duration-300 group"
            >
              <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-700 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                {idx + 1}
              </div>
              <span className="text-xs text-slate-700 font-medium leading-relaxed">
                {rec}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
