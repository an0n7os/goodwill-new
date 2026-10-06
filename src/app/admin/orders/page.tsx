import React from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import OrdersManagementClient from "./OrdersManagementClient";
import { getAdminOrders } from "@/lib/orderActions";

export const revalidate = 0; // Live order updates

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Orders" description="Update order status, track dispatch and print GST invoices." />

      <OrdersManagementClient initialOrders={orders} />
    </div>
  );
}
