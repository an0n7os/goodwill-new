import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Warranty Support | Goodwill Electrical World",
  description: "Manufacturer warranty support for products bought from Goodwill Electrical World.",
};

export default function WarrantyPage() {
  return (
    <PolicyPage
      eyebrow="Customer care"
      title="Warranty Support"
      intro="Every product we sell is genuine and carries the official manufacturer's warranty. If something goes wrong, we help you get it resolved."
      current="/warranty"
      sections={[
        {
          id: "coverage",
          title: "What's covered",
          body: (
            <ul>
              <li>Warranty is provided by the <strong>manufacturer</strong> (for example Legrand, Jaquar, Supreme, Finolex, CERA, Philips) as per their terms for each product.</li>
              <li>The warranty period and coverage depend on the brand and product and are stated on the packaging, warranty card or the manufacturer&rsquo;s website.</li>
              <li>Because we sell only genuine, factory-sourced products, manufacturer warranties are fully valid on purchases from us.</li>
            </ul>
          ),
        },
        {
          id: "keep",
          title: "What to keep",
          body: (
            <ul>
              <li>Your <strong>GST tax invoice</strong> from Goodwill Electrical World — it is your proof of purchase.</li>
              <li>The warranty card, if one is supplied, and any registration details required by the brand.</li>
              <li>Product packaging and labels where possible, as some brands need the serial or batch number.</li>
            </ul>
          ),
        },
        {
          id: "claim",
          title: "How to make a claim",
          body: (
            <ul>
              <li>Contact us on WhatsApp <a href="https://wa.me/919744164444">97441 64444</a> with your invoice number, a photo of the product and a short description of the problem.</li>
              <li>For many brands we can raise the complaint with the authorised service centre for you. Some brands handle claims directly through their customer care.</li>
              <li>Repair, replacement or other remedies are decided by the manufacturer under their warranty terms.</li>
            </ul>
          ),
        },
        {
          id: "exclusions",
          title: "Usually not covered",
          body: (
            <ul>
              <li>Damage from incorrect installation, or installation not done by a qualified electrician or plumber.</li>
              <li>Voltage fluctuation, lightning, excess water pressure, hard-water scaling or other site conditions outside the product&rsquo;s rating.</li>
              <li>Physical damage, misuse, modification or normal wear and tear.</li>
              <li>Consumable parts as defined by the manufacturer.</li>
            </ul>
          ),
        },
        {
          id: "returns",
          title: "Defects on arrival",
          body: (
            <p>
              If a product is damaged or defective when you receive it, report it within 48 hours and we will replace it directly — see our{" "}
              <Link href="/refund-policy">Returns &amp; Refunds</Link> policy.
            </p>
          ),
        },
      ]}
    />
  );
}
