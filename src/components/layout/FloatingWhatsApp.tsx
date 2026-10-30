"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X } from "lucide-react";

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const [isDismissed, setIsDismissed] = useState(false);

  // Hide on admin routes
  if (pathname.startsWith("/admin")) return null;

  return (
    <div
      aria-label="Direct WhatsApp Contact"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30 flex items-end flex-col gap-2 pointer-events-none"
    >
      {!isDismissed && (
        <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md border border-ink/10 rounded-2xl p-2.5 pr-3 shadow-xl text-xs text-ink animate-fade-in max-w-xs">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium">Send material list or BOQ on WhatsApp for instant rates</span>
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss hint"
            className="text-slate-400 hover:text-ink ml-1 p-0.5 rounded transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <a
        href="https://wa.me/919744164444?text=Hi%20Goodwill%2C%20I%20would%20like%20to%20inquire%20about%20materials%20and%20pricing."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Goodwill Electrical World on WhatsApp"
        className="pointer-events-auto group relative flex items-center gap-2.5 h-12 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-lg shadow-emerald-950/25 active:scale-95 transition-all"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-70"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <MessageSquare size={17} className="fill-white/20" />
        <span className="hidden sm:inline">WhatsApp us</span>
      </a>
    </div>
  );
}
