"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type?: "success" | "info" | "warning";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: "success" | "info" | "warning" = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast container */}
      <aside
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-3rem)] pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            role="status"
            className="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-ink bg-lime text-ink shadow-pop animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-center gap-2.5 font-semibold text-[14px] leading-snug">
              <span className="text-[18px]">✨</span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="font-mono text-[16px] leading-none px-1.5 py-0.5 rounded hover:bg-black/10 transition-colors"
              aria-label="Dismiss notification"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
