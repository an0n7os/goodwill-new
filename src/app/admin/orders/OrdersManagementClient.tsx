"use client";

import { useHydrated } from "@/lib/useHydrated";
import type { getAdminOrders } from "@/lib/orderActions";
import React, { useState, useTransition } from "react";
import { toast } from "@/components/admin/Toaster";
import { adminUpdateOrder } from "@/lib/orderActions";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { formatINR } from "@/lib/pricing";
import { paymentStatusLabel, paymentMethodLabel, deliveryTypeLabel } from "@/lib/orderLabels";
import { ORDER_STATUSES, STATUS_BADGE, orderSteps, statusLabel, isClosed } from "@/lib/orderStatus";
import { Search, Printer, Calendar, MapPin, MessageSquare, Phone, ArrowRight, Wallet, StickyNote, Store, Truck } from "lucide-react";

type AdminOrder = Awaited<ReturnType<typeof getAdminOrders>>[number];

interface OrdersManagementClientProps {
  initialOrders: AdminOrder[];
}

function formatDateDeterministic(dateInput: string | Date) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

function toDateInput(d: Date | string | null) {
  return d ? new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "";
}

const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: "open", label: "To do", match: (s) => ["PLACED", "CONFIRMED", "PACKED"].includes(s) },
  { key: "PLACED", label: "New", match: (s) => s === "PLACED" },
  { key: "transit", label: "Out / Ready", match: (s) => s === "OUT_FOR_DELIVERY" || s === "READY_FOR_PICKUP" },
  { key: "DELIVERED", label: "Completed", match: (s) => s === "DELIVERED" },
  { key: "closed", label: "Cancelled / Returned", match: (s) => s === "CANCELLED" || s === "RETURNED" },
  { key: "all", label: "All", match: () => true },
];

// Message the shop sends the customer for each stage
function customerMessage(order: AdminOrder, trackUrl: string) {
  const first = order.customer?.name?.split(" ")[0] ?? "";
  const base = `Hi ${first}, this is Goodwill Electrical World about order ${order.orderNumber} (₹${formatINR(order.total)}).`;
  const date = order.expectedDate ? new Date(order.expectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "";
  const byStatus: Record<string, string> = {
    PLACED: "We've received your order and will confirm it shortly.",
    CONFIRMED: `Your order is confirmed${date ? ` and expected by ${date}` : ""}.`,
    PACKED: order.deliveryType === "pickup" ? "Your order is packed." : `Your order is packed and will leave the showroom soon${date ? ` (expected ${date})` : ""}.`,
    OUT_FOR_DELIVERY: `Your order is out for delivery${order.deliveryAgent ? ` with ${order.deliveryAgent}` : ""}. Please keep ₹${formatINR(order.total)} ready if paying on delivery.`,
    READY_FOR_PICKUP: "Your order is ready for pickup at our showroom opposite Kulappully bus stand (Mon–Sat, 8 AM–8 PM). Please bring your order number.",
    DELIVERED: "Your order has been delivered. Thank you for shopping with us!",
    CANCELLED: "Your order has been cancelled. Nothing will be charged.",
    RETURNED: "We've received the returned items.",
  };
  return `${base}\n\n${byStatus[order.status] ?? ""}\n\nTrack it here: ${trackUrl}`;
}

export default function OrdersManagementClient({ initialOrders }: OrdersManagementClientProps) {
  const [isPending, startTransition] = useTransition();

  // Site origin for customer-facing links (read after mount to keep SSR markup stable)
  const hydrated = useHydrated();
  const origin = hydrated ? window.location.origin : "";

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("open");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrders[0]?.id ?? null);

  // Dispatch form for the selected order (re-seeded when the selection changes)
  const [formFor, setFormFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [deliveryAgent, setDeliveryAgent] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const q = searchQuery.toLowerCase().trim();
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const filteredOrders = initialOrders.filter(
    (ord) =>
      active.match(ord.status) &&
      (!q || ord.orderNumber.toLowerCase().includes(q) || ord.customer?.name.toLowerCase().includes(q) || ord.customer?.phone.includes(q))
  );

  const selectedOrder = initialOrders.find((o) => o.id === selectedOrderId) ?? filteredOrders[0];
  if (selectedOrder && formFor !== selectedOrder.id) {
    setFormFor(selectedOrder.id);
    setNote("");
    setExpectedDate(toDateInput(selectedOrder.expectedDate));
    setDeliveryAgent(selectedOrder.deliveryAgent ?? "");
    setAdminNote(selectedOrder.adminNote ?? "");
  }

  const save = (patch: Parameters<typeof adminUpdateOrder>[1], ok: string) => {
    if (!selectedOrder) return;
    startTransition(async () => {
      const res = await adminUpdateOrder(selectedOrder.id, patch);
      if (!res.success) return toast.error(res.error);
      toast.success(ok);
      if (patch.note) setNote("");
    });
  };

  const changeStatus = (status: string) => {
    if (!selectedOrder) return;
    if (status === "CANCELLED" && !window.confirm(`Cancel ${selectedOrder.orderNumber}? Stock will be put back.`)) return;
    save(
      { status, note: note || undefined, expectedDate: expectedDate || null, deliveryAgent: deliveryAgent || null },
      `Marked as ${statusLabel(status, selectedOrder.deliveryType).toLowerCase()}.`
    );
  };

  const steps = selectedOrder ? orderSteps(selectedOrder.deliveryType) : [];
  const nextStatus = selectedOrder && !isClosed(selectedOrder.status) ? steps[steps.indexOf(selectedOrder.status as (typeof steps)[number]) + 1] : undefined;
  const trackUrl = selectedOrder ? `${origin}/track-order?orderNumber=${selectedOrder.orderNumber}&phone=${selectedOrder.customer?.phone}` : "";
  const count = (f: (typeof FILTERS)[number]) => initialOrders.filter((o) => f.match(o.status)).length;

  let addr: { name?: string; phone?: string; line1?: string; city?: string; pincode?: string } = {};
  try {
    addr = selectedOrder ? JSON.parse(selectedOrder.shippingAddress) : {};
  } catch {
    // Older orders may not have an address snapshot
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              filter === f.key ? "bg-ink text-white border-ink" : "bg-white text-slate-600 border-ink/[0.07] hover:border-gold/40"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 ${filter === f.key ? "text-gold-light" : "text-slate-400"}`}>{count(f)}</span>
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Order #, name or phone"
            className="adm-input !pl-9"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Orders list */}
        <div className="adm-card overflow-hidden lg:sticky lg:top-20">
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`w-full px-4 py-3 text-left transition-colors flex justify-between items-center gap-3 border-l-[3px] cursor-pointer ${
                      isSelected ? "bg-paper border-gold" : "border-transparent hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-ink text-[13px] flex items-center gap-1.5">
                        {ord.orderNumber}
                        {ord.deliveryType === "pickup" ? <Store size={12} className="text-slate-400" /> : <Truck size={12} className="text-slate-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {ord.customer?.name} · {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[13px] font-semibold text-ink">₹{formatINR(ord.total)}</span>
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider ${STATUS_BADGE[ord.status] ?? "bg-paper text-gold-dark"}`}>
                        {statusLabel(ord.status, ord.deliveryType)}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-12">No orders here.</p>
            )}
          </div>
        </div>

        {/* Selected order */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="adm-card overflow-hidden flex flex-col animate-fade-in">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-ink">{selectedOrder.orderNumber}</h2>
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold uppercase tracking-wider ${STATUS_BADGE[selectedOrder.status] ?? ""}`}>
                      {statusLabel(selectedOrder.status, selectedOrder.deliveryType)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Calendar size={12} />
                    {formatDateDeterministic(selectedOrder.createdAt)} · {deliveryTypeLabel(selectedOrder.deliveryType)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`tel:+91${selectedOrder.customer?.phone}`} className="adm-btn-ghost !h-9 !px-3" title="Call customer">
                    <Phone size={14} />
                  </a>
                  <a
                    href={`https://wa.me/91${selectedOrder.customer?.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(customerMessage(selectedOrder, trackUrl))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adm-btn !h-9 !px-3 !bg-emerald-600 hover:!bg-emerald-500"
                    title="Send the customer a status update on WhatsApp"
                  >
                    <MessageSquare size={14} /> Update on WhatsApp
                  </a>
                  <button onClick={() => window.print()} className="adm-btn-ghost !h-9 !px-3" title="Print order summary">
                    <Printer size={14} />
                  </button>
                </div>
              </div>

              {/* Status actions */}
              {!isClosed(selectedOrder.status) && (
                <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col gap-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="adm-label">{selectedOrder.deliveryType === "pickup" ? "Ready by" : "Expected delivery"}</label>
                      <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="adm-input" />
                    </div>
                    {selectedOrder.deliveryType !== "pickup" && (
                      <div>
                        <label className="adm-label">Delivery person (shown to customer)</label>
                        <input value={deliveryAgent} onChange={(e) => setDeliveryAgent(e.target.value)} placeholder="e.g. Rahul · 98470 12345" className="adm-input" />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="adm-label">Message for the customer (optional, shown on tracking)</label>
                      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Delivering after 4 pm today" className="adm-input" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {nextStatus && (
                      <button onClick={() => changeStatus(nextStatus)} disabled={isPending} className="adm-btn">
                        Mark {statusLabel(nextStatus, selectedOrder.deliveryType).toLowerCase()} <ArrowRight size={14} />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        save(
                          { note: note || undefined, expectedDate: expectedDate || null, deliveryAgent: deliveryAgent || null },
                          "Saved."
                        )
                      }
                      disabled={isPending}
                      className="adm-btn-ghost"
                    >
                      Save details
                    </button>
                    <select
                      value=""
                      onChange={(e) => e.target.value && changeStatus(e.target.value)}
                      disabled={isPending}
                      className="adm-input !w-auto !h-10 text-slate-600"
                      aria-label="Set any status"
                    >
                      <option value="">Other status…</option>
                      {ORDER_STATUSES.filter(
                        (s) =>
                          s !== selectedOrder.status &&
                          (s !== "READY_FOR_PICKUP" || selectedOrder.deliveryType === "pickup") &&
                          (s !== "OUT_FOR_DELIVERY" || selectedOrder.deliveryType !== "pickup")
                      ).map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s, selectedOrder.deliveryType)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Items + totals */}
                <div className="flex flex-col gap-3">
                  <h4 className="adm-label !mb-0">Items</h4>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-3 text-[13px]">
                      <div className="min-w-0">
                        <div className="font-medium text-ink">{item.productName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.variantName ? `${item.variantName} · ` : ""}
                          {item.quantity} × ₹{formatINR(item.price)}
                        </div>
                      </div>
                      <span className="font-semibold text-ink whitespace-nowrap">₹{formatINR(item.total)}</span>
                    </div>
                  ))}
                  <dl className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <dt>Subtotal</dt>
                      <dd>₹{formatINR(selectedOrder.subtotal)}</dd>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <dt>Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ""}</dt>
                        <dd>−₹{formatINR(selectedOrder.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt>Delivery</dt>
                      <dd>₹{formatINR(selectedOrder.deliveryCharge)}</dd>
                    </div>
                    <div className="flex justify-between text-ink text-sm font-semibold pt-1.5 border-t border-slate-100">
                      <dt>Total</dt>
                      <dd>₹{formatINR(selectedOrder.total)}</dd>
                    </div>
                  </dl>

                  <div className="rounded-xl border border-slate-100 p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Wallet size={15} className="text-gold-dark" />
                      <div>
                        <div className="font-medium text-ink">{paymentMethodLabel(selectedOrder.paymentMethod)}</div>
                        <div className={selectedOrder.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}>
                          {paymentStatusLabel(selectedOrder.paymentStatus, selectedOrder.paymentMethod)}
                        </div>
                      </div>
                    </div>
                    {selectedOrder.paymentStatus === "pending" && (
                      <button onClick={() => save({ paymentStatus: "paid" }, "Payment marked as received.")} disabled={isPending} className="adm-btn-ghost !h-8 !px-3 !text-xs">
                        Mark paid
                      </button>
                    )}
                    {selectedOrder.paymentStatus === "refund_due" && (
                      <button onClick={() => save({ paymentStatus: "refunded" }, "Marked as refunded.")} disabled={isPending} className="adm-btn-ghost !h-8 !px-3 !text-xs">
                        Mark refunded
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer + timeline */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <h4 className="adm-label !mb-0">Customer</h4>
                    <div className="flex items-start gap-2.5 text-[13px]">
                      <MapPin size={15} className="text-gold-dark flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5 text-slate-600">
                        <span className="font-medium text-ink">{addr.name ?? selectedOrder.customer?.name}</span>
                        <span>+91 {addr.phone ?? selectedOrder.customer?.phone}</span>
                        {selectedOrder.deliveryType === "pickup" ? (
                          <span className="text-slate-400">Collecting from showroom</span>
                        ) : (
                          <>
                            <span>{addr.line1}</span>
                            <span>
                              {addr.city} {addr.pincode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedOrder.notes && (
                      <p className="text-xs rounded-xl bg-amber-50 border border-amber-100 text-amber-800 p-2.5">Customer note: {selectedOrder.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <h4 className="adm-label !mb-0">Timeline</h4>
                    <OrderTimeline
                      status={selectedOrder.status}
                      deliveryType={selectedOrder.deliveryType}
                      events={selectedOrder.events.length ? selectedOrder.events : [{ id: "p", status: "PLACED", note: null, createdAt: selectedOrder.createdAt }]}
                      compact={false}
                    />
                  </div>

                  <div>
                    <label className="adm-label flex items-center gap-1.5">
                      <StickyNote size={12} /> Internal note (staff only)
                    </label>
                    <textarea
                      rows={2}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      onBlur={() => adminNote !== (selectedOrder.adminNote ?? "") && save({ adminNote }, "Note saved.")}
                      placeholder="e.g. Customer will pay by UPI"
                      className="adm-input resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="adm-card p-12 text-center text-slate-400 text-sm">No order selected.</div>
          )}
        </div>
      </div>

      {/* High-Quality Printable GST Tax Invoice Template */}
      {selectedOrder && (
        <div id="printable-invoice" className="hidden print:block">
          <div className="flex flex-col gap-6 font-sans text-black">
            {/* 1. Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">GOODWILL ELECTRICAL WORLD</h1>
                <p className="text-xs font-bold text-slate-600 mt-0.5">Authorised Dealer: Electrical, Plumbing, Sanitary Wares &amp; Bath Fittings</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">Palakkad - Ponnani Highway, Opp. Kulappully Bus Stand, Shoranur, Kerala - 679122</p>
                <p className="text-[11px] font-bold text-slate-700 mt-0.5">Mob: 9744164444 • 9961898888 • 9544554555</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="bg-slate-950 text-white font-bold text-xs uppercase px-3 py-1 rounded">ORDER SUMMARY</span>
                <span className="text-xs font-bold text-slate-700 mt-2">Official GST invoice available at showroom</span>
              </div>
            </div>

            {/* 2. Customer & Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-400">Billed To (Customer Details):</div>
                <div className="font-semibold text-ink text-sm mt-1">{selectedOrder.customer?.name}</div>
                <div className="font-semibold text-slate-700 mt-0.5">Phone: {selectedOrder.customer?.phone}</div>
                {(() => {
                  try {
                    const addr = JSON.parse(selectedOrder.shippingAddress);
                    return <div className="text-slate-600 mt-1">{addr.line1}, {addr.city} - {addr.pincode}</div>;
                  } catch {
                    return null;
                  }
                })()}
              </div>

              <div className="flex flex-col gap-1 text-right">
                <div className="font-bold text-ink"><span className="text-slate-500 font-normal">Order No:</span> #{selectedOrder.orderNumber}</div>
                <div className="font-semibold text-slate-700"><span className="text-slate-500 font-normal">Date &amp; Time:</span> {formatDateDeterministic(selectedOrder.createdAt)}</div>
                <div className="font-semibold text-slate-700"><span className="text-slate-500 font-normal">Payment Method:</span> {paymentMethodLabel(selectedOrder.paymentMethod)}</div>
                <div className="font-bold text-ink"><span className="text-slate-500 font-normal">Payment Status:</span> {paymentStatusLabel(selectedOrder.paymentStatus, selectedOrder.paymentMethod)}</div>
              </div>
            </div>

            {/* 3. Items Table */}
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase">
                  <th className="py-2.5 px-3 text-left border-r border-slate-300">#</th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-300">Item Description</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-300">Qty</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-300">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                {selectedOrder.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <span className="font-bold text-ink">{item.productName}</span>
                      {item.variantName && <span className="text-[11px] text-slate-500 ml-2 font-bold">({item.variantName})</span>}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right">₹{formatINR(item.price)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">₹{formatINR(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 4. Financial Calculations Grid */}
            <div className="flex justify-between items-start border-t border-slate-200 pt-4">
              <div className="text-[11px] text-slate-500 font-medium max-w-xs flex flex-col gap-1">
                <div className="font-bold text-slate-800 uppercase">Terms &amp; Conditions:</div>
                <div>1. Returns follow our published refund policy.</div>
                <div>2. Warranty claims as per brand manufacturer terms (Jaquar, Legrand, Supreme, CERA).</div>
                <div>3. All disputes subject to Shoranur Jurisdiction.</div>
              </div>

              <div className="w-64 flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>Taxable Amount</span>
                  {/* Prices are GST-inclusive: split the discounted goods value into taxable + 18% GST */}
                  <span>₹{formatINR(selectedOrder.subtotal - selectedOrder.discount - selectedOrder.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>CGST included</span>
                  <span>₹{formatINR(Math.round((selectedOrder.gstAmount / 2) * 100) / 100)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>SGST included</span>
                  <span>₹{formatINR(Math.round((selectedOrder.gstAmount / 2) * 100) / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Freight / Delivery</span>
                  <span>₹{formatINR(selectedOrder.deliveryCharge)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-₹{formatINR(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-bold text-ink">
                  <span>GRAND TOTAL</span>
                  <span className="text-base">₹{formatINR(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* 5. Signature Footer */}
            <div className="flex justify-between items-end pt-10 border-t border-slate-200 text-xs">
              <div className="text-[11px] text-slate-500 italic">
                Thank you for trusting Goodwill Electrical World!
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 border-b border-slate-400 w-44"></div>
                <span className="text-[11px] font-bold uppercase text-slate-700 mt-1">Authorized Signatory</span>
                <span className="text-[11px] text-slate-500 font-bold">Goodwill Electrical World</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
