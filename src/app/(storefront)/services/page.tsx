import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import ServiceBookingClient from "./ServiceBookingClient";

export const metadata: Metadata = {
  title: "Book Installation & Trade Services | Goodwill Electrical World",
  description:
    "Book certified local electricians and plumbers in Kulappully, Shoranur, Ottapalam, and Pattambi for sanitary fittings, electrical wiring, and water heater installation.",
};

export const revalidate = 0;

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <PageHeader
        width="7xl"
        eyebrow="Certified Tradesmen"
        title="Installation &"
        accent="services."
        description="Book verified plumbers and electricians for your home or commercial site in Kulappully and nearby Kerala regions."
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "Services & Booking" }]}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-grow">
        <ServiceBookingClient />
      </main>

      <Footer />
    </div>
  );
}
