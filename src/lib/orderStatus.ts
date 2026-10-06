// Order lifecycle shared by checkout, tracking, the account page and admin.

export const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "READY_FOR_PICKUP",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped", // legacy rows
  OUT_FOR_DELIVERY: "Out for delivery",
  READY_FOR_PICKUP: "Ready for pickup",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

// Final step reads "Picked up" for store pickups
export function statusLabel(status: string, deliveryType?: string | null) {
  if (status === "DELIVERED" && deliveryType === "pickup") return "Picked up";
  return STATUS_LABELS[status] ?? status;
}

// What the customer sees under each step when there's no custom note
export const STATUS_HINTS: Record<string, string> = {
  PLACED: "We've received your order and are checking stock.",
  CONFIRMED: "Stock reserved. We'll pack it shortly.",
  PACKED: "Packed at our Kulappully showroom.",
  OUT_FOR_DELIVERY: "On the way to your address.",
  READY_FOR_PICKUP: "Ready at the showroom, opposite Kulappully bus stand.",
  DELIVERED: "Handed over. Thank you for shopping with us!",
  CANCELLED: "This order was cancelled. Nothing will be charged.",
  RETURNED: "Items returned to the showroom.",
};

export function orderSteps(deliveryType: string | null | undefined): OrderStatus[] {
  return deliveryType === "pickup"
    ? ["PLACED", "CONFIRMED", "PACKED", "READY_FOR_PICKUP", "DELIVERED"]
    : ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
}

// Customers can cancel online until the order is packed
export const CUSTOMER_CANCELLABLE: string[] = ["PLACED", "CONFIRMED"];

export function isClosed(status: string) {
  return status === "DELIVERED" || status === "CANCELLED" || status === "RETURNED";
}

export const STATUS_BADGE: Record<string, string> = {
  PLACED: "bg-gold/10 text-gold-dark border-gold/30",
  CONFIRMED: "bg-sky-50 text-sky-700 border-sky-200",
  PACKED: "bg-sky-50 text-sky-700 border-sky-200",
  OUT_FOR_DELIVERY: "bg-indigo-50 text-indigo-700 border-indigo-200",
  READY_FOR_PICKUP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  RETURNED: "bg-slate-100 text-slate-500 border-slate-200",
};
