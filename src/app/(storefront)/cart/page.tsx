"use client";

import { useHydrated } from "@/lib/useHydrated";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { useCartStore } from "@/store/cart";
import { useLanguageStore } from "@/store/language";
import { validateCoupon } from "@/lib/actions";
import { computeTotals, FREE_DELIVERY_THRESHOLD, formatINR } from "@/lib/pricing";
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Ticket } from "lucide-react";

export default function CartPage() {
  const { t } = useLanguageStore();
  const { items, removeItem, updateQuantity, coupon, setCoupon } = useCartStore();

  const mounted = useHydrated();
  const [couponInput, setCouponInput] = useState(coupon?.code ?? "");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);

  // Prevent hydration mismatch


  // Calculations (shared with checkout and the server-side order total)
  const { subtotal, deliveryCharge, discount, gstAmount, total } = useMemo(
    () => computeTotals({ lines: items, coupon }),
    [items, coupon]
  );

  // Free delivery nudge amount
  const nudgeAmount = Math.max(0, Math.ceil(FREE_DELIVERY_THRESHOLD - subtotal));

  // Apply Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess(false);

    if (!couponInput.trim()) return;

    const res = await validateCoupon(couponInput.trim().toUpperCase(), subtotal);
    if (res.valid && res.coupon) {
      setCoupon({
        code: res.coupon.code,
        type: res.coupon.type,
        value: res.coupon.value,
        maxDiscount: res.coupon.maxDiscount,
      });
      setCouponSuccess(true);
    } else {
      setCouponError(res.error || "Failed to apply coupon.");
      setCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponSuccess(false);
    setCouponError("");
  };

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
              {/* Free delivery progress */}
              <div className="card-lux !transform-none px-6 py-5">
                {deliveryCharge > 0 && nudgeAmount > 0 ? (
                  <p className="text-sm text-slate-600">
                    {t(
                      `Add ₹${formatINR(nudgeAmount)} more for free local delivery.`,
                      `സൗജന്യ ഡെലിവറി ലഭിക്കാൻ ₹${formatINR(nudgeAmount)} രൂപക്ക് കൂടി ഓർഡർ ചെയ്യുക!`
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-emerald-700 font-medium">
                    {t("Your order qualifies for free local delivery.", "നിങ്ങൾക്ക് സൗജന്യ ലോക്കൽ ഡെലിവറി ലഭിക്കുന്നതാണ്!")}
                  </p>
                )}
                <div className="h-1.5 rounded-full bg-ink/[0.06] mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-[width] duration-700"
                    style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>

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
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            <span className="font-semibold text-sm text-ink w-8 text-center">{item.quantity}</span>
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
                    <dd className="text-ink">{deliveryCharge === 0 ? "Free" : `₹${formatINR(deliveryCharge)}`}</dd>
                  </div>
                  <div className="flex justify-between text-xs">
                    <dt>GST included</dt>
                    <dd>₹{formatINR(gstAmount)}</dd>
                  </div>
                </dl>

                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-ink">Total</span>
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

              {/* Promo code */}
              <div className="card-lux !transform-none p-6 flex flex-col gap-3">
                <h3 className="font-medium text-ink text-sm flex items-center gap-2">
                  <Ticket size={15} className="text-gold-dark" />
                  Have a promo code?
                </h3>

                {coupon ? (
                  <div className="bg-paper border border-gold/30 rounded-2xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-semibold text-ink tracking-wide">{coupon.code}</div>
                      <div className="text-xs text-gold-dark mt-0.5">
                        {coupon.type === "percentage"
                          ? `${coupon.value}% off subtotal`
                          : coupon.type === "free_delivery"
                          ? "Free delivery"
                          : `₹${formatINR(coupon.value)} off`}
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-xs font-medium text-slate-500 hover:text-red-600">
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="relative">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter code"
                      className="w-full h-11 pl-5 pr-24 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-5 rounded-full bg-ink hover:bg-ink-2 text-white text-xs font-semibold transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponError && <p className="text-xs text-red-600">{couponError}</p>}
                {couponSuccess && <p className="text-xs text-emerald-700">Code applied.</p>}
              </div>
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
