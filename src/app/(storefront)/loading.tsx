import React from "react";

export default function StorefrontLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center py-24 px-4 bg-paper/60 animate-fade-in">
      {/* Top glowing progress bar for instant navigation feedback */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 animate-pulse z-50 shadow-xs" />

      {/* Subtle loader circle */}
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-3 border-ink/10 border-t-gold animate-spin" />
      </div>
      <p className="text-xs font-semibold text-slate-500 mt-4 tracking-wide animate-pulse">
        Loading Goodwill Electrical World…
      </p>
    </div>
  );
}
