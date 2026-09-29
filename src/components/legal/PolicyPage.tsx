import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { MessageSquare, Phone, Mail } from "lucide-react";

export const POLICY_LAST_UPDATED = "27 September 2026";

const policyNav = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Returns & Refunds" },
  { href: "/delivery-policy", label: "Delivery Policy" },
  { href: "/warranty", label: "Warranty Support" },
];

export interface PolicySection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export default function PolicyPage({
  eyebrow,
  title,
  intro,
  current,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  current: string;
  sections: PolicySection[];
}) {
  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />

      {/* Title band */}
      <section className="relative overflow-hidden hero-backdrop noise text-white">
        <div className="absolute inset-0 hero-grid pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <span className="eyebrow eyebrow-light">{eyebrow}</span>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] mt-4">{title}</h1>
          <p className="text-slate-400 mt-4 max-w-2xl leading-relaxed">{intro}</p>
          <p className="text-xs text-slate-500 mt-6">Last updated: {POLICY_LAST_UPDATED}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 md:py-20 grid lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-32 flex flex-col gap-8">
            <nav aria-label="Policies" className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 mb-2">Policies</span>
              {policyNav.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                    p.href === current ? "bg-ink text-white font-medium" : "text-slate-600 hover:bg-white hover:text-ink"
                  }`}
                >
                  {p.label}
                </Link>
              ))}
            </nav>

            <nav aria-label="On this page" className="hidden lg:flex flex-col gap-2 border-l border-ink/10 pl-4">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 mb-1">On this page</span>
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="text-[13px] text-slate-500 hover:text-ink transition-colors">
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <article className="lg:col-span-9 flex flex-col gap-4">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="card-lux !transform-none p-7 md:p-9 scroll-mt-32">
              <div className="flex items-baseline gap-4">
                <span className="text-xs font-medium text-gold-dark tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-ink">{s.title}</h2>
              </div>
              <div className="policy-prose mt-4 pl-0 md:pl-8">{s.body}</div>
            </section>
          ))}

          {/* Contact card */}
          <div className="rounded-3xl bg-ink text-white p-7 md:p-9 mt-4 relative overflow-hidden noise">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
            <h2 className="relative text-xl md:text-2xl font-semibold tracking-tight">
              Questions about this policy?
            </h2>
            <p className="relative text-sm text-slate-400 mt-2 max-w-xl">
              Talk to us at the showroom (opp. Kulappully Bus Stand, Mon–Sat 8 AM–8 PM) or reach us directly.
            </p>
            <div className="relative flex flex-wrap gap-3 mt-6">
              <a href="https://wa.me/919744164444" target="_blank" rel="noopener noreferrer" className="btn-gold">
                <MessageSquare size={16} /> WhatsApp 97441 64444
              </a>
              <a href="tel:+919544554555" className="btn-outline-light">
                <Phone size={15} /> 95445 54555
              </a>
              <a href="mailto:info@goodwillelectrical.com" className="btn-outline-light">
                <Mail size={15} /> info@goodwillelectrical.com
              </a>
            </div>
          </div>
        </article>
      </section>

      <Footer />
    </div>
  );
}
