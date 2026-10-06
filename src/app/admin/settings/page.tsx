import React from "react";
import { getAdminUsers } from "@/lib/adminActions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SettingsClient from "./SettingsClient";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const data = await getAdminUsers().catch(() => null);
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Settings" description="Your password and the staff who can sign in to this panel." />
      <SettingsClient me={data?.me ?? null} users={data?.users ?? []} />
    </div>
  );
}
