import React from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
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
      <AdminPageHeader title="Inventory" description="Edit prices and stock inline, hide or feature products, and import or export CSV." />

      <ProductsManagementClient
        products={products}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
