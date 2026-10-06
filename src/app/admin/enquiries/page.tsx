import React from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EnquiriesPipelineClient from "./EnquiriesPipelineClient";
import { getAdminEnquiriesList } from "@/lib/actions";

export const revalidate = 0; // Live CRM pipeline updates

export default async function AdminEnquiriesPage() {
  const enquiries = await getAdminEnquiriesList();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Enquiries" description="Bulk quote requests from contractors and builders." />

      <EnquiriesPipelineClient enquiries={enquiries} />
    </div>
  );
}
