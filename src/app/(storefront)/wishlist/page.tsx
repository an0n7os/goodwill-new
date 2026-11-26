import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import WishlistClient from "./WishlistClient";

export const metadata: Metadata = {
  title: "Saved Favorites | Goodwill Electrical World",
  description: "View and manage your saved electrical, plumbing, and sanitary products.",
};

export const revalidate = 0;

export default function WishlistPage() {
  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <PageHeader
        width="7xl"
        eyebrow="My favorites"
        title="Saved"
        accent="items."
        description="Your bookmarked products are automatically saved and synced to your account."
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "Saved Favorites" }]}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-grow">
        <WishlistClient />
      </main>

      <Footer />
    </div>
  );
}
