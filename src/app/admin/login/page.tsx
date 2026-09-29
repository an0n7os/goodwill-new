"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAdminUser } from "@/lib/actions";
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await loginAdminUser(email, password);
      if (res.success) {
        // Session lives in an httpOnly cookie set by the server; return to the page the proxy bounced from
        const next = new URLSearchParams(window.location.search).get("next");
        router.replace(next && next.startsWith("/admin/") ? next : "/admin/dashboard");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Invalid credentials.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-backdrop noise flex items-center justify-center p-4 relative overflow-hidden">
      {/* Visual Ambient Glows */}
      <div className="absolute inset-0 hero-grid pointer-events-none"></div><div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold-light/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl relative z-10 animate-fade-in flex flex-col gap-6">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] ring-1 ring-gold/40 flex items-center justify-center text-gold-light mb-3">
            <Lock size={22} />
          </div>
          <span className="text-2xl font-semibold tracking-[-0.02em] text-white">
            Goodwill <span className="font-display italic text-gold-gradient">Control Center</span>
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Staff sign-in for CRM &amp; inventory
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Staff Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@goodwill.com"
                className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-sm text-white placeholder-slate-500"
              />
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 text-sm text-white placeholder-slate-500"
              />
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full mt-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-ink border-t-transparent animate-spin"></div>
            ) : (
              <>
                <span>Sign in to dashboard</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck size={13} className="text-gold-light" />
          Authorised staff only. Sessions expire after 7 days.
        </p>

        {/* Back to store link */}
        <div className="text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-gold-light transition-colors">
            ← Return to Storefront Website
          </Link>
        </div>
      </div>
    </div>
  );
}
