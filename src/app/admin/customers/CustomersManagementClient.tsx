"use client";

import React, { useState } from "react";
import { Search, Phone, MessageSquare, Download } from "lucide-react";

interface CustomersManagementClientProps {
  customers: any[];
}

export default function CustomersManagementClient({ customers }: CustomersManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customers.length > 0 ? customers[0].id : null
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name, phone number..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60 bg-slate-50 text-sm"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <button
          onClick={() => {
            if (customers.length === 0) return;
            const header = "Name,Phone,Email,Tier,Total Orders,Total Spent\n";
            const rows = customers
              .map((c) => `"${c.name}","${c.phone}","${c.email || ""}","${c.tier}",${c.totalOrders},${c.totalSpent}`)
              .join("\n");
            const blob = new Blob([header + rows], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Goodwill_Customers_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
          }}
          className="bg-ink hover:bg-ink-2 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
        >
          <Download size={14} />
          <span>Export Customer Directory CSV</span>
        </button>
      </div>

      {/* Grid Layout: Customer List (Left) + Customer Profile Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Customer Directory Table (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Customer Details</th>
                  <th className="py-4 px-4">Tier</th>
                  <th className="py-4 px-4">Orders Count</th>
                  <th className="py-4 px-4">Total Spent</th>
                  <th className="py-4 px-6 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`hover:bg-paper/30 transition-colors cursor-pointer ${
                        selectedCustomerId === c.id ? "bg-paper/60" : ""
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-50 text-ink font-semibold flex items-center justify-center text-xs flex-shrink-0">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                            <div className="text-[11px] text-slate-400 font-bold mt-0.5">{c.phone}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="bg-slate-100 text-slate-600 font-semibold text-[11px] px-2 py-0.5 rounded uppercase tracking-wider">
                          {c.tier}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800">
                        {c.totalOrders} orders
                      </td>

                      <td className="py-4 px-4 font-bold text-ink">
                        ₹{c.totalSpent}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`tel:${c.phone}`}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Call Customer"
                          >
                            <Phone size={14} />
                          </a>
                          <a
                            href={`https://wa.me/91${c.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            title="WhatsApp Customer"
                          >
                            <MessageSquare size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      No customers found matching search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Customer Drawer Profile (1 Column) */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col gap-6 animate-fade-in">
              {/* Profile Header */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-ink text-white font-bold text-lg flex items-center justify-center flex-shrink-0 shadow">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-400 font-bold">{selectedCustomer.phone}</p>
                </div>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Total Purchases</span>
                  <span className="text-lg font-bold text-ink">₹{selectedCustomer.totalSpent}</span>
                </div>
                <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-3">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Total Orders</span>
                  <span className="text-lg font-bold text-ink">{selectedCustomer.totalOrders}</span>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="flex gap-2">
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="flex-1 bg-ink hover:bg-ink-2 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone size={14} />
                  <span>Call Now</span>
                </a>
                <a
                  href={`https://wa.me/91${selectedCustomer.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare size={14} />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Recent Orders History */}
              <div className="flex flex-col gap-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase History</h4>
                {selectedCustomer.orders.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedCustomer.orders.map((ord: any) => (
                      <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-800">GW Order #{ord.id.slice(-6)}</div>
                          <div className="text-[11px] text-slate-400 font-bold mt-0.5">
                            {new Date(ord.createdAt).toISOString().slice(0, 10)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-ink">₹{ord.total}</div>
                          <span className="text-[11px] font-bold text-emerald-600 uppercase">{ord.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No past orders found.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/60 text-center text-slate-400 font-semibold">
              Select a customer to view details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
