"use client";

import React, { useState } from "react";
import Link from "next/link";
import {useRouter} from 'next/navigation';
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatINR, isPriceOnRequest } from "@/lib/pricing";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600";

interface ProductCardProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  sku: string;
  unit: string;
  gstRate?:number;
  variants?:{id:string;stock:number}[];
  brand?: { name: string } | null;
  images?: { url: string }[];
}

// One product card for the whole storefront (home, catalogue, related products)
export default function ProductCard({
  product,
  showAddToCart = false,
  className = "",
}: {
  product: ProductCardProduct;
  showAddToCart?: boolean;
  className?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const router=useRouter();
  const needsOption=!!product.variants?.length;
  const [added, setAdded] = useState(false);

  const image = product.images?.[0]?.url || FALLBACK_IMAGE;
  const thumbnail = image.startsWith('/products/lisha-generated/') && image.endsWith('.webp')
    ? image.replace('/lisha-generated/', '/lisha-thumbnails/') : image;
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const inStock = product.stock > 0;
  const onRequest = isPriceOnRequest(product.price);

  const addToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image,
      quantity: 1,
      sku: product.sku,
      unit: product.unit,
      stock: product.stock,
      gstRate:product.gstRate,
    });
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(needsOption){router.push(`/product/${product.slug}`);return;}
    addToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={`group relative card-lux overflow-hidden flex flex-col ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(event) => { if (event.currentTarget.getAttribute('src') !== image) event.currentTarget.src = image; }}
          className={`w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.06] ${image.includes('/lisha-generated/') ? 'object-contain bg-white p-3' : 'object-cover'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-ink text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            −{discount}%
          </span>
        )}
        {!inStock && (
          <span className="absolute top-3 right-3 bg-ink/85 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
            Out of stock
          </span>
        )}
        {!showAddToCart && (
          <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white text-ink flex items-center justify-center shadow-md translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <ArrowUpRight size={16} />
          </span>
        )}
      </div>

      <div className="p-4 md:p-5 flex flex-col flex-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark">{product.brand?.name}</span>
        <h3 className="text-sm md:text-[15px] font-medium text-ink mt-1.5 line-clamp-2 leading-snug min-h-[2.6em]">
          {/* Stretched link: the whole card is clickable without nesting the add button inside <a> */}
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0 after:z-[1] focus:outline-none">
            {product.name}
          </Link>
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3 mt-auto pt-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            {onRequest ? (
              <span className="text-sm font-medium text-gold-dark">Price on request</span>
            ) : (
              <span className="text-lg font-semibold text-ink">₹{formatINR(product.price)}</span>
            )}
            {discount > 0 && <span className="text-xs text-slate-400 line-through">₹{formatINR(product.mrp)}</span>}
          </div>

          {inStock && !onRequest && (
            <div className="relative z-[2] flex items-center gap-2">
              <Link
                href={needsOption?`/product/${product.slug}`:"/checkout"}
                onClick={(event) => { event.stopPropagation(); if(!needsOption)addToCart(); }}
                aria-label={`Buy ${product.name} now`}
                className="inline-flex h-9 items-center justify-center whitespace-nowrap px-4 rounded-full border border-gold/35 bg-gold/10 text-gold-dark text-xs font-semibold hover:bg-gold/20 focus-visible:outline-ink transition-colors"
              >
                {needsOption?'Choose option':'Buy now'}
              </Link>
              {showAddToCart && (
            <button
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
              className={`relative z-[2] flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                added ? "bg-emerald-600 text-white" : "bg-ink text-white hover:bg-gold hover:text-ink"
              }`}
            >
              {added ? <Check size={16} /> : <Plus size={16} />}
            </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
