"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck, BadgeCheck, Zap } from "lucide-react";

interface MarqueeProps { children: React.ReactNode; isPaused?: boolean; pauseOnInteraction?: boolean; className?: string; reverse?: boolean; }

// Compound Marquee primitives matching component structure with pauseOnInteraction
const Marquee = {
  Root: ({ children, pauseOnInteraction = true, className = "" }: MarqueeProps) => {
    const [isPaused, setIsPaused] = useState(false);
    return (
      <div
        className={`relative w-full overflow-hidden py-3 ${className}`}
        onMouseEnter={() => pauseOnInteraction && setIsPaused(true)}
        onMouseLeave={() => pauseOnInteraction && setIsPaused(false)}
        onTouchStart={() => pauseOnInteraction && setIsPaused(true)}
        onTouchEnd={() => pauseOnInteraction && setIsPaused(false)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-48 bg-gradient-to-r from-paper via-paper/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-48 bg-gradient-to-l from-paper via-paper/80 to-transparent z-20 pointer-events-none" />
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<MarqueeProps>, { isPaused })
            : child
        )}
      </div>
    );
  },
  Viewport: ({ children, isPaused }: MarqueeProps) => (
    <div className="flex w-full overflow-hidden select-none">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<MarqueeProps>, { isPaused })
          : child
      )}
    </div>
  ),
  Content: ({ children, isPaused, reverse = false }: MarqueeProps) => (
    <div
      className={`flex gap-5 ${
        reverse ? "animate-marquee-scroll-reverse" : "animate-marquee-scroll"
      }`}
      style={{ animationPlayState: isPaused ? "paused" : "running" }}
    >
      {children}
    </div>
  ),
  Item: ({ children }: MarqueeProps) => (
    <div className="flex-shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105 px-1 sm:px-2">
      {children}
    </div>
  ),
};

const items = [
  { name: "Philips", slug: "philips", img: "/brands/philips.png", bg: "bg-white" },
  { name: "Legrand", slug: "legrand", img: "/brands/legrand.png", bg: "bg-white" },
  { name: "Jaquar", slug: "jaquar", img: "/brands/jaquar.png", bg: "bg-white" },
  { name: "Supreme", slug: "supreme", img: "/brands/supreme.png", bg: "bg-white" },
  { name: "Finolex", slug: "finolex", img: "/brands/finolex.png", bg: "bg-white" },
  { name: "CERA", slug: "cera", img: "/brands/cera.png", bg: "bg-white" },
];

export default function BrandShowcase() {
  // Repeat the list so the -50% marquee loop stays seamless on wide screens
  const marqueeItems = [...items, ...items, ...items, ...items];

  return (
    <section className="bg-paper py-14 md:py-20 relative overflow-hidden text-ink select-none">

      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-10 relative z-10 reveal">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="eyebrow">Direct factory distribution</span>

            <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-[-0.03em] mt-4 leading-[1.08]">
              Authorised{" "}
              <span className="font-display italic text-gold-dark">brand partners.</span>
            </h2>

            <p className="text-slate-500 mt-4 leading-relaxed">
              Official stockist &amp; distributor for leading electrical, plumbing &amp; sanitaryware brands in Shoranur &amp; Kulappully.
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 text-[13px] text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-gold-dark" strokeWidth={1.75} />
                100% genuine
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck size={15} className="text-gold-dark" strokeWidth={1.75} />
                Manufacturer warranty
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap size={15} className="text-gold-dark" strokeWidth={1.75} />
                Ready stock
              </span>
            </div>
          </div>

          <Link href="/products" className="link-arrow w-fit">
            Explore all brands
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── CLIENT MARQUEE COMPONENT WITH pauseOnInteraction ── */}
      <Marquee.Root pauseOnInteraction>
        <Marquee.Viewport>
          <Marquee.Content>
            {marqueeItems.map((item, i) => (
              <Marquee.Item key={i}>
                <Link
                  href={`/products?search=${encodeURIComponent(item.name)}`}
                  className="group relative block cursor-pointer"
                  title={`Explore ${item.name}`}
                >
                  {/* Logo PNGs are square with wide white margins; object-cover crops them to the wordmark */}
                  <div className="w-44 h-24 sm:w-56 sm:h-28 rounded-2xl bg-white border border-ink/[0.06] shadow-[0_1px_2px_rgba(11,15,25,0.04)] overflow-hidden group-hover:border-gold/50 group-hover:shadow-lg transition-all duration-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.img}
                      alt={`${item.name} Official Logo`}
                      className="w-full h-full object-cover scale-[0.92] group-hover:scale-100 transition-transform duration-500"
                    />
                  </div>
                </Link>
              </Marquee.Item>
            ))}
          </Marquee.Content>
        </Marquee.Viewport>
      </Marquee.Root>

      {/* Bottom Subtle Trust Note */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-6 relative z-10">
        <p className="text-xs text-slate-400 tracking-[0.18em] uppercase">
          Serving Shoranur &middot; Kulappully &middot; Cheruthuruthy &middot; Vaniamkulam &middot; Ottapalam &middot; Pattambi
        </p>
      </div>
    </section>
  );
}
