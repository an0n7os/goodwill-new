import React from "react";
import { getCatalogSetup } from "@/lib/adminActions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CatalogClient from "./CatalogClient";

export const revalidate = 0;

export default async function AdminCatalogPage() {
  const { categories, brands } = await getCatalogSetup().catch(() => ({ categories: [], brands: [] }));
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Categories & Brands" description="Organise how products are grouped and filtered on the website." />
      <CatalogClient categories={categories} brands={brands} />
    </div>
  );
}
