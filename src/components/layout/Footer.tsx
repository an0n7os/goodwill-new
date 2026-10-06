import React from "react";
import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";
import { MapPin, Phone, Clock, MessageSquare } from "lucide-react";

const shopLinks = [
  { href: "/products?category=electrical", label: "Electrical" },
  { href: "/products?category=plumbing", label: "Plumbing" },
  { href: "/products?category=sanitary-ware", label: "Sanitary Ware" },
  { href: "/products?category=bath-fittings", label: "Bath Fittings" },
  { href: "/products", label: "All Products" },
];

const helpLinks = [
  { href: "/track-order", label: "Track Order" },
  { href: "/bulk-enquiry", label: "Bulk Quote" },
  { href: "/delivery-policy", label: "Delivery" },
  { href: "/refund-policy", label: "Returns & Refunds" },
  { href: "/warranty", label: "Warranty" },
];

const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy-policy", label: "Privacy" },
];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-medium text-gold-light uppercase tracking-[0.2em] mb-4">{title}</h3>
      <ul className="flex flex-col gap-2.5 text-sm text-slate-400">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-ink text-slate-300 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-10 pb-10">
          {/* Brand + visit */}
          <div className="col-span-2 md:col-span-5 flex flex-col gap-5">
            <Link href="/" aria-label="Goodwill Electrical World — home" className="w-fit">
              <BrandLogo tone="light" size="md" />
            </Link>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-gold-light flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <a
                  href="https://maps.google.com/?q=Goodwill+Electrical+World+Kulappully"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Opp. Kulappully Bus Stand, Shoranur, Palakkad 679122
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={15} className="text-gold-light flex-shrink-0" strokeWidth={1.75} />
                <span>
                  Mon – Sat · 8 AM – 8 PM <span className="text-slate-500">· Sunday closed</span>
                </span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <LinkColumn title="Shop" links={shopLinks} />
          </div>
          <div className="md:col-span-2">
            <LinkColumn title="Help" links={helpLinks} />
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-3">
            <h3 className="text-[11px] font-medium text-gold-light uppercase tracking-[0.2em] mb-4">Contact</h3>
            <div className="flex flex-col gap-2.5 text-sm text-slate-400">
              <a href="tel:+919744164444" className="flex items-center gap-3 hover:text-white transition-colors">
                <Phone size={15} className="text-gold-light" strokeWidth={1.75} />
                97441 64444
              </a>
              <a href="tel:+919544554555" className="pl-[27px] hover:text-white transition-colors">
                95445 54555
              </a>
              <a
                href="https://wa.me/919744164444"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white hover:border-gold/50 hover:text-gold-light transition-colors"
              >
                <MessageSquare size={14} />
                WhatsApp us
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.08] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Goodwill Electrical World</p>
          <nav aria-label="Legal" className="flex items-center gap-5">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
            <Link href="/admin" className="text-slate-600 hover:text-white transition-colors">
              Staff Login
            </Link>
            <span className="text-slate-600">Designed by BrandLift Online</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
