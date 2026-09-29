import React from "react";
import { getCustomersAdmin } from "@/lib/actions";
import CustomersManagementClient from "./CustomersManagementClient";

export const revalidate = 0; // Fresh database fetches

export default async function AdminCustomersPage() {
  const customers = await getCustomersAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Customer Directory &amp; History
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View customer profiles, total purchases, order history, and direct phone/WhatsApp contacts.
        </p>
      </div>

      <CustomersManagementClient customers={customers} />
    </div>
  );
}
