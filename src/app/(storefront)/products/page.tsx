import React from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import ProductListingClient from "@/components/storefront/ProductListingClient";
import { getProducts, getCategories, getBrands } from "@/lib/actions";

interface SearchParams {
  search?: string;
  category?: string;
  brand?: string;
  discount?: string;
}

export const revalidate = 0; // Fresh fetch for listings

export const metadata: Metadata = {
  title: "Shop Electrical, Plumbing & Sanitary Ware | Goodwill Electrical World",
  description: "Browse genuine switches, wires, pipes, sanitaryware and bath fittings at wholesale prices. GST invoice and local delivery.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Load the full active catalogue; filtering happens on the client so every filter
  // (including switching category) works without another round-trip
  const [products, categories, brands] = await Promise.all([getProducts({}), getCategories(), getBrands()]);

  const activeCategory = categories.find((c) => c.slug === params.category);
  const title = params.discount === "true" ? "Offers" : activeCategory?.name ?? "All products";

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <PageHeader
        eyebrow="Catalogue"
        title={title}
        accent={params.discount === "true" ? "on genuine brands." : "at wholesale price."}
        description="Genuine electrical, plumbing and sanitary products — prices include GST."
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "Products" }]}
      />
      <ProductListingClient
        // Remount when the URL filters change so header / category links reset the state
        key={`${params.category ?? ""}|${params.brand ?? ""}|${params.search ?? ""}|${params.discount ?? ""}`}
        initialProducts={products}
        categories={categories}
        brands={brands}
        initialCategory={params.category}
        initialBrand={params.brand}
        initialSearch={params.search}
        initialOffersOnly={params.discount === "true"}
      />
      <Footer />
    </div>
  );
}
