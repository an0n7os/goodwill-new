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
  deliveryPolicy?: {charge:number;freeAbove:number|null};
}

export interface PricingResult {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  gstAmount: number; // GST already contained in the prices (for display / invoice)
  total: number;
}

const round2 = (n: number) => Math.round((n+Number.EPSILON) * 100) / 100;

export function computeTotals({ lines, coupon, deliveryType = "delivery", deliveryPolicy }: PricingInput): PricingResult {
  const subtotal = round2(lines.reduce((acc, l) => acc + round2(l.price * l.quantity), 0));

  let discount = 0;
  if (coupon?.type === "percentage") {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon?.type === "flat") {
    discount = coupon.value;
  }
  discount = Math.min(Math.max(discount, 0), subtotal);

  const threshold=deliveryPolicy ? deliveryPolicy.freeAbove : FREE_DELIVERY_THRESHOLD;
  const qualifiesForFreeDelivery = (threshold!==null&&subtotal >= threshold) || coupon?.type === "free_delivery";
  const deliveryCharge =
    deliveryType === "pickup" || lines.length === 0 || qualifiesForFreeDelivery ? 0 : (deliveryPolicy?.charge??DELIVERY_CHARGE);

  // Prices are GST-inclusive: extract the tax portion of each line after its share of the discount
  const discountRatio = subtotal > 0 ? (subtotal - discount) / subtotal : 0;
  const gstAmount = lines.reduce((acc, l) => {
    const rate = l.gstRate ?? DEFAULT_GST_RATE;
    const lineNet = round2(l.price * l.quantity) * discountRatio;
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

// Allocate a discounted invoice total in paise without inventing or losing a
// penny. Stable ids make return entitlements independent of return order.
export function allocateNetLines(lines:{id:string;total:number}[],discount:number){
 const amounts=lines.map(l=>Math.round(l.total*100)),sum=amounts.reduce((s,n)=>s+n,0),net=Math.max(0,sum-Math.round(discount*100));
 const allocations=lines.map((line,i)=>{const exact=sum?amounts[i]*net/sum:0;return {id:line.id,paise:Math.floor(exact),fraction:exact-Math.floor(exact)};});
 let remaining=net-allocations.reduce((s,l)=>s+l.paise,0);
 for(const line of [...allocations].sort((a,b)=>b.fraction-a.fraction||a.id.localeCompare(b.id))){if(remaining<=0)break;line.paise++;remaining--;}
 return new Map(allocations.map(l=>[l.id,l.paise/100]));
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
