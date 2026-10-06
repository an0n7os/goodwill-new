"use client";

import React, { useEffect, useState } from "react";
import { useDialog } from "@/lib/useDialog";
import { X, ArrowRight, Eye, EyeOff, KeyRound, User, Mail } from "lucide-react";
import { useCustomerAuthStore } from "@/store/customerAuth";
import { getAuthProviders, getCustomerSession } from "@/lib/actions";
import { authClient } from "@/lib/authClient";
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
  const [googleLoading, setGoogleLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dialogRef = useDialog(isOpen, onClose);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) getAuthProviders().then((p) => setGoogleEnabled(p.google));
  }, [isOpen]);

  if (!isOpen) return null;

  const switchMode = (next: "signin" | "register") => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);


    const { error: authError } =
      mode === "signin"
        ? await authClient.signIn.email({ email: email.trim(), password })
        : await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });

    if (authError) {
      setLoading(false);
      setError(authErrorMessage(authError.code, mode));
      return;
    }

    const session = await getCustomerSession();
    setLoading(false);
    if (session) login(session);
    setPassword("");
    onClose();
  };

  const handleGoogle = async () => {
    setError("");
    if (!googleEnabled) {
      setError("Google sign-in is being set up. Please use your email for now.");
      return;
    }
    setGoogleLoading(true);
    const here = window.location.pathname + window.location.search;
    const { error: authError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: here,
      errorCallbackURL: here,
    });
    // On success the browser is redirected to Google; we only get here on failure
    if (authError) {
      setGoogleLoading(false);
      setError("Google sign-in is unavailable right now. Please use email instead.");
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
        ref={dialogRef}
        className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-[2rem] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header band */}
        <div className="relative hero-backdrop noise px-8 pt-8 pb-7 text-white">
          <div className="absolute inset-0 hero-grid pointer-events-none" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
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
          {/* Always shown; works once GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set on the server */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full h-12 rounded-full border border-ink/10 bg-white text-sm font-medium text-ink hover:border-ink/25 hover:bg-paper/60 flex items-center justify-center gap-3 transition-all disabled:opacity-60"
            >
              {googleLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-ink/30 border-t-transparent animate-spin" />
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              <span className="h-px flex-1 bg-ink/[0.08]" />
              or with email
              <span className="h-px flex-1 bg-ink/[0.08]" />
            </div>

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
            <Mail size={16} className={iconClass} />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className={inputClass}
            />
          </div>

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

function authErrorMessage(code: string | undefined, mode: "signin" | "register") {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Incorrect email or password.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "This email is already registered. Please sign in.";
    case "PASSWORD_TOO_SHORT":
      return "Password must be at least 8 characters.";
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
    default:
      return mode === "signin" ? "Sign in failed. Please try again." : "Could not create your account. Please try again.";
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
