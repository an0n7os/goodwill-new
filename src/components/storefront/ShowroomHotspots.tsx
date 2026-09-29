"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Droplets, Bath, ArrowRight } from "lucide-react";

interface Hotspot {
  id: string;
  top: string;
  left: string;
  title: string;
  category: string;
  desc: string;
  link: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  iconColor: string;
  tooltipPos: "top" | "bottom" | "left" | "right";
}

export default function ShowroomHotspots() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const hotspots: Hotspot[] = [
    {
      id: "switches",
      top: "55%",
      left: "22%",
      title: "Modular Switches",
      category: "Electrical",
      desc: "Legrand & Goldmedal modular plates. Premium gold finishes, touch switches, and smart controls.",
      link: "/products?category=switches-sockets",
      icon: Zap,
      iconColor: "text-gold bg-gold/10",
      tooltipPos: "right",
    },
    {
      id: "pipes",
      top: "68%",
      left: "42%",
      title: "CPVC & UPVC Pipes",
      category: "Plumbing",
      desc: "Supreme FlowGuard lead-free high-pressure pipes & SWR drainage fittings direct from factory.",
      link: "/products?category=upvc-cpvc-pipes",
      icon: Droplets,
      iconColor: "text-gold bg-gold/10",
      tooltipPos: "top",
    },
    {
      id: "bath",
      top: "63%",
      left: "74%",
      title: "Aura Bath Fittings",
      category: "Sanitary & Bath",
      desc: "Jaquar single-lever mixers, rain showers, and CERA designer countertop basins.",
      link: "/products?category=taps-mixers",
      icon: Bath,
      iconColor: "text-rose-500 bg-rose-500/10",
      tooltipPos: "left",
    },
  ];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100 group/container select-none">
      {/* Showroom Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/goodwill_hero_showroom_v2.png"
        alt="Goodwill Electrical World Showroom Display"
        className="w-full h-full object-cover transition-transform duration-700 group-hover/container:scale-[1.02]"
      />

      {/* Floating Top Pill Badge */}
      <div className="absolute top-4 left-4 bg-ink/80 text-white text-[11px] font-medium px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 backdrop-blur-sm z-10 border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
        <span>Hover to explore the showroom</span>
      </div>

      {/* Hotspots overlay */}
      {hotspots.map((spot) => {
        const Icon = spot.icon;
        const isActive = activeId === spot.id;

        // Position class for tooltip arrow & alignment
        let tooltipPositionClass = "";
        switch (spot.tooltipPos) {
          case "top":
            tooltipPositionClass = "bottom-full left-1/2 -translate-x-1/2 mb-4";
            break;
          case "bottom":
            tooltipPositionClass = "top-full left-1/2 -translate-x-1/2 mt-4";
            break;
          case "left":
            tooltipPositionClass = "right-full top-1/2 -translate-y-1/2 mr-4";
            break;
          case "right":
            tooltipPositionClass = "left-full top-1/2 -translate-y-1/2 ml-4";
            break;
        }

        return (
          <div
            key={spot.id}
            className="absolute z-20"
            style={{ top: spot.top, left: spot.left }}
            onMouseEnter={() => setActiveId(spot.id)}
            onMouseLeave={() => setActiveId(null)}
          >
            {/* The Pulsing Core Dot */}
            <div className="relative flex items-center justify-center cursor-pointer">
              {/* Outer pulsing ring */}
              <span className="absolute inline-flex h-7 w-7 rounded-full bg-white opacity-40 animate-ping"></span>
              {/* Inner glowing ring */}
              <span className={`absolute inline-flex h-5 w-5 rounded-full ${isActive ? "bg-gold scale-125" : "bg-ink"} opacity-75 border-2 border-white transition-all duration-300`}></span>
              {/* Core dot */}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? "bg-white" : "bg-gold-light"} transition-all duration-300`}></span>
            </div>

            {/* Hover Tooltip Card */}
            <div
              className={`absolute ${tooltipPositionClass} w-64 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 transition-all duration-300 ease-out origin-center ${
                isActive
                  ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              {/* Tooltip Arrow */}
              <div
                className={`absolute w-3 h-3 bg-white/95 border border-slate-200 rotate-45 ${
                  spot.tooltipPos === "top"
                    ? "bottom-[-6px] left-1/2 -translate-x-1/2 border-t-0 border-l-0"
                    : spot.tooltipPos === "bottom"
                    ? "top-[-6px] left-1/2 -translate-x-1/2 border-b-0 border-r-0"
                    : spot.tooltipPos === "left"
                    ? "right-[-6px] top-1/2 -translate-y-1/2 border-b-0 border-l-0"
                    : "left-[-6px] top-1/2 -translate-y-1/2 border-t-0 border-r-0"
                }`}
              />

              {/* Tooltip Content */}
              <div className="relative z-10 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${spot.iconColor}`}>
                    <Icon size={14} className="stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {spot.category}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wide">
                    {spot.title}
                  </h4>
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                    {spot.desc}
                  </p>
                </div>

                <Link
                  href={spot.link}
                  className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-gold-dark hover:text-ink border-t border-slate-100 pt-2.5 transition-colors group/link"
                >
                  <span>Explore Products</span>
                  <ArrowRight size={11} className="transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
