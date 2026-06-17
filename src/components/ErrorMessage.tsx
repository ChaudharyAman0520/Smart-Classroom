import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      id="scas-error-message"
      className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 max-w-xl mx-auto my-4 shadow-xs"
    >
      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-red-900">Operation Error</h4>
        <p className="text-xs text-red-700 mt-1 select-text">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-950 underline transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Retry Action
          </button>
        )}
      </div>
    </div>
  );
}
