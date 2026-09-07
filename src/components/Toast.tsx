import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export function createToastState() {
  let toasts: ToastItem[] = [];
  let listeners: Array<(toasts: ToastItem[]) => void> = [];

  const notify = () => {
    listeners.forEach((fn) => fn([...toasts]));
  };

  return {
    getToasts: () => [...toasts],
    show: (message: string, type: ToastType = 'info'): string => {
      const id = Math.random().toString(36).slice(2, 9);
      toasts.push({ id, message, type });
      notify();
      setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id);
        notify();
      }, 4000);
      return id;
    },
    dismiss: (id: string) => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    },
    subscribe: (listener: (toasts: ToastItem[]) => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
  };
}

export const toastManager = createToastState();

interface ToastContainerProps {
  toasts?: ToastItem[];
  onDismiss?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts = [],
  onDismiss,
}) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-xl backdrop-blur-md border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
              isSuccess
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
                : isError
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
                : 'bg-zinc-900/90 text-zinc-200 border-zinc-700/40'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
