import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/legal/PolicyPage";
import { DELIVERY_CHARGE, FREE_DELIVERY_THRESHOLD, formatINR } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Delivery Policy | Goodwill Electrical World",
  description: "Delivery areas, charges, timelines and store pickup for Goodwill Electrical World, Kulappully.",
};

export default function DeliveryPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Customer care"
      title="Delivery Policy"
      intro={`Free local delivery on orders of ₹${formatINR(FREE_DELIVERY_THRESHOLD)} and above, straight to your home or construction site.`}
      current="/delivery-policy"
      sections={[
        {
          id: "areas",
          title: "Where we deliver",
          body: (
            <>
              <p>We deliver with our own vehicles across our local service area, including:</p>
              <ul>
                <li>Shoranur and Kulappully</li>
                <li>Cheruthuruthy and Vaniamkulam</li>
                <li>Ottapalam and Pattambi</li>
              </ul>
              <p>
                For locations outside this area or large project loads, contact us — we can often arrange delivery on request.
              </p>
            </>
          ),
        },
        {
          id: "charges",
          title: "Delivery charges",
          body: (
            <ul>
              <li>Orders of <strong>₹{formatINR(FREE_DELIVERY_THRESHOLD)} or more</strong>: free delivery within our local area.</li>
              <li>Orders below ₹{formatINR(FREE_DELIVERY_THRESHOLD)}: a flat delivery charge of <strong>₹{formatINR(DELIVERY_CHARGE)}</strong>.</li>
              <li>Store pickup is always free.</li>
              <li>Bulk and project orders may have delivery arranged as part of the quote.</li>
              <li>The exact charge is shown in your cart and at checkout before you place the order.</li>
            </ul>
          ),
        },
        {
          id: "timelines",
          title: "Delivery timelines",
          body: (
            <ul>
              <li>In-stock orders are usually dispatched the <strong>same day or next working day</strong> after confirmation.</li>
              <li>We deliver Monday to Saturday. Orders placed on Sunday or a holiday are processed on the next working day.</li>
              <li>Special-order items, bulk quantities or items not in stock take longer — we will tell you the expected date when confirming.</li>
              <li>You can follow progress on the <Link href="/track-order">Track Order</Link> page.</li>
            </ul>
          ),
        },
        {
          id: "pickup",
          title: "Store pickup",
          body: (
            <p>
              Choose &ldquo;Pickup&rdquo; at checkout and collect your order from our showroom opp. Kulappully Bus Stand, Monday to Saturday, 8:00 AM – 8:00 PM. Please bring your order number and the phone number used for the order.
            </p>
          ),
        },
        {
          id: "receiving",
          title: "Receiving your order",
          body: (
            <ul>
              <li>Someone should be available at the address to receive the goods and make payment for cash-on-delivery orders.</li>
              <li>Please check the items and quantities when they are handed over, and report any damage or shortage within 48 hours.</li>
              <li>Our team unloads at the nearest accessible point on site. Carrying material to upper floors or distant spots is not included unless agreed in advance.</li>
              <li>If delivery fails because no one is available or the address is incorrect, re-delivery may be charged.</li>
            </ul>
          ),
        },
        {
          id: "returns",
          title: "Returns",
          body: (
            <p>
              For returns, exchanges and refunds, please see our <Link href="/refund-policy">Returns &amp; Refunds</Link> policy.
            </p>
          ),
        },
      ]}
    />
  );
}
