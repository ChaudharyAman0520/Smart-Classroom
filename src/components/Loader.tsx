import React from "react";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  message?: string;
  fullPage?: boolean;
}

export default function Loader({ message = "Retrieving classroom systems...", fullPage = false }: LoaderProps) {
  const containerStyle = fullPage
    ? "fixed inset-0 min-h-screen bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center z-50"
    : "flex flex-col items-center justify-center p-8 w-full";

  return (
    <div className={containerStyle} id="scas-loader">
      <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      {message && (
        <span className="mt-3 text-sm text-slate-500 font-medium tracking-wide">
          {message}
        </span>
      )}
    </div>
  );
}
