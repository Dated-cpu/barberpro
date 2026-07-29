'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 max-sm:left-4 max-sm:right-4 max-sm:translate-x-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg animate-toast-in min-w-[300px] max-sm:w-full',
              toast.type === 'success' && 'border-success bg-success-bg text-success',
              toast.type === 'error' && 'border-error bg-error-bg text-error',
              toast.type === 'info' && 'border-border-light bg-bg-tertiary text-text-primary',
            )}
          >
            <span className="flex-1 text-sm font-body">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Закрыть"
              className="flex h-5 w-5 items-center justify-center rounded opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
