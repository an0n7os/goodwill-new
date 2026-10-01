import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetailClient from "@/components/storefront/ProductDetailClient";
import { getProductById, getProducts } from "@/lib/actions";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0; // Fresh product fetch

// Per-product browser title / share preview instead of the generic site title
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductById(slug);
  if (!product) return { title: "Product not found | Goodwill Electrical World" };
  const title = `${product.name}${product.brand ? ` by ${product.brand.name}` : ""} | Goodwill Electrical World`;
  const description =
    product.description?.slice(0, 160) ||
    `Buy genuine ${product.name} at Goodwill Electrical World, Kulappully, Shoranur. GST invoice, local delivery.`;
  const image = product.images?.[0]?.url;
  return { title, description, openGraph: { title, description, images: image ? [image] : undefined } };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch product data
  const product = await getProductById(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products (same category, up to 4 items)
  const allProducts = await getProducts({ category: product.category?.slug });
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      <Footer />
    </div>
  );
}
