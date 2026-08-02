"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { NotificationProvider } from "@/context/NotificationContext";
import { useNotifications } from "@/hooks/useNotifications";
import ToastContainer from "@/components/ToastContainer";

/**
 * Event listener that catches CustomEvents dispatched by the API fetch client interceptor
 * and routes them to the global notification toast system.
 */
function NotificationEventListener() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    const handleWarning = (event: Event) => {
      const customEvent = event as CustomEvent;
      const message = customEvent.detail?.message || "Rate limited, showing cached data.";
      addNotification(message, "warning");
    };

    window.addEventListener("coingecko-api-warning", handleWarning);
    return () => {
      window.removeEventListener("coingecko-api-warning", handleWarning);
    };
  }, [addNotification]);

  return <ToastContainer />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <NotificationEventListener />
      </QueryClientProvider>
    </NotificationProvider>
  );
}
