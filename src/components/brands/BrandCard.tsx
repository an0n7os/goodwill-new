"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

export interface BrandCardProps {
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    tagline: string | null;
    inStockCount: number;
  };
}

export default function BrandCard({ brand }: BrandCardProps) {
  const [imageError, setImageError] = useState(false);

  const isInStock = brand.inStockCount > 0;
  const logoPath = brand.logo || `/brands/${brand.slug}.svg`;

  return (
    <Link
      href={`/products?brand=${brand.slug}`}
      className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:border-[#d4a017] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d4a017] focus:ring-offset-2"
    >
      <div>
        {/* 1. Top Row: Status Dot (left) + Status Label (right) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isInStock ? "bg-emerald-500" : "bg-slate-300"
              }`}
              aria-hidden="true"
            />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {isInStock ? "IN STOCK" : "AUTHORISED DEALER"}
          </span>
        </div>

        {/* 2. Logo Area — fixed height 56px (h-14), left aligned, vertically centered */}
        <div className="h-14 flex items-center justify-start my-2">
          {!imageError && logoPath ? (
            <Image
              src={logoPath}
              alt={`${brand.name} logo`}
              width={140}
              height={48}
              className="h-10 w-auto object-contain transition-all duration-300 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="font-bold text-xl tracking-tight text-[#070f1a] uppercase">
              {brand.name}
            </span>
          )}
        </div>

        {/* 3. Tagline */}
        <p className="text-sm text-slate-500 font-medium mb-4 mt-1 line-clamp-1">
          {brand.tagline || "Authorised Manufacturer Partner"}
        </p>
      </div>

      {/* 4. Divider & 5. Footer Link */}
      <div>
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs font-semibold text-gold-dark tracking-wide">
          <span>BROWSE CATALOG</span>
          <ChevronRight
            size={16}
            className="transform group-hover:translate-x-1 transition-transform duration-300"
          />
        </div>
      </div>
    </Link>
  );
}
