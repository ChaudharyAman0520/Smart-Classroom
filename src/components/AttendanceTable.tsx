import React from "react";
import { Check, X, User as UserIcon } from "lucide-react";

interface RosterStudent {
  id: string;
  name: string;
  email: string;
}

interface AttendanceTableProps {
  students: RosterStudent[];
  records: Record<string, "present" | "absent">; // studentId -> status
  onToggleStatus?: (studentId: string) => void;
  readOnly?: boolean;
}

export default function AttendanceTable({
  students,
  records,
  onToggleStatus,
  readOnly = false,
}: AttendanceTableProps) {
  if (!students || students.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl" id="attendance-table-empty">
        <p className="text-slate-400 text-sm font-medium">No students enrolled in this classroom directory.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-xs" id="attendance-table-container">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Student Information
            </th>
            <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
              Status Indicator
            </th>
            {!readOnly && onToggleStatus && (
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">
                Quick Toggle
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {students.map((student) => {
            const status = records[student.id] || "absent";
            const isPresent = status === "present";

            return (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4.5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0 border border-slate-200">
                      {student.name.charAt(0)}
                    </div>
                    <div className="ml-3.5">
                      <div className="text-sm font-bold text-slate-900 leading-none mb-1">
                        {student.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <span>{student.id}</span>
                        <span className="inline-block text-[10px] text-slate-300">•</span>
                        <span>{student.email}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition ${
                      isPresent
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                        : "bg-red-50 text-red-800 border-red-100"
                    }`}
                  >
                    {isPresent ? (
                      <>
                        <Check className="h-3 w-3" />
                        Present
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        Absent
                      </>
                    )}
                  </span>
                </td>

                {!readOnly && onToggleStatus && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(student.id)}
                      className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-semibold rounded-lg border shadow-xs transition-all ${
                        isPresent
                          ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                          : "bg-blue-600 text-white hover:bg-blue-700 border-blue-700"
                      }`}
                    >
                      {isPresent ? "Mark Absent" : "Mark Present"}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
