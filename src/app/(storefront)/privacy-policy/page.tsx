import type { Metadata } from "next";
import PolicyPage from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Goodwill Electrical World",
  description: "How Goodwill Electrical World collects, uses and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="We collect only the information needed to process your orders and enquiries, and we never sell it. This page explains what we collect and how we use it."
      current="/privacy-policy"
      sections={[
        {
          id: "collect",
          title: "Information we collect",
          body: (
            <ul>
              <li><strong>Order details:</strong> your name, phone number, email (optional), delivery address, pincode and the items you order.</li>
              <li><strong>Enquiries:</strong> details you send through the bulk / BOQ quote form, WhatsApp, phone or email, such as project name and material lists.</li>
              <li><strong>Account sign-in:</strong> if you sign in, your name, email and profile photo as shared by the sign-in provider.</li>
              <li><strong>Technical data:</strong> basic information your browser sends when visiting the site, such as device type and pages visited.</li>
            </ul>
          ),
        },
        {
          id: "use",
          title: "How we use it",
          body: (
            <ul>
              <li>To confirm, pack, deliver and support your orders, and to issue GST invoices.</li>
              <li>To reply to quotes and enquiries and to contact you about your order by phone or WhatsApp.</li>
              <li>To keep sales, tax and warranty records as required by law.</li>
              <li>To improve our product range, stock and website.</li>
            </ul>
          ),
        },
        {
          id: "browser",
          title: "Cookies & browser storage",
          body: (
            <ul>
              <li>Your shopping cart and sign-in status are saved in your own browser (local storage) so they are kept between visits. You can clear them anytime from your browser settings.</li>
              <li>Staff areas use a secure, essential cookie to keep authorised staff signed in.</li>
              <li>We do not use advertising or tracking cookies.</li>
              <li>Embedded Google Maps on our pages may set their own cookies under Google&rsquo;s privacy policy.</li>
            </ul>
          ),
        },
        {
          id: "share",
          title: "Who we share it with",
          body: (
            <ul>
              <li>Our staff and delivery team, only as needed to fulfil your order.</li>
              <li>Manufacturers or their service centres, when you ask us to help with a warranty claim.</li>
              <li>Payment providers, if you choose to pay online.</li>
              <li>Government authorities, when required by law (for example GST records).</li>
            </ul>
          ),
        },
        {
          id: "security",
          title: "How we protect it",
          body: (
            <p>
              Order and customer records are stored in our secured systems and are accessible only to authorised staff with individual logins. No method of storage or transmission is completely secure, but we take reasonable steps to protect your information from loss and misuse.
            </p>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          body: (
            <p>
              We keep order and invoice records for as long as required under GST and other applicable laws, and enquiry details for as long as they are useful to serve you. After that, they are deleted or anonymised.
            </p>
          ),
        },
        {
          id: "rights",
          title: "Your choices & rights",
          body: (
            <ul>
              <li>You can ask to see, correct or update the personal information we hold about you.</li>
              <li>You can ask us to delete information we are not legally required to keep.</li>
              <li>You can ask us to stop contacting you about offers at any time.</li>
              <li>To make a request, contact us using the details below. We may need to verify your identity first.</li>
            </ul>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: <p>This website is intended for adults making purchases. We do not knowingly collect information from children.</p>,
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: (
            <p>
              We may update this policy as our services change. The latest version is always on this page, with the date it was last updated shown above.
            </p>
          ),
        },
      ]}
    />
  );
}
