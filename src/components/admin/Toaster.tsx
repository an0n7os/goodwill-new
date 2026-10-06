"use client";

import { create } from "zustand";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

type ToastKind = "success" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const useToasts = create<{ items: ToastItem[]; push: (t: Omit<ToastItem, "id">) => void; dismiss: (id: number) => void }>(
  (set) => ({
    items: [],
    push: (t) => {
      const id = Date.now() + Math.random();
      set((s) => ({ items: [...s.items.slice(-2), { ...t, id }] }));
      setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), t.kind === "error" ? 6000 : 3500);
    },
    dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  })
);

// Admin notifications in place of window.alert
export const toast = {
  success: (message: string) => useToasts.getState().push({ kind: "success", message }),
  error: (message: string) => useToasts.getState().push({ kind: "error", message }),
};

export default function Toaster() {
  const { items, dismiss } = useToasts();
  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2 w-[min(22rem,calc(100vw-2.5rem))]" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg animate-fade-in bg-white ${
            t.kind === "error" ? "border-red-200 text-red-700" : "border-emerald-200 text-ink"
          }`}
        >
          {t.kind === "error" ? (
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-600" />
          )}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-ink">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
