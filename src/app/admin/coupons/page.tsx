import React from "react";
import { getCouponsAdmin } from "@/lib/adminActions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CouponsClient from "./CouponsClient";

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const coupons = await getCouponsAdmin().catch(() => []);
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Coupons" description="Discount codes customers can apply in the cart." />
      <CouponsClient coupons={coupons} />
    </div>
  );
}
