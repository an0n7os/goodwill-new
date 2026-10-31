"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X } from "lucide-react";

function WhatsAppIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z" />
    </svg>
  );
}

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
        title="Chat with Goodwill on WhatsApp (97441 64444)"
        className="pointer-events-auto group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-950/25 active:scale-95 transition-all hover:scale-105"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-70"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white"></span>
        </span>
        <WhatsAppIcon className="w-6 h-6 md:w-7 md:h-7" />
      </a>
    </div>
  );
}
