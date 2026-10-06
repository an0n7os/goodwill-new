"use client";

import { Printer, X } from "lucide-react";
import { formatINR } from "@/lib/pricing";
import { paymentStatusLabel, deliveryTypeLabel } from "@/lib/orderLabels";
import { useDialog } from "@/lib/useDialog";

// Anything with these fields can be printed: admin orders and customer-tracked orders
export interface PrintableOrder {
  orderNumber: string;
  createdAt: Date | string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: string;
  deliveryType: string;
  customer: { name: string; phone: string };
  items: { id: string; productName: string; variantName: string | null; quantity: number; total: number }[];
  subtotal: number;
  discount: number;
  gstAmount: number;
  deliveryCharge: number;
  total: number;
}

export default function OrderSummaryModal({ isOpen, onClose, order }: {
  isOpen: boolean; onClose: () => void; order: PrintableOrder | null;
}) {
  const dialogRef = useDialog(isOpen, onClose);
  if (!isOpen || !order) return null;
  let address: { line1?: string; city?: string; pincode?: string } = {};
  try { address = JSON.parse(order.shippingAddress); } catch { /* Legacy orders may have no address snapshot. */ }
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="order-summary-title" className="fixed inset-0 z-[80] overflow-y-auto bg-ink/60 p-4 flex items-start justify-center" onClick={onClose}>
      <div ref={dialogRef} className="my-6 w-full max-w-3xl bg-white rounded-3xl shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-ink/10 print:hidden">
          <h2 id="order-summary-title" className="font-semibold">Order summary</h2>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="btn-dark !px-4 !py-2"><Printer size={16} /> Print / Save PDF</button>
            <button aria-label="Close order summary" onClick={onClose} className="p-3 rounded-full hover:bg-paper"><X size={18} /></button>
          </div>
        </div>
        <div id="printable-invoice" className="p-6 sm:p-10 text-ink">
          <h3 className="text-2xl font-semibold">Goodwill Electrical World</h3>
          <p className="text-sm text-slate-500 mt-2">Opp. Kulappully Bus Stand, Shoranur · 97441 64444</p>
          <p className="mt-5 font-semibold">{order.orderNumber}</p>
          <p className="text-sm mt-1">{new Date(order.createdAt).toLocaleDateString("en-IN")} · {paymentStatusLabel(order.paymentStatus, order.paymentMethod)}</p>
          <div className="my-6 p-4 bg-paper rounded-2xl text-sm">
            <p className="font-semibold">{order.customer.name}</p><p>{order.customer.phone}</p>
            <p>{[address.line1, address.city, address.pincode].filter(Boolean).join(", ")}</p>
            <p className="mt-2">{deliveryTypeLabel(order.deliveryType)}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b border-ink/10"><th className="py-3">Product</th><th className="px-3">Qty</th><th className="text-right">Total</th></tr></thead>
              <tbody>{order.items.map((item) => <tr key={item.id} className="border-b border-ink/10"><td className="py-3">{item.productName}{item.variantName ? ` (${item.variantName})` : ""}</td><td className="px-3">{item.quantity}</td><td className="text-right whitespace-nowrap">₹{formatINR(item.total)}</td></tr>)}</tbody>
            </table>
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            {[ ["Subtotal", order.subtotal], ["Discount", -order.discount], ["GST included", order.gstAmount], ["Delivery", order.deliveryCharge], ["Total", order.total] ].map(([label, amount]) => <div key={String(label)} className="flex justify-between"><dt>{label}</dt><dd className="font-semibold">₹{formatINR(Number(amount))}</dd></div>)}
          </dl>
          <p className="mt-6 text-xs text-slate-500">Order summary. Collect your official GST tax invoice from the showroom. Returns follow our published refund policy.</p>
        </div>
      </div>
    </div>
  );
}
