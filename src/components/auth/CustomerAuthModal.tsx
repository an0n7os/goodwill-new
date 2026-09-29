"use client";

import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { useCustomerAuthStore } from "@/store/customerAuth";
import { customerGoogleAuth } from "@/lib/actions";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerAuthModal({ isOpen, onClose }: CustomerAuthModalProps) {
  const login = useCustomerAuthStore((state) => state.login);
  const [activeTab, setActiveTab] = useState<"google" | "phone" | "email">("google");
  const [loading, setLoading] = useState(false);

  // Phone state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Email state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  if (!isOpen) return null;

  // Handle Google Login Simulation / Real Auth
  const handleGoogleLogin = async (presetUser?: { name: string; email: string; image: string }) => {
    setLoading(true);

    const userToAuth = presetUser || {
      name: name || "Mohammed Nishad",
      email: email || "nishad.kulappully@gmail.com",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    };

    const res = await customerGoogleAuth({
      name: userToAuth.name,
      email: userToAuth.email,
      image: userToAuth.image,
      provider: "google",
    });

    setLoading(false);

    if (res.success && res.user) {
      login({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        image: res.user.image || undefined,
        phone: res.user.phone || undefined,
        provider: "google",
      });
      onClose();
    }
  };

  // Handle Phone OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === "1234" || otp.length === 4) {
      setLoading(true);
      const res = await customerGoogleAuth({
        name: `Customer (${phone.slice(-4)})`,
        email: `${phone}@goodwillelectrical.com`,
        phone: phone,
        provider: "phone",
      });
      setLoading(false);

      if (res.success && res.user) {
        login({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: phone,
          provider: "phone",
        });
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-ink border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden bg-grid-pattern">
        
        {/* Glow ambient */}
        <div className="absolute top-[-30%] right-[-20%] w-[300px] h-[300px] rounded-full bg-gold/[0.1] blur-[90px] pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1 mb-6">
          <div className="flex items-center gap-1.5 text-gold-light bg-gold/10 border border-gold/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] w-fit mb-1">
            <Sparkles size={12} />
            <span>Goodwill Customer Portal</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">
            Sign In to Your Account
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Track orders, save BOQ project quotes, and get direct wholesale billing.
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/10 mb-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab("google")}
            className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "google"
                ? "bg-gold text-ink font-bold shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Google</span>
          </button>
          <button
            onClick={() => setActiveTab("phone")}
            className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "phone"
                ? "bg-gold text-ink font-bold shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Mobile OTP</span>
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "email"
                ? "bg-gold text-ink font-bold shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Email</span>
          </button>
        </div>

        {/* TAB 1: GOOGLE ONE-TAP AUTH */}
        {activeTab === "google" && (
          <div className="flex flex-col gap-4">
            
            {/* Primary Google Login Button */}
            <button
              onClick={() => handleGoogleLogin()}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-100 text-ink font-semibold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              {/* Google Multicolored SVG Logo */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? "Signing in..." : "Continue with Google"}</span>
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-[0.16em] font-bold">
                <span className="bg-ink px-3 text-slate-500">Fast Demo Accounts</span>
              </div>
            </div>

            {/* Quick Demo Accounts */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() =>
                  handleGoogleLogin({
                    name: "Mohammed Nishad",
                    email: "nishad.kulappully@gmail.com",
                    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                  })
                }
                className="p-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 text-gold-light font-bold text-xs flex items-center justify-center border border-gold/30">
                    MN
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Mohammed Nishad</div>
                    <div className="text-[11px] text-slate-400 font-bold">House Owner • Kulappully</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-500" />
              </button>

              <button
                onClick={() =>
                  handleGoogleLogin({
                    name: "Sajeev S. (Contractor)",
                    email: "sajeev.builder@gmail.com",
                    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                  })
                }
                className="p-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                    SS
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Sajeev S.</div>
                    <div className="text-[11px] text-slate-400 font-bold">Building Contractor • Shoranur</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-500" />
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: MOBILE OTP */}
        {activeTab === "phone" && (
          <div className="flex flex-col gap-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9744164444"
                      className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-gold-light"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold-light text-ink font-semibold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <span>Send OTP via SMS</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Enter 4-Digit OTP sent to +91 {phone}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    className="w-full text-center tracking-[0.16em] text-lg font-bold py-3 rounded-2xl bg-white/[0.04] border border-white/15 text-gold-light focus:outline-none focus:border-gold-light"
                    required
                  />
                  <p className="text-[11px] text-slate-400 font-bold mt-1 text-center">
                    Demo OTP Code: <span className="text-gold-light">1234</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-ink font-semibold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <span>{loading ? "Verifying..." : "Verify & Sign In"}</span>
                  <CheckCircle2 size={14} />
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: EMAIL LOGIN */}
        {activeTab === "email" && (
          <form onSubmit={() => handleGoogleLogin({ name: name || "Customer", email: email || "user@goodwill.com", image: "" })} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Your Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-gold-light"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@goodwillelectrical.com"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-gold-light"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light text-ink font-semibold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>{loading ? "Signing In..." : "Sign In with Email"}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-bold">
          <div className="flex items-center gap-1">
            <Lock size={12} className="text-emerald-400" />
            <span>256-Bit SSL Encrypted Session</span>
          </div>
          <span>Goodwill Electrical World</span>
        </div>

      </div>
    </div>
  );
}
