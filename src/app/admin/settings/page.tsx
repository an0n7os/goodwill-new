import React from "react";
import Link from "next/link";
import { getAdminUsers } from "@/lib/adminActions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SettingsClient from "./SettingsClient";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const data = await getAdminUsers().catch(() => null);
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Settings" description="Your password and the staff who can sign in to this panel." />
      <details className="rounded-2xl border border-ink/10 bg-white p-5">
        <summary className="cursor-pointer font-semibold">More shop options</summary>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ["Shop operations", "/admin/operations"],
            ...(["owner", "manager"].includes(data?.me?.role || "") ? [["Categories & brands", "/admin/catalog"]] : []),
            ...(data?.me?.role === "owner" ? [["Customer emails", "/admin/messages"], ["Payments & refunds", "/admin/payments"]] : []),
          ].map(([name, href]) => <Link key={href} href={href} className="rounded-xl border border-ink/10 px-4 py-3 text-sm hover:bg-paper">{name}</Link>)}
        </div>
      </details>
      <SettingsClient me={data?.me ?? null} users={data?.users ?? []} />
    </div>
  );
}
