"use client";

import React, { useState, useTransition } from "react";
import type { Coupon } from "@prisma/client";
import { saveCoupon, setCouponActive, deleteCoupon } from "@/lib/adminActions";
import { toast } from "@/components/admin/Toaster";
import { formatINR } from "@/lib/pricing";
import { Plus, Pencil, Trash2, TicketPercent, X } from "lucide-react";

type Form = {
  id?: string;
  code: string;
  type: string;
  value: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
};

const EMPTY: Form = { code: "", type: "percentage", value: "", minOrder: "", maxDiscount: "", usageLimit: "", expiresAt: "", isActive: true };

function describe(c: Coupon) {
  if (c.type === "free_delivery") return "Free delivery";
  if (c.type === "flat") return `₹${formatINR(c.value)} off`;
  return `${c.value}% off${c.maxDiscount ? ` (max ₹${formatINR(c.maxDiscount)})` : ""}`;
}

function toDateInput(d: Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export default function CouponsClient({ coupons }: { coupons: Coupon[] }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<Form | null>(null);
  // Captured once per mount; good enough for an expiry badge
  const [now] = useState(() => Date.now());

  const edit = (c: Coupon) =>
    setForm({
      id: c.id,
      code: c.code,
      type: c.type,
      value: String(c.value || ""),
      minOrder: c.minOrder ? String(c.minOrder) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      expiresAt: toDateInput(c.expiresAt),
      isActive: c.isActive,
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    startTransition(async () => {
      const res = await saveCoupon({
        id: form.id,
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      });
      if (!res.success) return toast.error(res.error);
      toast.success(form.id ? "Coupon updated." : "Coupon created.");
      setForm(null);
    });
  };

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, ok: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.success) toast.success(ok);
      else toast.error(res.error || "Something went wrong.");
    });

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setForm({ ...EMPTY })} className="adm-btn">
          <Plus size={15} /> New coupon
        </button>
      </div>

      <div className="adm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="adm-table w-full">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min. order</th>
                <th>Used</th>
                <th>Expires</th>
                <th>Status</th>
                <th className="!text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="!py-12 text-center text-slate-400">
                    <TicketPercent size={22} className="mx-auto mb-2 text-slate-300" />
                    No coupons yet. Create one to offer a discount.
                  </td>
                </tr>
              )}
              {coupons.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt).getTime() < now;
                const exhausted = c.usageLimit != null && c.usedCount >= c.usageLimit;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="font-mono font-semibold text-ink">{c.code}</td>
                    <td className="text-slate-700">{describe(c)}</td>
                    <td className="text-slate-500">{c.minOrder ? `₹${formatINR(c.minOrder)}` : "—"}</td>
                    <td className="text-slate-500">
                      {c.usedCount}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                    </td>
                    <td className="text-slate-500">{c.expiresAt ? toDateInput(c.expiresAt) : "Never"}</td>
                    <td>
                      <button
                        onClick={() => run(() => setCouponActive(c.id, !c.isActive), c.isActive ? "Coupon paused." : "Coupon activated.")}
                        disabled={isPending}
                        className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded cursor-pointer ${
                          !c.isActive
                            ? "bg-slate-100 text-slate-500"
                            : expired || exhausted
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                        title="Click to toggle"
                      >
                        {!c.isActive ? "Paused" : expired ? "Expired" : exhausted ? "Used up" : "Active"}
                      </button>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => edit(c)} title="Edit" className="p-2 rounded-lg text-slate-400 hover:text-ink hover:bg-paper cursor-pointer">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => window.confirm(`Delete coupon ${c.code}?`) && run(() => deleteCoupon(c.id), "Coupon deleted.")}
                          disabled={isPending}
                          title="Delete"
                          className="p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setForm(null)}>
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="adm-card w-full max-w-lg p-6 flex flex-col gap-4 animate-fade-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">{form.id ? "Edit coupon" : "New coupon"}</h2>
              <button type="button" onClick={() => setForm(null)} aria-label="Close" className="p-1.5 rounded-full text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="adm-label">Code</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ONAM10"
                  className="adm-input font-mono uppercase"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="adm-label">Type</label>
                <select value={form.type} onChange={(e) => set({ type: e.target.value })} className="adm-input">
                  <option value="percentage">Percentage off</option>
                  <option value="flat">Flat ₹ off</option>
                  <option value="free_delivery">Free delivery</option>
                </select>
              </div>
              {form.type !== "free_delivery" && (
                <div>
                  <label className="adm-label">{form.type === "percentage" ? "Percent (%)" : "Amount (₹)"}</label>
                  <input type="number" min={1} step="any" required value={form.value} onChange={(e) => set({ value: e.target.value })} className="adm-input" />
                </div>
              )}
              {form.type === "percentage" && (
                <div>
                  <label className="adm-label">Max discount ₹ (optional)</label>
                  <input type="number" min={0} value={form.maxDiscount} onChange={(e) => set({ maxDiscount: e.target.value })} className="adm-input" />
                </div>
              )}
              <div>
                <label className="adm-label">Min. order ₹ (optional)</label>
                <input type="number" min={0} value={form.minOrder} onChange={(e) => set({ minOrder: e.target.value })} className="adm-input" />
              </div>
              <div>
                <label className="adm-label">Usage limit (optional)</label>
                <input type="number" min={0} value={form.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })} className="adm-input" />
              </div>
              <div>
                <label className="adm-label">Expires on (optional)</label>
                <input type="date" value={form.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} className="adm-input" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 self-end h-10">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="accent-[var(--color-gold)]" />
                Active
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setForm(null)} className="adm-btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="adm-btn">
                {isPending ? "Saving…" : form.id ? "Save changes" : "Create coupon"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
