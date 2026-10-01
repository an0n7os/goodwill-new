"use client";

import React, { useEffect, useState } from "react";
import { X, ArrowRight, Eye, EyeOff, Phone, KeyRound, User, Mail } from "lucide-react";
import { useCustomerAuthStore } from "@/store/customerAuth";
import { loginCustomer, registerCustomer } from "@/lib/actions";
import BrandLogo from "@/components/layout/BrandLogo";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerAuthModal({ isOpen, onClose }: CustomerAuthModalProps) {
  const login = useCustomerAuthStore((state) => state.login);
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const switchMode = (next: "signin" | "register") => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res =
      mode === "signin"
        ? await loginCustomer({ phone, password })
        : await registerCustomer({ name, phone, email, password });
    setLoading(false);

    if (res.success) {
      login(res.user);
      setPassword("");
      onClose();
    } else {
      setError(res.error);
    }
  };

  const fieldWrap = "relative";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none";
  const inputClass =
    "w-full h-12 pl-11 pr-4 rounded-full border border-ink/10 bg-paper/60 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 focus:bg-white transition-all";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header band */}
        <div className="relative hero-backdrop noise px-8 pt-8 pb-7 text-white">
          <div className="absolute inset-0 hero-grid pointer-events-none" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 w-9 h-9 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
          <div className="relative">
            <BrandLogo tone="light" size="sm" subtitle={null} />
            <h2 id="auth-title" className="text-2xl font-semibold tracking-[-0.02em] mt-5">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              {mode === "signin"
                ? "Sign in to see your orders and check out faster."
                : "Save your details and track every order in one place."}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6">
          <div className="grid grid-cols-2 p-1 rounded-full bg-paper border border-ink/[0.06] text-sm font-medium">
            {(["signin", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`h-10 rounded-full transition-all ${mode === m ? "bg-ink text-white shadow-sm" : "text-slate-500 hover:text-ink"}`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pt-5 pb-8 flex flex-col gap-3.5">
          {mode === "register" && (
            <div className={fieldWrap}>
              <User size={16} className={iconClass} />
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className={inputClass}
              />
            </div>
          )}

          <div className={fieldWrap}>
            <Phone size={16} className={iconClass} />
            <span className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">+91</span>
            <input
              type="tel"
              required
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile number"
              className={`${inputClass} !pl-[4.5rem]`}
            />
          </div>

          {mode === "register" && (
            <div className={fieldWrap}>
              <Mail size={16} className={iconClass} />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className={inputClass}
              />
            </div>
          )}

          <div className={fieldWrap}>
            <KeyRound size={16} className={iconClass} />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={mode === "register" ? 8 : undefined}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Create a password (8+ characters)" : "Password"}
              className={`${inputClass} !pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-slate-400 hover:text-ink flex items-center justify-center"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-sm text-red-600 px-1">{error}</p>}

          <button type="submit" disabled={loading} className="btn-dark w-full !py-3.5 !text-sm mt-1 disabled:opacity-60">
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                {mode === "signin" ? "Sign in" : "Create account"}
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center mt-1">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button type="button" onClick={() => switchMode("register")} className="text-gold-dark font-medium hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("signin")} className="text-gold-dark font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Forgot your password? WhatsApp us on 97441 64444 and we&apos;ll help you reset it.
            <br />
            You can also check out as a guest — no account needed.
          </p>
        </form>
      </div>
    </div>
  );
}
