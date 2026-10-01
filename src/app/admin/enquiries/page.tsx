import React from "react";
import EnquiriesPipelineClient from "./EnquiriesPipelineClient";
import { getAdminEnquiriesList } from "@/lib/actions";

export const revalidate = 0; // Live CRM pipeline updates

export default async function AdminEnquiriesPage() {
  const enquiries = await getAdminEnquiriesList();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Customer Enquiries
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor contractor quote requests, manage leads, and initiate follow-ups.
        </p>
      </div>

      <EnquiriesPipelineClient enquiries={enquiries} />
    </div>
  );
}
