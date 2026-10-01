"use client";

import React, { useState, useTransition, useEffect } from "react";
import { updateOrderStatus } from "@/lib/actions";
import { formatINR } from "@/lib/pricing";
import { paymentStatusLabel, paymentMethodLabel, deliveryTypeLabel } from "@/lib/orderLabels";
import { Search, ChevronRight, Printer, Calendar, User, MapPin, Clock, Loader, MessageSquare } from "lucide-react";

interface OrdersManagementClientProps {
  initialOrders: any[];
}

function formatDateDeterministic(dateInput: string | Date) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${mins}`;
}

export default function OrdersManagementClient({ initialOrders }: OrdersManagementClientProps) {
  const [, startTransition] = useTransition();

  // Site origin for customer-facing links (read after mount to keep SSR markup stable)
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Selection
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrders.length > 0 ? initialOrders[0].id : null
  );

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Client-side Filter
  const filteredOrders = initialOrders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer?.phone.includes(searchQuery);
    const matchesStatus = statusFilter ? ord.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Get currently selected order details
  const selectedOrder = initialOrders.find((o) => o.id === selectedOrderId);

  // Status Handler
  const handleStatusChange = (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus);
      setUpdatingId(null);
      if (!res.success) {
        alert(res.error || "Failed to update order status.");
      }
    });
  };

  const statusLabels = {
    PLACED: "Order Placed",
    CONFIRMED: "Confirmed",
    PACKED: "Packed",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURNED: "Returned",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left Columns: Orders List (1 Column) */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 bg-slate-50 text-xs"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* List items */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col max-h-[500px] overflow-y-auto">
          {filteredOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((ord) => {
                const isSelected = selectedOrderId === ord.id;
                return (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`w-full p-4 text-left transition-all flex justify-between items-center ${
                      isSelected ? "bg-slate-50 border-l-4 border-gold" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span>Order #{ord.orderNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        {ord.customer?.name} • ₹{ord.total}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        ord.status === "DELIVERED"
                          ? "bg-emerald-50 text-emerald-700"
                          : ord.status === "CANCELLED"
                          ? "bg-red-50 text-red-700"
                          : "bg-paper text-gold-dark"
                      }`}>
                        {ord.status}
                      </span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12 font-semibold">No orders found.</p>
          )}
        </div>
      </div>

      {/* Right Column: Selected Order Details (2 Columns) */}
      <div className="lg:col-span-2">
        {selectedOrder ? (
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col animate-fade-in">
            {/* Detail Pane Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Order #{selectedOrder.orderNumber}</h2>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.16em] mt-1">
                  <Calendar size={12} />
                  <span>{formatDateDeterministic(selectedOrder.createdAt)}</span>
                </div>
              </div>

              {/* Status Update Dropdown & Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Print GST Tax Invoice"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Print</span>
                </button>

                <a
                  href={`https://wa.me/91${selectedOrder.customer?.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hi ${selectedOrder.customer?.name}, thank you for your order with Goodwill Electrical World!\n\nOrder #: ${selectedOrder.orderNumber}\nTotal Amount: ₹${formatINR(selectedOrder.total)}\nStatus: ${selectedOrder.status}\n\nTrack your order online: ${origin}/track-order?orderNumber=${selectedOrder.orderNumber}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Send WhatsApp Order Confirmation"
                >
                  <MessageSquare size={14} />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>

                {updatingId === selectedOrder.id ? (
                  <div className="flex items-center gap-1.5 text-xs text-gold-dark font-bold px-2">
                    <Loader size={14} className="animate-spin" />
                    <span>Updating</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 rounded-xl text-xs">
                    <Clock size={14} className="text-slate-400" />
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                      className="bg-transparent focus:outline-none font-bold text-slate-700 cursor-pointer"
                    >
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Split Grid */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: Items detail */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items List</h4>
                <div className="flex flex-col gap-3">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{item.productName}</div>
                        {item.variantName && (
                          <span className="inline-block bg-slate-100 text-slate-500 font-bold text-[11px] px-1.5 py-0.5 rounded mt-0.5">
                            {item.variantName}
                          </span>
                        )}
                        <div className="text-[11px] text-slate-400 font-bold mt-1">
                          {item.quantity} x ₹{item.price}
                        </div>
                      </div>
                      <span className="font-bold text-slate-800">₹{item.total}</span>
                    </div>
                  ))}
                </div>

                {/* Price Summary */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5 text-xs text-slate-500 font-bold">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span>₹{selectedOrder.deliveryCharge}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span>-₹{selectedOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink text-sm font-bold pt-2 border-t border-slate-50">
                    <span>Grand Total</span>
                    <span className="text-ink">₹{selectedOrder.total}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Shipping & Payment */}
              <div className="flex flex-col gap-6">
                {/* Shipping Details */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shipping Details</h4>
                  <div className="flex items-start gap-2.5 text-xs">
                    <MapPin size={16} className="text-gold-dark flex-shrink-0 mt-0.5" />
                    <div>
                      {(() => {
                        try {
                          const addr = JSON.parse(selectedOrder.shippingAddress);
                          return (
                            <div className="flex flex-col gap-1 text-slate-600 font-semibold">
                              <span className="font-bold text-slate-800">{addr.name}</span>
                              <span>{addr.line1}</span>
                              <span>{addr.city} - {addr.pincode}</span>
                              <span className="mt-1 flex items-center gap-1">
                                <User size={12} className="text-slate-400" />
                                <span>Phone: {addr.phone}</span>
                              </span>
                            </div>
                          );
                        } catch {
                          return <span className="text-slate-400">Failed to render address.</span>;
                        }
                      })()}
                    </div>
                  </div>
                </div>

                {/* Status Details Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2.5 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Customer Name</span>
                    <span className="font-bold text-slate-800">{selectedOrder.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Phone</span>
                    <span className="font-bold text-slate-800">{selectedOrder.customer?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-bold text-slate-800">{paymentMethodLabel(selectedOrder.paymentMethod)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status</span>
                    <span className={`font-bold  ${
                      selectedOrder.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      {paymentStatusLabel(selectedOrder.paymentStatus, selectedOrder.paymentMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Mode</span>
                    <span className="font-bold text-slate-800">{deliveryTypeLabel(selectedOrder.deliveryType)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/60 shadow-sm text-center text-slate-400 font-semibold">
            No order selected.
          </div>
        )}
      </div>

      {/* High-Quality Printable GST Tax Invoice Template */}
      {selectedOrder && (
        <div id="printable-invoice" className="hidden">
          <div className="flex flex-col gap-6 font-sans text-black">
            {/* 1. Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">GOODWILL ELECTRICAL WORLD</h1>
                <p className="text-xs font-bold text-slate-600 mt-0.5">Authorised Dealer: Electrical, Plumbing, Sanitary Wares &amp; Bath Fittings</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">Palakkad - Ponnani Highway, Opp. Kulappully Bus Stand, Shoranur, Kerala - 679122</p>
                <p className="text-[11px] font-bold text-slate-700 mt-0.5">Mob: 9744164444 • 9961898888 • 9544554555 | GSTIN: 32AAAAA0000A1Z5</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="bg-slate-950 text-white font-bold text-xs uppercase px-3 py-1 rounded">GST TAX INVOICE</span>
                <span className="text-xs font-bold text-slate-700 mt-2">Original for Recipient</span>
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
                <div className="font-bold text-ink"><span className="text-slate-500 font-normal">Invoice No:</span> #{selectedOrder.orderNumber}</div>
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
                {selectedOrder.items.map((item: any, idx: number) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <span className="font-bold text-ink">{item.productName}</span>
                      {item.variantName && <span className="text-[11px] text-slate-500 ml-2 font-bold">({item.variantName})</span>}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right">₹{item.price}</td>
                    <td className="py-2.5 px-3 text-right font-bold">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 4. Financial Calculations Grid */}
            <div className="flex justify-between items-start border-t border-slate-200 pt-4">
              <div className="text-[11px] text-slate-500 font-medium max-w-xs flex flex-col gap-1">
                <div className="font-bold text-slate-800 uppercase">Terms &amp; Conditions:</div>
                <div>1. Goods once sold can be exchanged/returned within 7 days along with original Tax Invoice.</div>
                <div>2. Warranty claims as per brand manufacturer terms (Jaquar, Legrand, Supreme, CERA).</div>
                <div>3. All disputes subject to Shoranur Jurisdiction.</div>
              </div>

              <div className="w-64 flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>Taxable Amount</span>
                  {/* Prices are GST-inclusive: split the discounted goods value into taxable + 18% GST */}
                  <span>₹{formatINR(Math.round(((selectedOrder.subtotal - selectedOrder.discount) / 1.18) * 100) / 100)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>CGST (9%)</span>
                  <span>₹{formatINR(Math.round((((selectedOrder.subtotal - selectedOrder.discount) * 18) / 118 / 2) * 100) / 100)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>SGST (9%)</span>
                  <span>₹{formatINR(Math.round((((selectedOrder.subtotal - selectedOrder.discount) * 18) / 118 / 2) * 100) / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Freight / Delivery</span>
                  <span>₹{selectedOrder.deliveryCharge}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-bold text-ink">
                  <span>GRAND TOTAL</span>
                  <span className="text-base">₹{selectedOrder.total}</span>
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
