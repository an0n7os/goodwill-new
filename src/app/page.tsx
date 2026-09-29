import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhyChooseGoodwill from "@/components/storefront/WhyChooseGoodwill";
import BrandShowcase from "@/components/brands/BrandShowcase";
import ShowroomHotspots from "@/components/storefront/ShowroomHotspots";
import ProductCard from "@/components/storefront/ProductCard";
import { getProducts } from "@/lib/actions";
import {
  ShieldCheck,
  Truck,
  MessageSquare,
  PhoneCall,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  Zap,
  Droplets,
  Bath,
  Sparkles,
  Clock,
  BadgePercent,
} from "lucide-react";

export const revalidate = 0; // Fresh DB fetches

export default async function StorefrontHome() {
  const featuredProducts = await getProducts({ inStock: true });

  const staticCategories = [
    {
      name: "Electrical",
      slug: "electrical",
      desc: "Switches, wires, LED, fans, MCB & accessories",
      icon: Zap,
      count: "250+",
      tint: "from-amber-100/80",
    },
    {
      name: "Plumbing",
      slug: "plumbing",
      desc: "CPVC & UPVC pipes, drainage, fittings, valves",
      icon: Droplets,
      count: "150+",
      tint: "from-sky-100/80",
    },
    {
      name: "Sanitary Ware",
      slug: "sanitary-ware",
      desc: "Water closets, wash basins, seat covers",
      icon: Sparkles,
      count: "120+",
      tint: "from-emerald-100/80",
    },
    {
      name: "Bath Fittings",
      slug: "bath-fittings",
      desc: "Mixers, showers, health faucets, angle valves",
      icon: Bath,
      count: "80+",
      tint: "from-rose-100/80",
    },
  ];

  const trustPoints = [
    { icon: BadgePercent, title: "Direct wholesale rates", desc: "Zero middlemen markup" },
    { icon: ShieldCheck, title: "Factory-sealed genuine", desc: "Full brand warranty" },
    { icon: Sparkles, title: "Authorised outlet", desc: "Legrand, Jaquar, Supreme" },
    { icon: Truck, title: "Free site delivery", desc: "Shoranur & Kulappully" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />

      {/* ───────── Hero ───────── */}
      <section className="relative w-full overflow-hidden hero-backdrop noise text-white">
        <div className="absolute inset-0 hero-grid pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-14 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 flex flex-col gap-7 animate-fade-in">
              <span className="eyebrow eyebrow-light">Authorised Partner Outlet · Est. Kulappully</span>

              <h1 className="text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.75rem] font-semibold tracking-[-0.035em]">
                Premium hardware,
                <br />
                <span className="font-display italic text-gold-gradient text-[1.12em] leading-none">
                  wholesale price.
                </span>
              </h1>

              <p className="text-slate-300/90 text-base md:text-lg leading-relaxed max-w-xl">
                Genuine electrical, plumbing and sanitary systems — sourced straight from the
                factory and delivered to construction sites across Shoranur, Kulappully and beyond.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-1">
                <Link href="/products" className="btn-gold">
                  Browse the catalogue
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="https://wa.me/919744164444"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline-light"
                >
                  <MessageSquare size={16} className="text-emerald-400" />
                  Get a WhatsApp quote
                </a>
              </div>

              <dl className="grid grid-cols-3 max-w-lg mt-6 pt-7 border-t border-white/10">
                {[
                  ["100%", "Genuine brands"],
                  ["0%", "Middlemen cuts"],
                  ["Same day", "Site dispatch"],
                ].map(([value, label], i) => (
                  <div key={label} className={i > 0 ? "pl-6 border-l border-white/10" : ""}>
                    <dt className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-white whitespace-nowrap">{value}</dt>
                    <dd className="text-xs text-slate-400 mt-1.5">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-amber-500/10 via-transparent to-blue-500/10 blur-2xl rounded-[3rem] pointer-events-none" />
              <div className="relative aspect-[4/5] sm:aspect-square rounded-[2rem] p-2 bg-white/[0.04] border border-white/10 shadow-2xl shadow-black/40">
                <div className="relative w-full h-full rounded-[1.6rem] overflow-hidden">
                  <ShowroomHotspots />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="relative z-10 border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4">
            {trustPoints.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className={`flex items-center gap-4 py-6 ${i % 2 === 1 ? "pl-5 lg:pl-8 border-l border-white/[0.08]" : ""} ${i === 2 ? "lg:pl-8 lg:border-l border-white/[0.08]" : ""} ${i >= 2 ? "border-t lg:border-t-0 border-white/[0.08]" : ""}`}
              >
                <div className="w-10 h-10 rounded-full border border-amber-300/25 bg-amber-300/[0.06] text-amber-200 flex items-center justify-center flex-shrink-0">
                  <Icon size={17} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Categories ───────── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12 reveal">
            <div className="max-w-xl">
              <span className="eyebrow">Shop by category</span>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-ink mt-4">
                Everything your build needs,{" "}
                <span className="font-display italic text-gold-dark">under one roof.</span>
              </h2>
            </div>
            <Link href="/products" className="link-arrow w-fit">
              View full catalogue <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {staticCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group card-lux relative overflow-hidden p-7 flex flex-col justify-between min-h-[260px] reveal"
                >
                  <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${cat.tint} to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-ink/10 shadow-sm text-ink flex items-center justify-center group-hover:bg-ink group-hover:text-gold-light transition-colors duration-500">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{cat.count} items</span>
                  </div>

                  <div className="relative mt-10">
                    <h3 className="text-xl font-semibold tracking-tight text-ink">{cat.name}</h3>
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{cat.desc}</p>
                    <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-ink">
                      Explore
                      <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── Featured products ───────── */}
      <section className="pb-20 md:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12 reveal">
            <div className="max-w-xl">
              <span className="eyebrow">Featured</span>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-ink mt-4">
                Hand-picked for{" "}
                <span className="font-display italic text-gold-dark">your project.</span>
              </h2>
            </div>
            <Link href="/products" className="link-arrow w-fit">
              Explore all products <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.slice(0, 8).map((prod) => (
              <ProductCard key={prod.id} product={prod} className="reveal" />
            ))}
          </div>
        </div>
      </section>

      <WhyChooseGoodwill />

      <BrandShowcase />

      {/* ───────── Showroom ───────── */}
      <section className="relative w-full overflow-hidden hero-backdrop noise text-white">
        <div className="absolute inset-0 hero-grid pointer-events-none opacity-60" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-8 reveal">
            <div>
              <span className="eyebrow eyebrow-light">Visit our showroom</span>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] mt-4 leading-[1.05]">
                See it, touch it,{" "}
                <span className="font-display italic text-gold-gradient">before you buy.</span>
              </h2>
              <p className="text-slate-400 mt-4 max-w-md leading-relaxed">
                Walk through live displays of switches, fittings and sanitaryware at Goodwill
                Electrical World, opposite Kulappully Bus Stand.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-px bg-white/[0.08] rounded-2xl overflow-hidden border border-white/[0.08]">
              <div className="bg-ink/80 p-6">
                <MapPin size={18} className="text-gold-light" strokeWidth={1.75} />
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mt-4">Address</div>
                <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                  Palakkad–Ponnani Highway, Opp. Kulappully Bus Stand, Kerala 679122
                </p>
              </div>
              <div className="bg-ink/80 p-6">
                <PhoneCall size={18} className="text-gold-light" strokeWidth={1.75} />
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mt-4">Helpline</div>
                <div className="flex flex-col mt-2 text-sm">
                  <a href="tel:+919744164444" className="text-white font-medium hover:text-gold-light transition-colors">97441 64444</a>
                  <a href="tel:+919544554555" className="text-white font-medium hover:text-gold-light transition-colors">95445 54555</a>
                  <a href="tel:+919961898888" className="text-white font-medium hover:text-gold-light transition-colors">99618 98888</a>
                </div>
              </div>
              <div className="bg-ink/80 p-6 sm:col-span-2 flex items-center gap-4">
                <Clock size={18} className="text-gold-light flex-shrink-0" strokeWidth={1.75} />
                <div className="text-sm text-slate-300">
                  <span className="text-white font-medium">Mon – Sat</span> 8:00 AM – 8:00 PM
                  <span className="text-slate-600 mx-2">·</span>
                  <span className="text-slate-500">Sunday closed</span>
                </div>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=Goodwill+Electrical+World+Kulappully"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold w-fit"
            >
              <MapPin size={16} />
              Get directions
            </a>
          </div>

          <div className="relative w-full min-h-[380px] lg:min-h-[520px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50 reveal">
            <iframe
              title="Goodwill Electrical World Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3917.4388832269225!2d76.2731853!3d10.9298284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU1JzQ3LjQiTiA3NsKwMTYnMzUuNSJFOg!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              className="w-full h-full border-0 absolute inset-0 grayscale-[35%] contrast-[1.05]"
              allowFullScreen
              loading="lazy"
            ></iframe>
            <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2.5 bg-ink/90 backdrop-blur-md border border-white/15 pl-3 pr-4 py-2.5 rounded-full shadow-xl">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-medium text-white">Kulappully Bus Stand Junction</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
