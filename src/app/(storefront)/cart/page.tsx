"use client";

import React, { useState, useEffect, useMemo } from "react";
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

  const [mounted, setMounted] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (coupon) {
      setCouponInput(coupon.code);
    }
  }, [coupon]);

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Free delivery nudge */}
              {deliveryCharge > 0 && nudgeAmount > 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs font-semibold text-amber-800 flex items-center gap-2">
                  <span className="bg-gold text-white rounded-full w-2 h-2 animate-pulse"></span>
                  <span>
                    {t(
                      `Add ₹${nudgeAmount} more to your cart for FREE local delivery!`,
                      `സൗജന്യ ഡെലിവറി ലഭിക്കാൻ ₹${nudgeAmount} രൂപക്ക് കൂടി ഓർഡർ ചെയ്യുക!`
                    )}
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs font-semibold text-emerald-800">
                  🎉 {t("You qualify for FREE local delivery!", "നിങ്ങൾക്ക് സൗജന്യ ലോക്കൽ ഡെലിവറി ലഭിക്കുന്നതാണ്!")}
                </div>
              )}

              {/* Items Card List */}
              <div className="card-lux !transform-none overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 md:p-6 flex gap-4 items-center">
                      {/* Image */}
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Info & Quantity details */}
                      <div className="flex-grow min-w-0">
                        <Link
                          href={`/product/${item.productId}`}
                          className="block text-sm font-bold text-slate-800 hover:text-ink truncate"
                        >
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <span className="inline-block bg-slate-100 text-slate-600 font-bold text-[11px] px-2 py-0.5 rounded mt-1">
                            {item.variantName}
                          </span>
                        )}
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                          ₹{formatINR(item.price)} / {item.unit}
                        </div>

                        {/* Quantity controls in Mobile */}
                        <div className="flex md:hidden items-center gap-3 mt-3">
                          <div className="flex items-center border border-slate-200 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 rounded"
                            >
                              -
                            </button>
                            <span className="font-bold text-xs px-2">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 rounded"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Quantity controls (Desktop) */}
                      <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 rounded"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm px-3">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 rounded"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-lg border border-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right flex-shrink-0 font-semibold text-ink text-sm md:text-base pl-2">
                        ₹{formatINR(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Summary & Promo */}
            <div className="flex flex-col gap-6">
              {/* Promo Coupon Card */}
              <div className="card-lux !transform-none p-6 flex flex-col gap-4">
                <h3 className="font-semibold text-ink text-base tracking-tight flex items-center gap-1.5">
                  <Ticket size={16} className="text-gold-dark" />
                  <span>Promo Code</span>
                </h3>

                {coupon ? (
                  <div className="bg-paper border border-ink/10 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-ink uppercase tracking-[0.16em]">{coupon.code} Applied</div>
                      <div className="text-[11px] text-gold-dark font-semibold mt-0.5">
                        {coupon.type === "percentage" ? `${coupon.value}% off subtotal` : coupon.type === "free_delivery" ? "Free delivery" : `₹${coupon.value} flat discount`}
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. WELCOME10"
                      className="flex-1 px-3.5 py-2 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm uppercase font-bold"
                    />
                    <button
                      type="submit"
                      className="bg-ink hover:bg-ink-2 text-white font-semibold text-sm px-5 py-2 rounded-full transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponError && <p className="text-xs font-semibold text-red-500">{couponError}</p>}
                {couponSuccess && (
                  <p className="text-xs font-semibold text-emerald-600">Coupon applied successfully!</p>
                )}
              </div>

              {/* Total Summary Card */}
              <div className="card-lux !transform-none p-6 flex flex-col gap-4">
                <h3 className="font-semibold text-ink text-base tracking-tight">Summary</h3>

                <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-bold border-b border-slate-100 pb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-800">₹{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18% Included)</span>
                    <span>₹{formatINR(gstAmount)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span>-₹{formatINR(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="text-slate-800">
                      {deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold text-ink">Total</span>
                  <span className="text-2xl font-bold text-ink leading-none">₹{formatINR(total)}</span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full bg-ink hover:bg-ink-2 text-white font-semibold text-sm py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-2 transform hover:-translate-y-0.5"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={14} />
                </Link>

                <div className="text-[11px] text-slate-400 font-bold text-center mt-2 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Cash on delivery or pay at the showroom</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200/60 rounded-3xl text-center max-w-lg mx-auto">
            <ShoppingBag size={48} className="text-slate-300 animate-bounce mb-4" />
            <h3 className="text-lg font-bold text-slate-800">{t("Your cart is empty", "കാർട്ട് ശൂന്യമാണ്")}</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Looks like you haven&apos;t added anything to your cart yet. Visit the catalog to add items.
            </p>
            <Link
              href="/products"
              className="mt-6 bg-ink hover:bg-ink-2 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
