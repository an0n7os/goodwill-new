"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import OrderSummaryModal from "@/components/invoice/OrderSummaryModal";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { getTrackedOrder, cancelMyOrder, getReorderLines, type TrackedOrder } from "@/lib/orderActions";
import { useCartStore } from "@/store/cart";
import { formatINR } from "@/lib/pricing";
import { paymentStatusLabel, paymentMethodLabel, deliveryTypeLabel } from "@/lib/orderLabels";
import { statusLabel, STATUS_BADGE, CUSTOMER_CANCELLABLE, isClosed } from "@/lib/orderStatus";
import {
  Search,
  Phone,
  Package,
  MapPin,
  AlertTriangle,
  Printer,
  CheckCircle2,
  MessageCircle,
  Copy,
  RotateCcw,
  XCircle,
  CalendarClock,
  Truck,
} from "lucide-react";

const SHOP_WHATSAPP = "919744164444";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

function TrackOrderPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [isPending, startTransition] = useTransition();

  const urlOrderNumber = searchParams.get("orderNumber") || "";
  const urlPhone = searchParams.get("phone") || "";
  const justPlaced = searchParams.get("placed") === "1";

  const [orderNumber, setOrderNumber] = useState(urlOrderNumber);
  const [phone, setPhone] = useState(urlPhone);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !phone) return;
    router.push(`/track-order?orderNumber=${encodeURIComponent(orderNumber.trim().toUpperCase())}&phone=${encodeURIComponent(phone.trim())}`);
  };

  const load = useCallback(async () => {
    const result = await getTrackedOrder(urlOrderNumber, urlPhone);
    setOrder(result);
    setErrorMsg(result ? "" : "No order found with this order number and phone number.");
    setSearched(true);
  }, [urlOrderNumber, urlPhone]);

  useEffect(() => {
    if (!urlOrderNumber || !urlPhone) return;
    startTransition(load);
  }, [urlOrderNumber, urlPhone, load]);

  // Keep an open order fresh while the page stays open
  const closed = order ? isClosed(order.status) : true;
  useEffect(() => {
    if (closed) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60_000);
    return () => clearInterval(t);
  }, [closed, load]);

  const handleCancel = () => {
    if (!order) return;
    startTransition(async () => {
      const res = await cancelMyOrder(order.orderNumber, urlPhone, cancelReason);
      if (!res.success) {
        setActionMsg(res.error);
        return;
      }
      setOrder(res.order);
      setCancelOpen(false);
      setActionMsg("Your order has been cancelled.");
    });
  };

  const handleReorder = () => {
    if (!order) return;
    startTransition(async () => {
      const lines = await getReorderLines(order.orderNumber, urlPhone);
      if (lines.length === 0) {
        setActionMsg("These items are currently unavailable. Please WhatsApp us for a quote.");
        return;
      }
      lines.forEach((l) => addItem(l));
      router.push("/cart");
    });
  };

  const copyOrderNumber = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked; the number is visible on screen anyway
    }
  };

  let address: { name?: string; phone?: string; line1?: string; city?: string; pincode?: string } = {};
  try {
    address = order ? JSON.parse(order.shippingAddress) : {};
  } catch {
    // Older orders may not have an address snapshot
  }

  // Older orders were created before the timeline existed
  const events = order ? (order.events.length ? order.events : [{ id: "placed", status: "PLACED", note: null, actor: "system", createdAt: order.createdAt }]) : [];

  const whatsappText = order
    ? `Hi Goodwill, I placed order ${order.orderNumber} (₹${formatINR(order.total)}). ${
        justPlaced ? "Please confirm my order." : `Current status: ${statusLabel(order.status, order.deliveryType)}. I have a question:`
      }`
    : "";
  const agentPhone = order?.deliveryAgent?.match(/\d[\d\s-]{8,}\d/)?.[0]?.replace(/\D/g, "");

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <PageHeader
        width="5xl"
        eyebrow="Order status"
        title="Track your"
        accent="order."
        description="See exactly where your order is, from packing to your doorstep."
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "Track order" }]}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-grow w-full flex flex-col gap-6">
        {justPlaced && order && order.status !== "CANCELLED" && (
          <div className="card-lux !transform-none p-5 md:p-6 border-emerald-200 bg-emerald-50/60 flex flex-col md:flex-row md:items-center gap-4 animate-fade-in">
            <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-ink">Thank you! Your order is placed.</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Order <span className="font-semibold text-ink">{order.orderNumber}</span> · We&apos;ll call or WhatsApp you on +91 {order.customer.phone} to confirm. Bookmark this page to track it.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={copyOrderNumber} className="btn-outline-light !text-ink !border-ink/15 !py-2.5 !px-4 !text-xs bg-white">
                <Copy size={14} /> {copied ? "Copied" : "Copy order no."}
              </button>
              <a
                href={`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5"
              >
                <MessageCircle size={14} /> Confirm on WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Lookup form: hidden once an order is showing, to keep the page focused */}
        {(!order || !searched) && (
          <div className="card-lux !transform-none p-6 md:p-8 w-full max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="track-order-number" className="text-xs font-semibold text-slate-500">Order number</label>
                <div className="relative">
                  <input
                    id="track-order-number"
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. GW-2026-0002"
                    className="w-full h-11 pl-10 pr-4 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold uppercase"
                  />
                  <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="track-phone" className="text-xs font-semibold text-slate-500">Phone number used at checkout</label>
                <div className="relative">
                  <input
                    id="track-phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile"
                    className="w-full h-11 pl-10 pr-4 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm font-semibold"
                  />
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <button type="submit" disabled={isPending} className="btn-dark w-full mt-1 disabled:opacity-60">
                {isPending ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Search size={15} /> Track order
                  </>
                )}
              </button>
            </form>
            {errorMsg && (
              <div className="mt-4 bg-red-50 border border-red-100 p-3.5 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {searched && order && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Summary bar */}
            <div className="card-lux !transform-none p-5 md:p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.16em]">Order</span>
                <h2 className="text-xl font-semibold text-ink mt-0.5">{order.orderNumber}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Placed {formatDate(order.createdAt)} · {order.items.length} item{order.items.length === 1 ? "" : "s"} · ₹{formatINR(order.total)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border ${STATUS_BADGE[order.status] ?? "bg-paper text-ink border-ink/10"}`}>
                  {statusLabel(order.status, order.deliveryType)}
                </span>
                <button onClick={() => setIsInvoiceOpen(true)} className="h-9 px-3.5 rounded-full bg-white text-ink border border-ink/10 hover:border-gold/50 text-xs font-semibold inline-flex items-center gap-1.5">
                  <Printer size={14} className="text-gold-dark" /> Order summary
                </button>
                <Link href="/track-order" onClick={() => setSearched(false)} className="h-9 px-3.5 rounded-full text-slate-500 hover:text-ink text-xs font-semibold inline-flex items-center">
                  Track another
                </Link>
              </div>
            </div>

            {actionMsg && (
              <div className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink flex items-center gap-2">
                <AlertTriangle size={15} className="text-gold-dark" /> {actionMsg}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              {/* Timeline */}
              <div className="lg:col-span-3 card-lux !transform-none p-6 md:p-7 flex flex-col gap-5">
                <h3 className="font-semibold text-ink">Where is my order?</h3>

                {(order.expectedDate || order.deliveryAgent) && !isClosed(order.status) && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {order.expectedDate && (
                      <div className="rounded-xl bg-paper border border-ink/[0.06] p-3.5 flex items-center gap-3">
                        <CalendarClock size={18} className="text-gold-dark flex-shrink-0" />
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            {order.deliveryType === "pickup" ? "Ready by" : "Expected delivery"}
                          </div>
                          <div className="text-sm font-semibold text-ink">{formatDate(order.expectedDate)}</div>
                        </div>
                      </div>
                    )}
                    {order.deliveryAgent && (
                      <div className="rounded-xl bg-paper border border-ink/[0.06] p-3.5 flex items-center gap-3">
                        <Truck size={18} className="text-gold-dark flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Delivery by</div>
                          <div className="text-sm font-semibold text-ink truncate">{order.deliveryAgent}</div>
                        </div>
                        {agentPhone && (
                          <a href={`tel:+91${agentPhone.slice(-10)}`} className="ml-auto w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center" aria-label="Call delivery person">
                            <Phone size={14} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <OrderTimeline status={order.status} deliveryType={order.deliveryType} events={events} />

                <div className="flex flex-wrap gap-2 pt-4 border-t border-ink/[0.06]">
                  <a
                    href={`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(whatsappText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <MessageCircle size={14} /> Help on WhatsApp
                  </a>
                  {order.status === "DELIVERED" && (
                    <button onClick={handleReorder} disabled={isPending} className="h-10 px-4 rounded-full bg-ink text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">
                      <RotateCcw size={14} /> Buy again
                    </button>
                  )}
                  {CUSTOMER_CANCELLABLE.includes(order.status) && !cancelOpen && (
                    <button
                      onClick={() => {
                        setActionMsg("");
                        setCancelOpen(true);
                      }}
                      className="h-10 px-4 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <XCircle size={14} /> Cancel order
                    </button>
                  )}
                </div>

                {cancelOpen && (
                  <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 flex flex-col gap-3">
                    <p className="text-sm text-ink font-medium">Cancel this order?</p>
                    <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="h-10 px-3 rounded-xl border border-ink/10 bg-white text-sm">
                      <option value="">Reason (optional)</option>
                      <option>Ordered by mistake</option>
                      <option>Found a better price</option>
                      <option>Need different items or quantity</option>
                      <option>Delivery takes too long</option>
                      <option>Other</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleCancel} disabled={isPending} className="h-10 px-4 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-60">
                        {isPending ? "Cancelling…" : "Yes, cancel order"}
                      </button>
                      <button onClick={() => setCancelOpen(false)} className="h-10 px-4 rounded-full text-slate-600 hover:text-ink text-xs font-semibold">
                        Keep order
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="card-lux !transform-none p-6 flex flex-col gap-4">
                  <h3 className="font-semibold text-ink">Items</h3>
                  <ul className="flex flex-col gap-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium text-ink">{item.productName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {item.variantName ? `${item.variantName} · ` : ""}
                            {item.quantity} × ₹{formatINR(item.price)}
                          </div>
                        </div>
                        <span className="font-semibold text-ink whitespace-nowrap">₹{formatINR(item.total)}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="border-t border-ink/[0.06] pt-4 flex flex-col gap-2 text-sm text-slate-500">
                    <div className="flex justify-between">
                      <dt>Subtotal</dt>
                      <dd>₹{formatINR(order.subtotal)}</dd>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                        <dd>−₹{formatINR(order.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt>Delivery</dt>
                      <dd>{order.deliveryCharge === 0 ? "Free" : `₹${formatINR(order.deliveryCharge)}`}</dd>
                    </div>
                    <div className="flex justify-between text-xs">
                      <dt>GST included</dt>
                      <dd>₹{formatINR(order.gstAmount)}</dd>
                    </div>
                    <div className="flex justify-between text-ink font-semibold text-base pt-2 border-t border-ink/[0.06]">
                      <dt>{order.paymentStatus === "paid" ? "Paid" : "To pay"}</dt>
                      <dd>₹{formatINR(order.total)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="card-lux !transform-none p-6 flex flex-col gap-4 text-sm">
                  <h3 className="font-semibold text-ink">{order.deliveryType === "pickup" ? "Pickup" : "Delivery address"}</h3>
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-gold-dark flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5 text-slate-600">
                      {order.deliveryType === "pickup" ? (
                        <>
                          <span className="font-medium text-ink">Goodwill Electrical World</span>
                          <span>Opp. Kulappully Bus Stand, Shoranur 679122</span>
                          <span>Mon – Sat · 8:00 AM – 8:00 PM</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-ink">{address.name}</span>
                          <span>{address.line1}</span>
                          <span>
                            {address.city} {address.pincode}
                          </span>
                          <span>+91 {address.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {order.notes && <p className="text-xs text-slate-500 bg-paper rounded-xl p-3">Your note: {order.notes}</p>}
                  <dl className="flex flex-col gap-2 pt-3 border-t border-ink/[0.06] text-slate-500">
                    <div className="flex justify-between gap-4">
                      <dt>Payment</dt>
                      <dd className="font-medium text-ink text-right">{paymentMethodLabel(order.paymentMethod)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Payment status</dt>
                      <dd
                        className={`font-medium text-right ${
                          order.paymentStatus === "paid" ? "text-emerald-700" : order.paymentStatus === "refund_due" ? "text-red-600" : "text-gold-dark"
                        }`}
                      >
                        {paymentStatusLabel(order.paymentStatus, order.paymentMethod)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Delivery type</dt>
                      <dd className="font-medium text-ink text-right">{deliveryTypeLabel(order.deliveryType)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <OrderSummaryModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} order={order} />
      <Footer />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-paper">
          <Header />
          <div className="flex-grow flex items-center justify-center p-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-gold animate-spin" />
          </div>
          <Footer />
        </div>
      }
    >
      <TrackOrderPageInner />
    </React.Suspense>
  );
}
