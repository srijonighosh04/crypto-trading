"use client";

import { useContext } from "react";
import { NotificationContext } from "@/context/NotificationContext";

/**
 * Custom React hook to publish and dismiss global toast notifications.
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
