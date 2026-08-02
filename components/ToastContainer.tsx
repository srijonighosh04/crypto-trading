"use client";

import React from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeNotification } = useNotifications();

  if (toasts.length === 0) return null;

  const typeConfigs = {
    info: {
      bgClass: "bg-[#121420]/80 border-primary/30 text-primary-light",
      icon: <Info className="h-5 w-5 text-primary" />,
    },
    success: {
      bgClass: "bg-[#121420]/80 border-success/30 text-success-light",
      icon: <CheckCircle2 className="h-5 w-5 text-success" />,
    },
    warning: {
      bgClass: "bg-[#121420]/80 border-warning/30 text-warning-light",
      icon: <AlertTriangle className="h-5 w-5 text-warning animate-pulse" />,
    },
    error: {
      bgClass: "bg-[#121420]/80 border-danger/30 text-danger-light",
      icon: <XCircle className="h-5 w-5 text-danger" />,
    },
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        const config = typeConfigs[toast.type] || typeConfigs.info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-xl border backdrop-blur-md p-4 shadow-2xl flex items-start gap-3 transition-all duration-300 animate-fade-in ${config.bgClass}`}
            role="alert"
          >
            {/* Type Status Icon */}
            <div className="flex-shrink-0 mt-0.5">{config.icon}</div>

            {/* Notification message */}
            <div className="flex-grow pr-4">
              <p className="text-xs font-semibold text-white/90 leading-relaxed">
                {toast.message}
              </p>
            </div>

            {/* Dismiss Close Button */}
            <button
              onClick={() => removeNotification(toast.id)}
              className="flex-shrink-0 text-text-muted hover:text-white rounded transition p-0.5 hover:bg-card-light/40"
              title="Dismiss alert"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Animated bottom remaining duration bar indicator */}
            {toast.durationMs && toast.durationMs > 0 && (
              <div 
                className={`absolute bottom-0 left-0 h-0.5 ${
                  toast.type === "success" ? "bg-success" : 
                  toast.type === "warning" ? "bg-warning" : 
                  toast.type === "error" ? "bg-danger" : "bg-primary"
                }`}
                style={{
                  width: "100%",
                  animation: `shrinkWidth ${toast.durationMs}ms linear forwards`
                }}
              />
            )}
          </div>
        );
      })}

      {/* Global CSS Inject to support remaining width bar animations */}
      <style jsx global>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-fade-in {
          animation: slideInAndFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInAndFade {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
