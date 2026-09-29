import React from "react";
import ProductsManagementClient from "./ProductsManagementClient";
import { getAdminProductsList, getCategories, getBrands } from "@/lib/actions";

export const revalidate = 0; // Fresh stock listings

export default async function AdminProductsPage() {
  // Fetch lists from database
  const [products, categories, brands] = await Promise.all([
    getAdminProductsList(),
    getCategories(),
    getBrands(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Inventory Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor stock levels, edit prices and quantities inline, and manage standard categories.
        </p>
      </div>

      <ProductsManagementClient
        products={products}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
