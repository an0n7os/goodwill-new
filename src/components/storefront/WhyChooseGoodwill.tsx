import React from "react";
import {
  Factory,
  Truck,
  FileCheck2,
  BadgePercent,
  Check,
  X,
  MessageSquare,
} from "lucide-react";

export default function WhyChooseGoodwill() {
  const pillars = [
    {
      icon: Factory,
      title: "Direct factory sourcing",
      badge: "0% middlemen markup",
      description:
        "Sourced straight from authorised plants of Finolex, Legrand, Jaquar, Supreme & CERA. Guaranteed original with manufacturer seal.",
      perks: ["Authorised brand outlet", "Full brand warranty", "No counterfeit risk"],
    },
    {
      icon: Truck,
      title: "Free on-site dispatch",
      badge: "Same-day delivery",
      description:
        "Free logistics to your construction site across Shoranur, Kulappully, Cheruthuruthy, Ottapalam & Pattambi.",
      perks: ["Direct site transport", "Zero breakage risk", "Flexible unloading"],
    },
    {
      icon: FileCheck2,
      title: "100% GST billing",
      badge: "Input tax credit",
      description:
        "Full tax invoice compliance for maximum savings and ITC benefits for contractors, engineers and house owners.",
      perks: ["Instant GST invoice", "ITC eligible purchases", "Audit-ready billing"],
    },
    {
      icon: BadgePercent,
      title: "Wholesale & bulk rates",
      badge: "Contractor pricing",
      description:
        "Special project pricing for house builds, electrician lists and plumbing blueprints — with credit terms.",
      perks: ["Volume rate pricing", "WhatsApp BOQ quote", "Credit support"],
    },
  ];

  const comparisons = [
    { feature: "Product authenticity", regular: "Risk of local duplicates", goodwill: "100% factory-sourced original" },
    { feature: "Pricing", regular: "High retail markup", goodwill: "Wholesale factory price" },
    { feature: "Site logistics", regular: "Extra transport charge & delays", goodwill: "Free direct site dispatch" },
    { feature: "Tax invoicing", regular: "Estimate slips", goodwill: "Full GST invoice with ITC" },
    { feature: "Warranty", regular: "Shop warranty only", goodwill: "Official manufacturer warranty" },
  ];

  return (
    <section className="bg-white py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-y border-ink/[0.06] text-ink">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 mb-14 reveal">
          <div className="lg:col-span-7">
            <span className="eyebrow">The Goodwill advantage</span>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] mt-4 leading-[1.08]">
              Why contractors & builders{" "}
              <span className="font-display italic text-gold-dark">choose Goodwill.</span>
            </h2>
          </div>
          <p className="lg:col-span-5 lg:pt-12 text-slate-500 leading-relaxed">
            We remove middleman margins to deliver genuine electrical, plumbing and sanitary
            systems straight from the factory to your building site.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/[0.07] rounded-3xl overflow-hidden border border-ink/[0.07] mb-16">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="group bg-white p-7 md:p-8 flex flex-col hover:bg-paper transition-colors duration-500 reveal">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 tabular-nums">0{idx + 1}</span>
                  <div className="w-11 h-11 rounded-full border border-ink/10 flex items-center justify-center text-ink group-hover:bg-ink group-hover:text-gold-light group-hover:border-ink transition-colors duration-500">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                </div>

                <h3 className="text-lg font-semibold tracking-tight mt-10">{item.title}</h3>
                <span className="text-xs font-medium text-gold-dark mt-1">{item.badge}</span>
                <p className="text-sm text-slate-500 leading-relaxed mt-4">{item.description}</p>

                <ul className="mt-6 pt-5 border-t border-ink/[0.06] flex flex-col gap-2.5">
                  {item.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2.5 text-[13px] text-slate-700">
                      <Check size={14} className="text-gold-dark flex-shrink-0" strokeWidth={2.5} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Comparison */}
        <div className="rounded-3xl bg-ink text-white p-6 sm:p-10 md:p-12 relative overflow-hidden noise reveal">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold-light/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="eyebrow eyebrow-light">Transparent standards</span>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mt-3">
                Goodwill vs. a regular retail shop
              </h3>
            </div>
            <a
              href="https://wa.me/919744164444"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold w-fit"
            >
              <MessageSquare size={16} />
              Get a WhatsApp price quote
            </a>
          </div>

          <div className="relative overflow-x-auto -mx-2">
            <table className="w-full text-left text-sm min-w-[560px]">
              <thead>
                <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="py-4 px-2 font-medium">Benefit</th>
                  <th className="py-4 px-4 font-medium">Regular retail</th>
                  <th className="py-4 px-4 font-medium text-gold-light">Goodwill Electrical World</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row) => (
                  <tr key={row.feature} className="border-t border-white/[0.08]">
                    <td className="py-5 px-2 font-medium text-white">{row.feature}</td>
                    <td className="py-5 px-4 text-slate-500">
                      <span className="inline-flex items-center gap-2.5">
                        <X size={14} className="text-slate-600 flex-shrink-0" />
                        {row.regular}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-white">
                      <span className="inline-flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-gold-light" strokeWidth={3} />
                        </span>
                        {row.goodwill}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
