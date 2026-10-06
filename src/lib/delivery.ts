// Shared by the product checker, checkout and server-side order validation.
export function deliveryEstimate(pincode: string) {
  if (!/^\d{6}$/.test(pincode)) return null;
  const pin = Number(pincode);
  if ([679121, 679122, 679123, 679531].includes(pin)) return "usually same or next working day";
  if (pin >= 679101 && pin <= 679599) return "usually 1–2 working days";
  return null;
}
