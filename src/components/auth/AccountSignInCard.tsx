"use client";

import React, { useState } from "react";
import CustomerAuthModal from "@/components/auth/CustomerAuthModal";
import { UserRound, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AccountSignInCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="card-lux !transform-none flex flex-col items-center text-center px-6 py-14 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-paper border border-ink/10 flex items-center justify-center text-gold-dark shadow-xs">
          <UserRound size={24} strokeWidth={1.75} />
        </div>
        <h2 className="text-2xl font-semibold text-ink mt-5">Customer Account</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Sign in with Google or Email to view your active orders, reorder previous items, and check out faster.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 w-full max-w-sm">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="btn-dark w-full !py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Sign in to Account</span>
            <ArrowRight size={15} />
          </button>
          <Link
            href="/track-order"
            className="w-full py-3 px-4 rounded-full border border-ink/15 text-sm font-medium text-ink hover:bg-paper transition-colors text-center"
          >
            Track with Order ID
          </Link>
        </div>
      </div>

      <CustomerAuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
