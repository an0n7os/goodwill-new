// Single source of truth for cart / checkout / order totals.
// Used by the cart and checkout pages for display, and by createOrder on the
// server, which recomputes everything from DB prices and ignores client totals.

export const FREE_DELIVERY_THRESHOLD = 1000;
export const DELIVERY_CHARGE = 80;
export const DEFAULT_GST_RATE = 18;

export interface PricingCoupon {
  type: string; // percentage | flat | free_delivery
  value: number;
  maxDiscount?: number | null;
}

export interface PricingLine {
  price: number; // unit price, GST inclusive
  quantity: number;
  gstRate?: number | null;
}

export interface PricingInput {
  lines: PricingLine[];
  coupon?: PricingCoupon | null;
  deliveryType?: "delivery" | "pickup" | string;
}

export interface PricingResult {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  gstAmount: number; // GST already contained in the prices (for display / invoice)
  total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeTotals({ lines, coupon, deliveryType = "delivery" }: PricingInput): PricingResult {
  const subtotal = lines.reduce((acc, l) => acc + l.price * l.quantity, 0);

  let discount = 0;
  if (coupon?.type === "percentage") {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon?.type === "flat") {
    discount = coupon.value;
  }
  discount = Math.min(Math.max(discount, 0), subtotal);

  const qualifiesForFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD || coupon?.type === "free_delivery";
  const deliveryCharge =
    deliveryType === "pickup" || lines.length === 0 || qualifiesForFreeDelivery ? 0 : DELIVERY_CHARGE;

  // Prices are GST-inclusive: extract the tax portion of each line after its share of the discount
  const discountRatio = subtotal > 0 ? (subtotal - discount) / subtotal : 0;
  const gstAmount = lines.reduce((acc, l) => {
    const rate = l.gstRate ?? DEFAULT_GST_RATE;
    const lineNet = l.price * l.quantity * discountRatio;
    return acc + (lineNet * rate) / (100 + rate);
  }, 0);

  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    deliveryCharge,
    gstAmount: round2(gstAmount),
    total: round2(Math.max(0, subtotal - discount + deliveryCharge)),
  };
}

// ₹ amounts in Indian grouping; shows paise only when there are any (e.g. 3,450 / 1,234.50)
export function formatINR(amount: number): string {
  const n = Number(amount) || 0;
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

// Products saved with price 0 are shown as "Price on request" (no cart / checkout)
export function isPriceOnRequest(price: number | null | undefined): boolean {
  return !price || price <= 0;
}
