import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | Goodwill Electrical World",
  description: "Terms for buying from Goodwill Electrical World, Kulappully, Shoranur — orders, pricing, payment, delivery and liability.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="These terms apply when you browse this website, place an order, request a quote or buy from our showroom. By placing an order you agree to them."
      current="/terms"
      sections={[
        {
          id: "about",
          title: "About us",
          body: (
            <p>
              This website is operated by <strong>Goodwill Electrical World</strong>, Opp. Kulappully Bus Stand,
              Palakkad–Ponnani Highway, Kulappully, Shoranur, Palakkad, Kerala 679122. In these terms,
              &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean Goodwill Electrical World, and &ldquo;you&rdquo; means the customer.
            </p>
          ),
        },
        {
          id: "products",
          title: "Products & availability",
          body: (
            <ul>
              <li>We sell genuine products sourced from manufacturers and their authorised distributors.</li>
              <li>Product photos are for reference. Colour, finish and packaging may vary slightly from the manufacturer&rsquo;s current batch.</li>
              <li>Stock shown online is updated regularly but may change. If an item is unavailable after you order, we will call you to offer an alternative or cancel that item with a full refund of any amount paid for it.</li>
            </ul>
          ),
        },
        {
          id: "pricing",
          title: "Pricing & GST",
          body: (
            <ul>
              <li>All prices are in Indian Rupees and <strong>include GST</strong>. A GST tax invoice is issued for every order.</li>
              <li>MRP is the manufacturer&rsquo;s maximum retail price; our selling price may be lower.</li>
              <li>Prices can change without notice. The price that applies is the one confirmed when your order is placed.</li>
              <li>If an obvious pricing error is found, we may cancel the order and refund any payment made, even after confirmation.</li>
            </ul>
          ),
        },
        {
          id: "orders",
          title: "Orders & confirmation",
          body: (
            <ul>
              <li>An order is accepted only after we confirm it (by phone, WhatsApp or status update). Placing an order is an offer to buy.</li>
              <li>We may decline or limit an order, for example for unusual quantities, incorrect details or suspected misuse.</li>
              <li>You are responsible for giving a correct name, phone number and delivery address.</li>
              <li>
                You can check the status of your order anytime on the <Link href="/track-order">Track Order</Link> page using your order number and phone number.
              </li>
            </ul>
          ),
        },
        {
          id: "bulk",
          title: "Bulk, contractor & BOQ quotes",
          body: (
            <ul>
              <li>Quotes for bulk or project requirements are valid for the period and quantities stated on the quote.</li>
              <li>Quoted prices depend on stock and manufacturer price revisions and are confirmed only when the order is placed.</li>
              <li>Credit terms, if any, are agreed in writing for each customer and are not available by default.</li>
            </ul>
          ),
        },
        {
          id: "payment",
          title: "Payment",
          body: (
            <ul>
              <li>We currently accept <strong>cash on delivery</strong> and payment at the showroom (cash, UPI or card, as available at the counter).</li>
              <li>Where online payment is offered, payment is processed by a third-party payment gateway. We do not store your card or bank details.</li>
              <li>For cash on delivery, please keep the exact order amount ready when goods are handed over.</li>
            </ul>
          ),
        },
        {
          id: "delivery",
          title: "Delivery & pickup",
          body: (
            <p>
              Delivery areas, charges and timelines are explained in our <Link href="/delivery-policy">Delivery Policy</Link>. Risk in the goods passes to you when they are delivered or collected, and you should check the items at that time.
            </p>
          ),
        },
        {
          id: "cancellation",
          title: "Cancellation, returns & warranty",
          body: (
            <p>
              You can cancel an order before it is dispatched. Returns, exchanges and refunds follow our{" "}
              <Link href="/refund-policy">Returns &amp; Refunds</Link> policy, and product warranties are provided by the manufacturer as described in{" "}
              <Link href="/warranty">Warranty Support</Link>.
            </p>
          ),
        },
        {
          id: "installation",
          title: "Installation & safety",
          body: (
            <ul>
              <li>Electrical and plumbing products must be installed by a qualified electrician or plumber, following the manufacturer&rsquo;s instructions and applicable safety codes.</li>
              <li>Advice given by our staff is general guidance. The installer is responsible for correct selection, sizing and installation on site.</li>
            </ul>
          ),
        },
        {
          id: "liability",
          title: "Limitation of liability",
          body: (
            <p>
              To the extent permitted by law, our liability for any order is limited to the amount you paid for the product concerned. We are not liable for indirect losses such as labour costs, loss of use or delays on site, or for damage caused by improper installation, misuse, or voltage and water-pressure conditions outside the product&rsquo;s rating.
            </p>
          ),
        },
        {
          id: "website",
          title: "Use of this website",
          body: (
            <ul>
              <li>Brand names and logos shown on this site belong to their respective owners and are used only to identify the products we sell.</li>
              <li>You must not misuse the website, attempt to access staff areas without permission, or interfere with its operation.</li>
              <li>How we handle your information is explained in our <Link href="/privacy-policy">Privacy Policy</Link>.</li>
            </ul>
          ),
        },
        {
          id: "law",
          title: "Governing law & changes",
          body: (
            <p>
              These terms are governed by the laws of India. Any dispute is subject to the jurisdiction of the courts at Shoranur, Kerala. We may update these terms from time to time; the version published on this page on the date of your order applies.
            </p>
          ),
        },
      ]}
    />
  );
}
