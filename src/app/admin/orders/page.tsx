import React from "react";
import OrdersManagementClient from "./OrdersManagementClient";
import { getAdminOrdersList } from "@/lib/actions";

export const revalidate = 0; // Live order updates

export default async function AdminOrdersPage() {
  const orders = await getAdminOrdersList();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Manage Orders
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track order timelines, update dispatch states, and print customer invoices.
        </p>
      </div>

      <OrdersManagementClient initialOrders={orders} />
    </div>
  );
}
