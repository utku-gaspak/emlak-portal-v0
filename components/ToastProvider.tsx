"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

type ToastMessage = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastProviderProps = {
  children: ReactNode;
};

function getToastStyles(type: ToastType) {
  switch (type) {
    case "success":
      return {
        wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
        icon: "text-emerald-600 dark:text-emerald-400"
      };
    case "error":
      return {
        wrapper: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
        icon: "text-red-600 dark:text-red-400"
      };
    default:
      return {
        wrapper: "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        icon: "text-slate-500 dark:text-slate-300"
      };
  }
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((toastId: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [{ id, message, type }, ...current].slice(0, 3));
      window.setTimeout(() => removeToast(id), 3200);
    },
    [removeToast]
  );

  const contextValue = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="fixed right-4 top-4 z-[200] flex w-[min(100%-2rem,24rem)] flex-col gap-3">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          const Icon = toast.type === "success" ? CheckCircle2 : toast.type === "error" ? AlertTriangle : Info;

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur ${styles.wrapper}`}
              role="status"
              aria-live="polite"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} />
              <p className="text-sm font-medium leading-6">{toast.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    return {
      showToast: (message: string) => window.alert(message)
    };
  }

  return context;
}
