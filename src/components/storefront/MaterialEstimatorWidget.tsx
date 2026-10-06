"use client";

import React, { useState } from "react";
import { Calculator, CheckCircle2, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

export default function MaterialEstimatorWidget() {
  const [houseType, setHouseType] = useState<"small" | "medium" | "large" | "villa">("medium");
  const [includeElectrical, setIncludeElectrical] = useState(true);
  const [includePlumbing, setIncludePlumbing] = useState(true);
  const [includeSanitary, setIncludeSanitary] = useState(true);

  // Budget Calculation Logic based on Kerala local builder averages
  const baseRates = {
    small: { sqft: "1,000 Sq. Ft.", electrical: 28000, plumbing: 22000, sanitary: 30000 },
    medium: { sqft: "1,800 Sq. Ft.", electrical: 48000, plumbing: 38000, sanitary: 52000 },
    large: { sqft: "2,500 Sq. Ft.", electrical: 75000, plumbing: 58000, sanitary: 82000 },
    villa: { sqft: "4,000+ Sq. Ft.", electrical: 135000, plumbing: 98000, sanitary: 145000 },
  };

  const currentConfig = baseRates[houseType];
  let totalMin = 0;
  let totalMax = 0;

  if (includeElectrical) {
    totalMin += currentConfig.electrical;
    totalMax += currentConfig.electrical * 1.25;
  }
  if (includePlumbing) {
    totalMin += currentConfig.plumbing;
    totalMax += currentConfig.plumbing * 1.25;
  }
  if (includeSanitary) {
    totalMin += currentConfig.sanitary;
    totalMax += currentConfig.sanitary * 1.3;
  }

  const formattedMin = Math.round(totalMin).toLocaleString("en-IN");
  const formattedMax = Math.round(totalMax).toLocaleString("en-IN");

  const hasCategorySelected = includeElectrical || includePlumbing || includeSanitary;

  const buildWhatsAppUrl = () => {
    if (!hasCategorySelected) return "#";
    const categories = [];
    if (includeElectrical) categories.push("Electrical (Legrand/Finolex)");
    if (includePlumbing) categories.push("Plumbing (Supreme/Ashirvad)");
    if (includeSanitary) categories.push("Sanitaryware (Jaquar/CERA)");

    const text = `Hello Goodwill Electrical World! 👋\n\nI used your online Material Calculator for my project in Shoranur/Kulappully:\n- House Size: ${currentConfig.sqft}\n- Requirements: ${categories.join(", ")}\n- Estimated Budget: ₹${formattedMin} - ₹${formattedMax}\n\nPlease provide your wholesale price quotation for my project list!`;
    return `https://wa.me/919744164444?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="w-full bg-ink rounded-3xl p-6 md:p-10 border border-slate-800 text-white relative overflow-hidden shadow-2xl bg-grid-pattern">
      {/* Glow highlight */}
      <div className="absolute top-[-20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-gold/[0.08] blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col gap-8">
        
        {/* Widget Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold-light px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] w-fit mb-2">
              <Calculator size={12} />
              <span>Interactive Wholesale Estimator</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase">
              Project Material Cost Calculator
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Select your house size and requirement areas to estimate factory-direct supply savings.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-bold">
            <Sparkles size={14} />
            <span>Direct Wholesale Billing</span>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Options & House Type (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Step 1: Select House Area */}
            <div>
              <label className="text-sm font-semibold text-slate-400 block mb-3">
                1. Select Construction / House Area
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "small", label: "1,000 Sq. Ft.", sub: "2 BHK Villa" },
                  { id: "medium", label: "1,800 Sq. Ft.", sub: "3 BHK Residence" },
                  { id: "large", label: "2,500 Sq. Ft.", sub: "4 BHK House" },
                  { id: "villa", label: "4,000+ Sq. Ft.", sub: "Luxury Villa" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setHouseType(item.id as typeof houseType)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      houseType === item.id
                        ? "bg-gold/20 border-gold-light text-white shadow-lg scale-[1.02]"
                        : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[11px] font-bold opacity-75 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Categories */}
            <div>
              <label className="text-sm font-semibold text-slate-400 block mb-3">
                2. Select Required Supply Categories
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <button
                  onClick={() => setIncludeElectrical(!includeElectrical)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    includeElectrical
                      ? "bg-gold/20 border-gold/60 text-white"
                      : "bg-white/[0.03] border-white/10 text-slate-500"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold">Electrical</span>
                    <span className="text-[11px] text-slate-400 font-bold">Legrand &amp; Finolex</span>
                  </div>
                  <CheckCircle2 size={16} className={includeElectrical ? "text-gold-light" : "text-slate-600"} />
                </button>

                <button
                  onClick={() => setIncludePlumbing(!includePlumbing)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    includePlumbing
                      ? "bg-teal-500/20 border-teal-400 text-white"
                      : "bg-white/[0.03] border-white/10 text-slate-500"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold">Plumbing</span>
                    <span className="text-[11px] text-slate-400 font-bold">Supreme &amp; Ashirvad</span>
                  </div>
                  <CheckCircle2 size={16} className={includePlumbing ? "text-teal-400" : "text-slate-600"} />
                </button>

                <button
                  onClick={() => setIncludeSanitary(!includeSanitary)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    includeSanitary
                      ? "bg-gold/20 border-gold-light text-white"
                      : "bg-white/[0.03] border-white/10 text-slate-500"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold">Sanitaryware</span>
                    <span className="text-[11px] text-slate-400 font-bold">Jaquar &amp; CERA</span>
                  </div>
                  <CheckCircle2 size={16} className={includeSanitary ? "text-gold-light" : "text-slate-600"} />
                </button>

              </div>
            </div>

          </div>

          {/* Right: Output & Action Box (5 cols) */}
          <div className="lg:col-span-5 bg-white/[0.04] border border-white/15 rounded-3xl p-6 flex flex-col justify-between gap-6 backdrop-blur-md">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Estimated Factory Direct Wholesale Supply
              </span>
              
              <div className="mt-2 flex items-baseline gap-2">
                {hasCategorySelected ? (
                  <span className="text-3xl sm:text-4xl font-bold text-gold-light tracking-tight">
                    ₹{formattedMin} - ₹{formattedMax}
                  </span>
                ) : (
                  <span className="text-xl sm:text-2xl font-semibold text-amber-300">
                    Select a category above
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                *Includes genuine brand guarantee &amp; free site dispatch in Shoranur / Kulappully.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {hasCategorySelected ? (
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <MessageSquare size={16} className="fill-current" />
                  <span>Send Estimate on WhatsApp</span>
                  <ArrowRight size={14} />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full bg-white/5 border border-white/10 text-slate-500 font-semibold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <MessageSquare size={16} />
                  <span>Select at least 1 category</span>
                </button>
              )}

              <p className="text-[11px] text-center text-slate-500 font-bold">
                Direct WhatsApp assistance from Goodwill Store Manager
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
