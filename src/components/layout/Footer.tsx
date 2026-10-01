import React from "react";
import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";
import { MapPin, Phone, Mail, Clock, ShieldCheck, FileCheck2, Truck, MessageSquare, ArrowUpRight } from "lucide-react";

const shopLinks = [
  { href: "/products?category=electrical", label: "Electrical & Lighting" },
  { href: "/products?category=plumbing", label: "Pipes & Plumbing" },
  { href: "/products?category=sanitary-ware", label: "Sanitary Ware" },
  { href: "/products?category=bath-fittings", label: "Bath Fittings & Taps" },
  { href: "/products?discount=true", label: "Offers" },
  { href: "/products", label: "All Products" },
];

const helpLinks = [
  { href: "/track-order", label: "Track Your Order" },
  { href: "/bulk-enquiry", label: "Contractor & Bulk Quote" },
  { href: "/delivery-policy", label: "Delivery Policy" },
  { href: "/refund-policy", label: "Returns & Refunds" },
  { href: "/warranty", label: "Warranty Support" },
];

const legalLinks = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/delivery-policy", label: "Delivery Policy" },
];

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-gold-light uppercase tracking-[0.2em] mb-5">{children}</h3>;
}

export default function Footer() {
  return (
    <footer className="w-full bg-ink text-slate-300 pt-20 pb-10 mt-auto relative overflow-hidden noise">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-64 rounded-full bg-amber-400/[0.06] blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CTA strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-12 mb-12 border-b border-white/[0.08]">
          <div>
            <p className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-white">
              Planning a build?{" "}
              <span className="font-display italic text-gold-gradient">Get a project quote.</span>
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Send your material list — we reply with wholesale pricing, usually the same day.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="https://wa.me/919744164444" target="_blank" rel="noopener noreferrer" className="btn-gold">
              <MessageSquare size={16} />
              WhatsApp us
            </a>
            <Link href="/bulk-enquiry" className="btn-outline-light">
              Request a BOQ quote
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12 mb-14">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4 flex flex-col">
            <Link href="/" aria-label="Goodwill Electrical World — home" className="w-fit mb-6">
              <BrandLogo tone="light" size="lg" />
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Authorised showroom for electrical, plumbing, sanitary ware and bath fittings in Kulappully, Shoranur.
              Genuine brands, direct pricing and free site delivery nearby.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3 mt-6 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-gold-light" strokeWidth={1.75} />
                Genuine brands
              </li>
              <li className="flex items-center gap-2">
                <FileCheck2 size={15} className="text-gold-light" strokeWidth={1.75} />
                GST invoice
              </li>
              <li className="flex items-center gap-2">
                <Truck size={15} className="text-gold-light" strokeWidth={1.75} />
                Local delivery
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div className="lg:col-span-2">
            <ColumnTitle>Shop</ColumnTitle>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              {shopLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="lg:col-span-2">
            <ColumnTitle>Help</ColumnTitle>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              {helpLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit & contact */}
          <div className="col-span-2 lg:col-span-4">
            <ColumnTitle>Visit &amp; Contact</ColumnTitle>
            <ul className="flex flex-col gap-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-gold-light flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <a
                  href="https://maps.google.com/?q=Goodwill+Electrical+World+Kulappully"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-relaxed hover:text-white transition-colors"
                >
                  Opp. Kulappully Bus Stand, Palakkad–Ponnani Highway, Kulappully, Shoranur, Palakkad, Kerala 679122
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-gold-light flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="flex flex-col gap-1">
                  <a href="tel:+919744164444" className="hover:text-white transition-colors">
                    97441 64444 <span className="text-slate-500">· WhatsApp</span>
                  </a>
                  <a href="tel:+919544554555" className="hover:text-white transition-colors">
                    95445 54555
                  </a>
                  <a href="tel:+919961898888" className="hover:text-white transition-colors">
                    99618 98888
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-gold-light flex-shrink-0" strokeWidth={1.75} />
                <a href="mailto:info@goodwillelectrical.com" className="hover:text-white transition-colors">
                  info@goodwillelectrical.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="text-gold-light flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <span className="text-slate-200">Mon – Sat</span> · 8:00 AM – 8:00 PM
                  <div className="text-slate-500">Sunday closed</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.08] pt-8 flex flex-col lg:flex-row justify-between items-center gap-5 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Goodwill Electrical World. All rights reserved.</p>

          <nav aria-label="Legal" className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-slate-400">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
            <Link href="/admin/login" className="text-slate-600 hover:text-white transition-colors">
              Staff Login
            </Link>
          </nav>

          <p className="text-slate-600">Designed by BrandLift Online</p>
        </div>
      </div>
    </footer>
  );
}
