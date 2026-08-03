import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh] text-center select-none">
      <div className="rounded-2xl border border-border bg-card p-10 max-w-md w-full shadow-2xl flex flex-col items-center space-y-6">
        {/* Warning Icon Banner */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger border border-danger/20">
          <AlertCircle className="h-6 w-6" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-white tracking-tight">404 — Page Not Found</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-hover px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] shadow-lg shadow-primary/25"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
