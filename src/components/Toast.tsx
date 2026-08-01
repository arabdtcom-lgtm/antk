/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    timerRef.current = setTimeout(() => onDismiss(toast.id), duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const styles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
    success: {
      bg: 'bg-[#0a1f0a]',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
      icon: <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
    },
    error: {
      bg: 'bg-[#1a0a0a]',
      border: 'border-rose-500/40',
      text: 'text-rose-300',
      icon: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
    },
    info: {
      bg: 'bg-[#0a0f1a]',
      border: 'border-amber-500/40',
      text: 'text-amber-300',
      icon: <Info className="h-4 w-4 text-amber-400 shrink-0" />
    }
  };

  const s = styles[toast.type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl ${s.bg} ${s.border} ${s.text} animate-slide-in-right max-w-sm w-full`}
      role="alert"
    >
      {s.icon}
      <p className="text-xs font-semibold flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5 opacity-60" />
      </button>
    </div>
  );
}

// ─── Toast Container ────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string, duration?: number) => addToast(msg, 'success', duration), [addToast]);
  const error   = useCallback((msg: string, duration?: number) => addToast(msg, 'error', duration), [addToast]);
  const info    = useCallback((msg: string, duration?: number) => addToast(msg, 'info', duration), [addToast]);

  return { toasts, addToast, dismiss, success, error, info };
}
