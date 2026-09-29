"use client";

import React from "react";
import { Printer, X, ShieldCheck, Sparkles } from "lucide-react";

interface OrderItem {
  id?: string;
  name?: string;
  product?: { name: string; brand?: { name: string } };
  quantity: number;
  price: number;
  total?: number;
  variantName?: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  paymentStatus?: string;
  name: string;
  phone: string;
  email?: string;
  line1: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  total: number;
}

interface GSTInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderData | null;
}

export default function GSTInvoiceModal({ isOpen, onClose, order }: GSTInvoiceModalProps) {
  if (!isOpen || !order) return null;

  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const grandTotal = order.total || 0;
  // Reverse calculation for GST breakdown (assuming 18% GST included)
  const taxableAmount = Math.round((grandTotal / 1.18) * 100) / 100;
  const totalGst = Math.round((grandTotal - taxableAmount) * 100) / 100;
  const cgst = Math.round((totalGst / 2) * 100) / 100;
  const sgst = Math.round((totalGst / 2) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Modal Wrapper */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Modal Action Bar (Non-printable) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-gold-light fill-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tax Invoice Preview — #{order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-light hover:bg-gold text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE GST INVOICE CONTAINER */}
        <div id="printable-invoice" className="p-8 sm:p-12 text-slate-800 bg-white font-sans">
          
          {/* Header Block */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase flex items-center gap-1">
                GOODWILL <span className="text-amber-600 font-bold text-sm">ELECTRICAL WORLD</span>
              </h1>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mt-0.5">
                Authorised Wholesale Dealer • Electrical, Plumbing &amp; Sanitaryware
              </p>
              <p className="text-xs text-slate-600 font-medium mt-2 max-w-sm">
                Opposite Kulappully Bus Stand, Kulappully, Shoranur, Palakkad Dist, Kerala - 679122
              </p>
              <p className="text-xs text-slate-700 font-bold mt-1">
                GSTIN: <span className="font-mono text-slate-900">32AABCG1234F1Z8</span> | State Code: <span className="font-mono">32</span> (Kerala)
              </p>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Helpline: +91 9744164444 • +91 9544554555
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end text-left sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-200 w-full sm:w-auto">
              <span className="px-3 py-1 bg-slate-950 text-white font-bold text-xs uppercase tracking-widest rounded mb-2">
                TAX INVOICE
              </span>
              <div className="text-xs font-bold text-slate-800">
                Invoice No: <span className="font-mono font-bold text-ink">INV-{order.orderNumber}</span>
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">
                Date: <span className="font-bold text-slate-800">{invoiceDate}</span>
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">
                Order Ref: <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span>
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">
                Place of Supply: <span className="font-bold text-slate-800">Kerala (32)</span>
              </div>
            </div>
          </div>

          {/* Customer Billed & Shipped To Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                BILLED TO (CUSTOMER)
              </span>
              <h3 className="font-bold text-slate-900 text-sm">{order.name}</h3>
              <p className="text-slate-600 font-semibold mt-0.5">Phone: +91 {order.phone}</p>
              {order.email && <p className="text-slate-600 font-semibold">Email: {order.email}</p>}
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                DELIVERY SITE ADDRESS
              </span>
              <p className="font-bold text-slate-800">{order.line1}</p>
              <p className="text-slate-600 font-semibold">{order.city}, Kerala - {order.pincode}</p>
              <p className="text-[10px] font-bold text-emerald-700 mt-1 uppercase tracking-wider">
                ✓ Direct Site Transport (Kulappully &amp; Shoranur Zone)
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-3 text-center">HSN Code</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Rate</th>
                  <th className="py-3 px-3 text-right">Taxable</th>
                  <th className="py-3 px-3 text-right">GST (18%)</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    const itemName = item.name || item.product?.name || "Hardware Item";
                    const brandName = item.product?.brand?.name || "";
                    const qty = item.quantity || 1;
                    const itemTotal = (item.price || 0) * qty;
                    const itemTaxable = Math.round((itemTotal / 1.18) * 100) / 100;
                    const itemGst = Math.round((itemTotal - itemTaxable) * 100) / 100;

                    // HSN mapping mock
                    const hsn = itemName.toLowerCase().includes("switch")
                      ? "8536"
                      : itemName.toLowerCase().includes("pipe")
                      ? "3917"
                      : itemName.toLowerCase().includes("closet")
                      ? "6910"
                      : "8544";

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{itemName}</div>
                          {brandName && (
                            <span className="text-[9px] font-extrabold text-ink uppercase tracking-wider block">
                              Brand: {brandName} {item.variantName ? `• ${item.variantName}` : ""}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{hsn}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">{qty}</td>
                        <td className="py-3 px-3 text-right font-mono">₹{item.price}</td>
                        <td className="py-3 px-3 text-right font-mono">₹{itemTaxable}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">₹{itemGst}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-950 font-mono">
                          ₹{itemTotal}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-4 px-4 text-center text-slate-400 font-bold">
                      No items listed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Calculations & Bank Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start mb-8">
            
            {/* Left: Payment Info & Bank Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Goodwill Bank Details (NEFT / RTGS)</span>
              </h4>
              <p className="text-slate-600 font-semibold">Account Name: <span className="font-bold text-slate-900">Goodwill Electrical World</span></p>
              <p className="text-slate-600 font-semibold">Bank: <span className="font-bold text-slate-900">Federal Bank, Shoranur Branch</span></p>
              <p className="text-slate-600 font-semibold">Account No: <span className="font-mono font-bold text-slate-900">12340200056789</span></p>
              <p className="text-slate-600 font-semibold">IFSC Code: <span className="font-mono font-bold text-slate-900">FDRL0001234</span></p>
              <p className="text-[10px] text-slate-500 mt-2 italic">
                * Note: Goods once sold can be exchanged within 7 days with original tax invoice.
              </p>
            </div>

            {/* Right: GST Totals */}
            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Taxable Amount</span>
                <span className="font-mono font-bold text-slate-900">₹{taxableAmount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                <span>CGST (9%)</span>
                <span className="font-mono">₹{cgst}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                <span>SGST (9%)</span>
                <span className="font-mono">₹{sgst}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                <span>Total GST (18%)</span>
                <span className="font-mono font-bold text-slate-800">₹{totalGst}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-slate-950 bg-gold-light/20 px-3 rounded-xl border border-gold-light/30 mt-1">
                <span>GRAND TOTAL</span>
                <span className="font-mono text-ink">₹{grandTotal}</span>
              </div>
            </div>

          </div>

          {/* Authorised Signatory Footer */}
          <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-800">Terms &amp; Conditions:</p>
              <p className="text-[10px] leading-relaxed">
                1. 100% Genuine Factory Sealed Items.
                <br />
                2. Subject to Shoranur Jurisdiction.
              </p>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="w-32 border-b border-slate-900 mb-2"></div>
              <p className="font-bold text-slate-900 uppercase">For Goodwill Electrical World</p>
              <p className="text-[10px] text-slate-500 font-bold">Authorised Signatory</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
