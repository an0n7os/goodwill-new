"use client";

import React, { useState } from "react";
import { Ticket, Check, Info } from "lucide-react";
import { validateCoupon } from "@/lib/actions";
import { formatINR } from "@/lib/pricing";

interface AvailableCouponsProps {
  subtotal: number;
  appliedCoupon: {
    code: string;
    type: string;
    value: number;
    maxDiscount?: number | null;
  } | null;
  onApplyCoupon: (coupon: {
    code: string;
    type: string;
    value: number;
    maxDiscount?: number | null;
  }) => void;
  onRemoveCoupon: () => void;
}

export default function AvailableCoupons({
  subtotal,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}: AvailableCouponsProps) {
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [applying, setApplying] = useState(false);

  const handleApply = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const clean = manualCode.trim().toUpperCase();
    if (!clean) return;

    setErrorMsg("");
    setSuccessMsg("");
    setApplying(true);

    try {
      const res = await validateCoupon(clean, subtotal);
      if (res.valid && res.coupon) {
        onApplyCoupon({
          code: res.coupon.code,
          type: res.coupon.type,
          value: res.coupon.value,
          maxDiscount: res.coupon.maxDiscount,
        });
        setSuccessMsg(`Coupon '${res.coupon.code}' applied!`);
        setManualCode("");
      } else {
        setErrorMsg(res.error || "Invalid coupon code.");
      }
    } catch {
      setErrorMsg("Could not check coupon. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="card-lux !transform-none p-5 sm:p-6 flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
          <Ticket size={16} className="text-gold-dark" />
          <span>Have a promo code?</span>
        </h3>
      </div>

      {/* Currently Applied Badge */}
      {appliedCoupon ? (
        <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check size={14} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm tracking-wider font-mono">
                  {appliedCoupon.code}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-md">
                  Applied
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-medium mt-0.5">
                {appliedCoupon.type === "percentage"
                  ? `${appliedCoupon.value}% discount applied`
                  : appliedCoupon.type === "free_delivery"
                  ? "Free delivery applied"
                  : `₹${formatINR(appliedCoupon.value)} discount applied`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onRemoveCoupon();
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 rounded transition-colors whitespace-nowrap"
          >
            Remove
          </button>
        </div>
      ) : (
        /* Manual Code Input */
        <div className="relative">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => {
              setManualCode(e.target.value.toUpperCase());
              setErrorMsg("");
              setSuccessMsg("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply(e);
              }
            }}
            placeholder="Enter coupon code"
            className="w-full h-11 pl-4 pr-24 border border-ink/15 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm uppercase tracking-wider font-mono placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={!manualCode.trim() || applying}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-5 rounded-full bg-ink hover:bg-ink-2 disabled:bg-slate-300 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            {applying ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Apply"
            )}
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl flex items-center gap-1.5 animate-fade-in">
          <Info size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}

      {successMsg && !appliedCoupon && (
        <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1.5 animate-fade-in">
          <Check size={14} className="shrink-0" />
          <span>{successMsg}</span>
        </p>
      )}
    </div>
  );
}
