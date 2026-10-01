// Human-friendly labels for order fields stored as raw codes in the DB

export function paymentStatusLabel(status: string | null | undefined, paymentMethod?: string | null): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return paymentMethod === "cod" ? "Pay on delivery" : "Awaiting payment";
    case "refund_due":
      return "Refund due";
    case "cancelled":
    case "failed": // older cancelled orders were stored as "failed"
      return "Not charged";
    default:
      return status ?? "—";
  }
}

export function paymentMethodLabel(method: string | null | undefined): string {
  if (method === "cod") return "Cash on delivery";
  if (method === "razorpay") return "Online payment";
  return method ?? "—";
}

export function deliveryTypeLabel(type: string | null | undefined): string {
  if (type === "pickup") return "Store pickup";
  if (type === "delivery") return "Home / site delivery";
  return type ?? "—";
}
