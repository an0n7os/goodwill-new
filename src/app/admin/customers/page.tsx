import React from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getCustomersAdmin } from "@/lib/actions";
import CustomersManagementClient from "./CustomersManagementClient";

export const revalidate = 0; // Fresh database fetches

export default async function AdminCustomersPage() {
  const customers = await getCustomersAdmin();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Customers" description="Customer profiles, order history and quick call / WhatsApp." />

      <CustomersManagementClient customers={customers} />
    </div>
  );
}
