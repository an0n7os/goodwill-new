import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Dark title band shared by every inner storefront page
export default function PageHeader({
  eyebrow,
  title,
  accent,
  description,
  breadcrumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: React.ReactNode;
  breadcrumbs?: { href?: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden hero-backdrop noise text-white">
      <div className="absolute inset-0 hero-grid pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          {breadcrumbs && (
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mb-5">
              {breadcrumbs.map((b, i) => (
                <span key={b.label} className="inline-flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={12} className="text-slate-600" />}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-gold-light transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-slate-300">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {eyebrow && <span className="eyebrow eyebrow-light">{eyebrow}</span>}
          <h1 className={`text-4xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] ${eyebrow ? "mt-4" : ""}`}>
            {title}
            {accent && (
              <>
                {" "}
                <span className="font-display italic text-gold-gradient">{accent}</span>
              </>
            )}
          </h1>
          {description && <div className="text-slate-400 mt-4 leading-relaxed">{description}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}
