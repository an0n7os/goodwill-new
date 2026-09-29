"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import GSTInvoiceModal from "@/components/invoice/GSTInvoiceModal";
import { useLanguageStore } from "@/store/language";
import { trackOrder } from "@/lib/actions";
import { Search, Phone, CheckCircle2, Package, MapPin, AlertTriangle, Printer } from "lucide-react";
import { formatINR } from "@/lib/pricing";

function TrackOrderPageInner() {
  const { t } = useLanguageStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const urlOrderNumber = searchParams.get("orderNumber") || "";
  const urlPhone = searchParams.get("phone") || "";

  // Form Fields
  const [orderNumber, setOrderNumber] = useState(urlOrderNumber);
  const [phone, setPhone] = useState(urlPhone);
  const [order, setOrder] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Stepper Status index mapping
  const statusSteps = ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
  const statusLabels = {
    PLACED: t("Order Placed", "ഓർഡർ ലഭിച്ചു"),
    CONFIRMED: t("Confirmed", "സ്ഥിരീകരിച്ചു"),
    PACKED: t("Packed", "പാക്ക് ചെയ്തു"),
    OUT_FOR_DELIVERY: t("Out for Delivery", "ഡെലിവറിക്ക് അയച്ചു"),
    DELIVERED: t("Delivered", "ഡെലിവറി ചെയ്തു"),
    CANCELLED: t("Cancelled", "റദ്ദാക്കി"),
    RETURNED: t("Returned", "തിരിച്ചയച്ചു"),
  };

  const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1;

  // Search trigger
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !phone) return;

    // Update query params in URL
    router.push(`/track-order?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`);
  };

  // Fetch order details
  useEffect(() => {
    if (urlOrderNumber && urlPhone) {
      setOrderNumber(urlOrderNumber);
      setPhone(urlPhone);
      setErrorMsg("");

      startTransition(async () => {
        const result = await trackOrder(urlOrderNumber, urlPhone);
        if (result) {
          setOrder(result);
          setErrorMsg("");
        } else {
          setOrder(null);
          setErrorMsg("No order found matching this number and phone.");
        }
        setSearched(true);
      });
    }
  }, [urlOrderNumber, urlPhone]);

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <PageHeader
        eyebrow="Order status"
        title="Track your"
        accent="order."
        description="Enter your order number and the phone number used at checkout."
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "Track order" }]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-grow w-full">

        {/* Search bar */}
        <div className="card-lux !transform-none p-6 md:p-8 max-w-xl mx-auto mb-10">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Order Number *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. GW-2026-0002"
                  className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold uppercase"
                />
                <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Phone Number *</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile"
                  className="w-full pl-9 pr-4 py-2.5 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                />
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="bg-ink hover:bg-ink-2 text-white font-semibold text-sm py-3 rounded-full shadow transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              {isPending ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <Search size={16} />
                  <span>Search Order</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-4 bg-red-50 border border-red-100 p-4 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Tracking Details display */}
        {searched && order && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header info */}
            <div className="card-lux !transform-none p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.16em]">Receipt Detail</span>
                <h2 className="text-xl font-bold text-ink mt-1">Order #{order.orderNumber}</h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Placed on: {new Date(order.createdAt).toISOString().slice(0, 10)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Status badge */}
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  order.status === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : order.status === "CANCELLED"
                    ? "bg-red-50 text-red-700 border border-red-100"
                    : "bg-paper text-gold-dark border border-ink/10"
                }`}>
                  {(statusLabels as any)[order.status] || order.status}
                </span>

                {/* GST Tax Invoice Download Button */}
                <button
                  onClick={() => setIsInvoiceOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-paper hover:bg-amber-50 text-ink border border-ink/10 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Printer size={14} className="text-gold-dark" />
                  <span>GST Tax Invoice</span>
                </button>
              </div>
            </div>

            {/* Stepper Progress bar (only if not cancelled/returned) */}
            {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
              <div className="card-lux !transform-none p-6 md:p-8">
                <h3 className="font-semibold text-ink text-base tracking-tight mb-6">Delivery Timeline</h3>
                
                <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-4 md:items-center">
                  {/* connecting bar (Desktop) */}
                  <div className="absolute left-6 md:left-0 md:right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 hidden md:block z-0"></div>

                  {statusSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isActive = idx === currentStepIndex;

                    return (
                      <div key={idx} className="flex md:flex-col items-center gap-3 md:gap-2 z-10 flex-1">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-ink border-ink text-white shadow-md shadow-ink"
                            : "bg-white border-slate-300 text-slate-400"
                        } ${isActive ? "ring-4 ring-gold/20" : ""}`}>
                          {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                        </div>
                        <div className="flex flex-col md:items-center text-left md:text-center">
                          <span className={`text-xs font-bold ${isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                            {(statusLabels as any)[step]}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            {idx === 0
                              ? "Confirming stock"
                              : idx === 1
                              ? "Stock reserved"
                              : idx === 2
                              ? "Packed at showroom"
                              : idx === 3
                              ? "In vehicle"
                              : "Handed over"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Items & Shipping split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Items Bought */}
              <div className="card-lux !transform-none p-6 md:p-8 flex flex-col gap-4">
                <h3 className="font-semibold text-ink text-base tracking-tight border-b border-slate-100 pb-2">
                  Items Purchased
                </h3>
                <div className="flex flex-col gap-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{item.productName}</div>
                        {item.variantName && (
                          <span className="inline-block bg-slate-100 text-slate-500 font-bold text-[11px] px-1.5 py-0.5 rounded mt-0.5">
                            {item.variantName}
                          </span>
                        )}
                        <div className="text-[11px] text-slate-400 font-bold mt-1">
                          Qty: {item.quantity} x ₹{formatINR(item.price)}
                        </div>
                      </div>
                      <span className="font-bold text-slate-800 pl-2">₹{formatINR(item.total)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 text-xs text-slate-500 font-bold">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{formatINR(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span>{order.deliveryCharge === 0 ? "Free" : `₹${order.deliveryCharge}`}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span>-₹{formatINR(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink text-sm font-bold pt-2 border-t border-slate-50">
                    <span>{order.paymentStatus === "paid" ? "Total Paid" : "Total Payable"}</span>
                    <span className="text-ink">₹{formatINR(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping address & Payment Method */}
              <div className="flex flex-col gap-6">
                <div className="card-lux !transform-none p-6 md:p-8 flex flex-col gap-4">
                  <h3 className="font-semibold text-ink text-base tracking-tight border-b border-slate-100 pb-2">
                    Shipping Details
                  </h3>
                  <div className="flex items-start gap-2.5 text-xs">
                    <MapPin size={16} className="text-gold-dark flex-shrink-0 mt-0.5" />
                    <div>
                      {(() => {
                        try {
                          const addr = JSON.parse(order.shippingAddress);
                          return (
                            <div className="flex flex-col gap-1 text-slate-600 font-semibold">
                              <span className="font-bold text-slate-800">{addr.name}</span>
                              <span>{addr.line1}</span>
                              <span>{addr.city} - {addr.pincode}</span>
                              <span className="mt-1">Phone: {addr.phone}</span>
                            </div>
                          );
                        } catch {
                          return <span className="text-slate-400">Failed to render address.</span>;
                        }
                      })()}
                    </div>
                  </div>
                </div>

                <div className="card-lux !transform-none p-6 md:p-8 flex flex-col gap-3 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-bold text-slate-800 uppercase">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status</span>
                    <span className={`font-bold uppercase ${
                      order.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Method</span>
                    <span className="font-bold text-slate-800 uppercase">{order.deliveryType}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* GST Tax Invoice Printable Modal */}
      <GSTInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={order}
      />

      <Footer />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col min-h-screen bg-paper">
        <Header />
        <div className="flex-grow flex items-center justify-center p-20">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-gold animate-spin"></div>
        </div>
        <Footer />
      </div>
    }>
      <TrackOrderPageInner />
    </React.Suspense>
  );
}
