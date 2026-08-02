"use client";

import React, { createContext, useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  durationMs?: number;
}

interface NotificationContextType {
  toasts: Toast[];
  addNotification: (message: string, type: Toast["type"], durationMs?: number) => void;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addNotification = useCallback(
    (message: string, type: Toast["type"], durationMs = 5000) => {
      setToasts((prev) => {
        // De-duplicate: ignore if the exact same warning/error message is already active in toasts list
        if (prev.some((t) => t.message === message && t.type === type)) {
          return prev;
        }

        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, message, type, durationMs };

        // Set auto-dismiss timer
        if (durationMs > 0) {
          setTimeout(() => {
            removeNotification(id);
          }, durationMs);
        }

        return [...prev, newToast];
      });
    },
    [removeNotification]
  );

  return (
    <NotificationContext.Provider value={{ toasts, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
