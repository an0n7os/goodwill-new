"use client";

import React, { useState, useTransition } from "react";
import type { getAdminUsers } from "@/lib/adminActions";
import { changeAdminPassword, createAdminUserAccount, setAdminUserActive } from "@/lib/adminActions";
import { toast } from "@/components/admin/Toaster";
import { KeyRound, UserPlus, ShieldCheck } from "lucide-react";

type Data = Awaited<ReturnType<typeof getAdminUsers>>;

export default function SettingsClient({ me, users }: { me: Data["me"] | null; users: Data["users"] }) {
  const [isPending, startTransition] = useTransition();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [staff, setStaff] = useState({ name: "", email: "", role: "staff", password: "" });
  const isOwner = me?.role === "owner";

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast.error("New passwords don't match.");
    startTransition(async () => {
      const res = await changeAdminPassword(pw.current, pw.next);
      if (!res.success) return toast.error(res.error);
      toast.success("Password changed.");
      setPw({ current: "", next: "", confirm: "" });
    });
  };

  const submitStaff = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createAdminUserAccount(staff);
      if (!res.success) return toast.error(res.error);
      toast.success(`${staff.name} can now sign in.`);
      setStaff({ name: "", email: "", role: "staff", password: "" });
    });
  };

  const toggleUser = (id: string, isActive: boolean) =>
    startTransition(async () => {
      const res = await setAdminUserActive(id, isActive);
      if (!res.success) return toast.error(res.error);
      toast.success(isActive ? "Account enabled." : "Account disabled.");
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
      <form onSubmit={submitPassword} className="adm-card p-6 lg:col-span-2 flex flex-col gap-3.5">
        <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
          <KeyRound size={15} className="text-gold-dark" /> Change your password
        </h2>
        <div>
          <label className="adm-label">Current password</label>
          <input type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="adm-input" />
        </div>
        <div>
          <label className="adm-label">New password (10+ characters)</label>
          <input type="password" required minLength={10} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="adm-input" />
        </div>
        <div>
          <label className="adm-label">Confirm new password</label>
          <input type="password" required minLength={10} autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="adm-input" />
        </div>
        <button type="submit" disabled={isPending} className="adm-btn self-start mt-1">
          Update password
        </button>
      </form>

      <div className="lg:col-span-3 flex flex-col gap-5">
        <div className="adm-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck size={15} className="text-gold-dark" />
            <h2 className="text-sm font-semibold text-ink">Admin accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="adm-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Last sign-in</th>
                  <th className="!text-right">Access</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium text-ink">
                        {u.name} {u.id === me?.id && <span className="text-xs text-slate-400">(you)</span>}
                      </div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="capitalize text-slate-600">{u.role}</td>
                    <td className="text-slate-500 text-xs">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never"}
                    </td>
                    <td className="text-right">
                      {isOwner && u.id !== me?.id ? (
                        <button
                          onClick={() => toggleUser(u.id, !u.isActive)}
                          disabled={isPending}
                          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded cursor-pointer ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                          title="Click to toggle"
                        >
                          {u.isActive ? "Enabled" : "Disabled"}
                        </button>
                      ) : (
                        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {u.isActive ? "Enabled" : "Disabled"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isOwner && (
          <form onSubmit={submitStaff} className="adm-card p-6 grid grid-cols-2 gap-3">
            <h2 className="col-span-2 text-sm font-semibold text-ink flex items-center gap-2">
              <UserPlus size={15} className="text-gold-dark" /> Add staff account
            </h2>
            <div>
              <label className="adm-label">Name</label>
              <input required value={staff.name} onChange={(e) => setStaff({ ...staff, name: e.target.value })} className="adm-input" />
            </div>
            <div>
              <label className="adm-label">Email</label>
              <input type="email" required value={staff.email} onChange={(e) => setStaff({ ...staff, email: e.target.value })} className="adm-input" />
            </div>
            <div>
              <label className="adm-label">Role</label>
              <select value={staff.role} onChange={(e) => setStaff({ ...staff, role: e.target.value })} className="adm-input">
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div>
              <label className="adm-label">Temporary password</label>
              <input type="password" required minLength={10} autoComplete="new-password" value={staff.password} onChange={(e) => setStaff({ ...staff, password: e.target.value })} className="adm-input" />
            </div>
            <button type="submit" disabled={isPending} className="adm-btn col-span-2 sm:col-span-1 sm:justify-self-start mt-1">
              Create account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
