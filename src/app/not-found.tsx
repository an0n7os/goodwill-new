import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowRight, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found | Goodwill Electrical World",
};

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />

      <main className="relative flex-grow overflow-hidden hero-backdrop noise text-white flex items-center">
        <div className="absolute inset-0 hero-grid pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-24 md:py-32 text-center">
          <span className="eyebrow eyebrow-light justify-center">Error 404</span>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.035em] mt-6 leading-[1.02]">
            This page is
            <br />
            <span className="font-display italic text-gold-gradient">off the grid.</span>
          </h1>
          <p className="text-slate-400 mt-6 max-w-md mx-auto leading-relaxed">
            The link may be old or the product may have moved. Browse the catalogue, or tell us what you
            need and we&apos;ll find it.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10">
            <Link href="/products" className="btn-gold">
              Browse the catalogue <ArrowRight size={16} />
            </Link>
            <a href="https://wa.me/919744164444" target="_blank" rel="noopener noreferrer" className="btn-outline-light">
              <MessageSquare size={16} className="text-emerald-400" />
              Ask on WhatsApp
            </a>
          </div>
          <Link href="/" className="inline-block mt-8 text-sm text-slate-400 hover:text-gold-light transition-colors">
            ← Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
