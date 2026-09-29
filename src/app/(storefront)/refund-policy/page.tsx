import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Returns & Refunds | Goodwill Electrical World",
  description: "Return, exchange, cancellation and refund policy for Goodwill Electrical World.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Customer care"
      title="Returns & Refunds"
      intro="Bought the wrong size or too many? Unused items can be returned or exchanged within 7 days with the original tax invoice."
      current="/refund-policy"
      sections={[
        {
          id: "window",
          title: "7-day return & exchange",
          body: (
            <ul>
              <li>Unused products in their original, undamaged packaging can be returned or exchanged within <strong>7 days</strong> of delivery or purchase.</li>
              <li>The <strong>original GST tax invoice</strong> must be presented with the return.</li>
              <li>Returns are checked at our showroom. Items must be complete with all accessories, manuals and fittings.</li>
            </ul>
          ),
        },
        {
          id: "not-returnable",
          title: "Items that can't be returned",
          body: (
            <ul>
              <li>Products that have been installed, fitted, cut, glued, wired or used.</li>
              <li>Wires, cables, pipes and hoses cut to a custom length.</li>
              <li>Special-order or made-to-order items procured specifically for you.</li>
              <li>Products with damaged, missing or tampered packaging, labels or serial numbers.</li>
              <li>Clearance or offer items marked as non-returnable at the time of sale.</li>
            </ul>
          ),
        },
        {
          id: "damaged",
          title: "Damaged, defective or wrong items",
          body: (
            <ul>
              <li>Please check your goods at the time of delivery or pickup. Report breakage, missing items or a wrong product within <strong>48 hours</strong>, with photos if possible.</li>
              <li>Verified cases are replaced or refunded at no cost to you, including any delivery charge.</li>
              <li>
                Manufacturing defects found after installation are handled under the manufacturer&rsquo;s warranty — see{" "}
                <Link href="/warranty">Warranty Support</Link>.
              </li>
            </ul>
          ),
        },
        {
          id: "cancel",
          title: "Cancelling an order",
          body: (
            <ul>
              <li>You can cancel free of charge any time before the order is dispatched — call or WhatsApp us with your order number.</li>
              <li>Once goods are dispatched, the order is treated as a return and the rules above apply.</li>
              <li>Bulk or special-order items procured for your project may not be cancellable once ordered from the manufacturer; this is stated on your quote.</li>
            </ul>
          ),
        },
        {
          id: "refunds",
          title: "How refunds are paid",
          body: (
            <ul>
              <li>Approved refunds are paid by the same method used for payment: cash or UPI for cash-on-delivery and showroom purchases, and back to the original account for online payments.</li>
              <li>We aim to process approved refunds within <strong>7 working days</strong>. Bank processing times may add a few days.</li>
              <li>Delivery charges are refunded only when the return is due to our error or a defective product.</li>
              <li>Store credit or an exchange can be offered instead of a refund if you prefer.</li>
            </ul>
          ),
        },
        {
          id: "how",
          title: "How to request a return",
          body: (
            <ul>
              <li>Contact us on WhatsApp <a href="https://wa.me/919744164444">97441 64444</a> or call 95445 54555 with your order or invoice number.</li>
              <li>Bring the item and invoice to the showroom, or ask us to arrange a pickup within our delivery area.</li>
              <li>We inspect the item and confirm the exchange or refund.</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
