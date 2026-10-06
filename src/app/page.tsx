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
  MessageCircle,
  Store,
} from "lucide-react";

export const revalidate = 0; // Fresh DB fetches

// Showroom hours: Mon–Sat, 8 AM–8 PM IST
function isShopOpen(now = new Date()) {
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = ist.getHours();
  return ist.getDay() !== 0 && hour >= 8 && hour < 20;
}

export default async function StorefrontHome() {
  const shopOpen = isShopOpen();
  const catalogue = await getProducts({});
  // Products starred in admin come first, then the newest in-stock items
  const inStock = catalogue.filter((product) => product.stock > 0);
  const featuredProducts = [...inStock.filter((p) => p.isFeatured), ...inStock.filter((p) => !p.isFeatured)];

  const staticCategories = [
    {
      name: "Electrical",
      slug: "electrical",
      desc: "Switches, wires, LED, fans, MCB & accessories",
      icon: Zap,

      tint: "from-amber-100/80",
    },
    {
      name: "Plumbing",
      slug: "plumbing",
      desc: "CPVC & UPVC pipes, drainage, fittings, valves",
      icon: Droplets,

      tint: "from-sky-100/80",
    },
    {
      name: "Sanitary Ware",
      slug: "sanitary-ware",
      desc: "Water closets, wash basins, seat covers",
      icon: Sparkles,

      tint: "from-emerald-100/80",
    },
    {
      name: "Bath Fittings",
      slug: "bath-fittings",
      desc: "Mixers, showers, health faucets, angle valves",
      icon: Bath,

      tint: "from-rose-100/80",
    },
  ];

  const trustPoints = [
    { icon: BadgePercent, title: "Direct wholesale rates", desc: "Zero middlemen markup" },
    { icon: ShieldCheck, title: "Factory-sealed genuine", desc: "Full brand warranty" },
    { icon: Sparkles, title: "Authorised outlet", desc: "Legrand, Jaquar, Supreme" },
    { icon: Truck, title: "Free local delivery ₹1,000+", desc: "₹80 below ₹1,000 · Local area" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />

      {/* ───────── Hero ───────── */}
      <section className="relative w-full overflow-hidden hero-backdrop noise text-white">
        <div className="absolute inset-0 hero-grid pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-12 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6 animate-fade-in">
              <span className="eyebrow eyebrow-light">Authorised Partner Outlet · Est. Kulappully</span>

              <h1 className="text-[2.75rem] leading-[1.02] sm:text-[3.5rem] lg:text-[4.25rem] font-semibold tracking-[-0.035em]">
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
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8 md:mb-10 reveal">
            <div className="max-w-xl">
              <span className="eyebrow">Shop by category</span>
              <h2 className="text-3xl md:text-[2.75rem] md:leading-[1.08] font-semibold tracking-[-0.03em] text-ink mt-4">
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
                    <span className="text-xs font-medium text-slate-500">{catalogue.filter((product) => product.category?.slug === cat.slug || product.category?.parent?.slug === cat.slug).length} online items</span>
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
      <section className="pb-14 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8 md:mb-10 reveal">
            <div className="max-w-xl">
              <span className="eyebrow">Featured</span>
              <h2 className="text-3xl md:text-[2.75rem] md:leading-[1.08] font-semibold tracking-[-0.03em] text-ink mt-4">
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-center reveal">
            <span className="eyebrow eyebrow-light">Visit our showroom</span>
            <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-[-0.03em] mt-4 leading-[1.05]">
              See it, touch it,{" "}
              <span className="font-display italic text-gold-gradient">before you buy.</span>
            </h2>
            <p className="text-slate-400 mt-4 max-w-md leading-relaxed">
              Live displays of switches, lights, fittings and sanitaryware — with staff who help you pick the right part.
            </p>

            <ul className="mt-8 flex flex-col divide-y divide-white/[0.07] border-y border-white/[0.07]">
              <li>
                <a
                  href="https://maps.google.com/?q=Goodwill+Electrical+World+Kulappully"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 py-4"
                >
                  <span className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={17} className="text-gold-light" strokeWidth={1.75} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-white font-medium">Opp. Kulappully Bus Stand</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Palakkad–Ponnani Highway, Shoranur 679122</span>
                  </span>
                  <ArrowRight size={16} className="text-slate-600 group-hover:text-gold-light group-hover:translate-x-0.5 transition-all" />
                </a>
              </li>
              <li>
                <a href="tel:+919744164444" className="group flex items-center gap-4 py-4">
                  <span className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
                    <PhoneCall size={17} className="text-gold-light" strokeWidth={1.75} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-white font-medium">97441 64444</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Also 95445 54555 · 99618 98888</span>
                  </span>
                  <ArrowRight size={16} className="text-slate-600 group-hover:text-gold-light group-hover:translate-x-0.5 transition-all" />
                </a>
              </li>
              <li className="flex items-center gap-4 py-4">
                <span className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={17} className="text-gold-light" strokeWidth={1.75} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-white font-medium">Mon – Sat · 8:00 AM – 8:00 PM</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Sunday closed</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
                    shopOpen ? "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" : "text-slate-400 border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${shopOpen ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  {shopOpen ? "Open now" : "Closed now"}
                </span>
              </li>
            </ul>

            <div className="flex flex-wrap gap-3 mt-8">
              <a
                href="https://maps.google.com/?q=Goodwill+Electrical+World+Kulappully"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
              >
                <MapPin size={16} />
                Get directions
              </a>
              <a href="https://wa.me/919744164444" target="_blank" rel="noopener noreferrer" className="btn-outline-light">
                <MessageCircle size={16} />
                WhatsApp us
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 relative w-full min-h-[340px] lg:min-h-0 rounded-[1.75rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/50 reveal">
            <iframe
              title="Goodwill Electrical World location map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3917.4388832269225!2d76.2731853!3d10.9298284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU1JzQ3LjQiTiA3NsKwMTYnMzUuNSJFOg!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              className="w-full h-full border-0 absolute inset-0 grayscale-[35%] contrast-[1.05]"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            {/* Shop card pinned over the map */}
            <div className="absolute left-4 right-4 bottom-4 sm:right-auto z-20 flex items-center gap-3 bg-ink/90 backdrop-blur-md border border-white/15 rounded-2xl p-3 pr-4 shadow-xl">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-b from-gold-light to-gold flex items-center justify-center flex-shrink-0">
                <Store size={18} className="text-ink" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">Goodwill Electrical World</div>
                <div className="text-xs text-slate-400">Opp. Kulappully Bus Stand</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
