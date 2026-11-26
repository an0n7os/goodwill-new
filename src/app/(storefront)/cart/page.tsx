"use client";

import { useHydrated } from "@/lib/useHydrated";
import React, { useMemo } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { useCartStore } from "@/store/cart";
import { useLanguageStore } from "@/store/language";
import { computeTotals, formatINR } from "@/lib/pricing";
import {minimumQuantity,fractionalUnit} from "@/lib/units";
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import AvailableCoupons from "@/components/storefront/AvailableCoupons";

export default function CartPage() {
  const { t } = useLanguageStore();
  const { items, removeItem, updateQuantity, coupon, setCoupon } = useCartStore();

  const mounted = useHydrated();

  // Prevent hydration mismatch


  // Calculations (shared with checkout and the server-side order total)
  const { subtotal, discount, gstAmount, total } = useMemo(
    () => computeTotals({ lines: items, coupon, deliveryType:"pickup" }),
    [items, coupon]
  );

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-paper">
        <Header />
        <div className="flex-grow flex items-center justify-center p-20">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-gold animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <PageHeader
        eyebrow="Your cart"
        title={t("Shopping cart", "ഷോപ്പിംഗ് കാർട്ട്")}
        breadcrumbs={[{ href: "/", label: "Home" }, { href: "/products", label: "Products" }, { label: "Cart" }]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-grow w-full">

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <p className="text-sm text-slate-500">Delivery availability and charges are calculated from your pincode at checkout.</p>

              {/* Items */}
              <div className="card-lux !transform-none overflow-hidden">
                <div className="divide-y divide-ink/[0.06]">
                  {items.map((item) => (
                    <div key={item.id} className="p-5 md:p-6 flex gap-4 md:gap-5 items-center">
                      <Link
                        href={`/product/${item.productId}`}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-paper border border-ink/[0.06] flex-shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </Link>

                      <div className="flex-grow min-w-0">
                        <Link
                          href={`/product/${item.productId}`}
                          className="block text-[15px] font-medium text-ink hover:text-gold-dark transition-colors line-clamp-2 leading-snug"
                        >
                          {item.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                          {item.variantName && (
                            <span className="bg-paper border border-ink/10 px-2 py-0.5 rounded-full">{item.variantName}</span>
                          )}
                          <span>
                            ₹{formatINR(item.price)} / {item.unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center border border-ink/10 rounded-full bg-white h-9 px-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= minimumQuantity(item.unit)}
                              aria-label="Decrease quantity"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            <input aria-label={`Quantity for ${item.name}`} className="font-semibold text-sm text-ink w-20 text-center" type="number" min={minimumQuantity(item.unit)} max={item.stock} step={fractionalUnit(item.unit)?"0.001":"1"} value={item.quantity} onChange={e=>updateQuantity(item.id,Number(e.target.value))} />
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              aria-label="Increase quantity"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                          {item.quantity >= item.stock && (
                            <span className="text-[11px] text-gold-dark">Max available</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 self-start md:self-center">
                        <div className="font-semibold text-ink text-base md:text-lg">₹{formatINR(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/products" className="link-arrow w-fit mt-2">
                <ArrowRight size={14} className="rotate-180" /> Continue shopping
              </Link>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-32">
              {/* Summary */}
              <div className="card-lux !transform-none p-6 md:p-7 flex flex-col gap-5">
                <h2 className="font-semibold text-ink text-lg tracking-tight">Order summary</h2>

                <dl className="flex flex-col gap-3 text-sm text-slate-500 pb-5 border-b border-ink/[0.06]">
                  <div className="flex justify-between">
                    <dt>Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)</dt>
                    <dd className="text-ink">₹{formatINR(subtotal)}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <dt>Discount</dt>
                      <dd>−₹{formatINR(discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>Delivery</dt>
                    <dd className="text-ink">At checkout</dd>
                  </div>
                  <div className="flex justify-between text-xs">
                    <dt>GST included</dt>
                    <dd>₹{formatINR(gstAmount)}</dd>
                  </div>
                </dl>

                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-ink">Items total</span>
                  <span className="text-3xl font-semibold text-ink tracking-tight leading-none">₹{formatINR(total)}</span>
                </div>

                <Link href="/checkout" className="btn-dark w-full !py-4 !text-sm">
                  Proceed to checkout
                  <ArrowRight size={15} />
                </Link>

                <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5 -mt-1">
                  <ShieldCheck size={14} className="text-gold-dark" />
                  Cash on delivery or pay at the showroom
                </p>
              </div>

              {/* Coupons & Special Offers */}
              <AvailableCoupons
                subtotal={subtotal}
                appliedCoupon={coupon}
                onApplyCoupon={(c) => setCoupon(c)}
                onRemoveCoupon={() => setCoupon(null)}
              />
            </div>
          </div>
        ) : (
          <div className="card-lux !transform-none flex flex-col items-center justify-center px-6 py-20 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-paper border border-ink/10 flex items-center justify-center text-gold-dark">
              <ShoppingBag size={26} strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl font-semibold text-ink mt-6">{t("Your cart is empty", "കാർട്ട് ശൂന്യമാണ്")}</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xs">
              Browse genuine switches, pipes, sanitaryware and fittings at wholesale prices.
            </p>
            <Link href="/products" className="btn-dark mt-8">
              Browse the catalogue <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
