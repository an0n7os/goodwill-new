import React from "react";
import Link from "next/link";
import { getAdminStats } from "@/lib/actions";
import { TrendingUp, ShoppingBag, MessageSquare, ShieldAlert, ArrowRight } from "lucide-react";

export const revalidate = 0; // Fresh metrics

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  // Simple calculation for SVG Chart
  const salesMax = Math.max(...stats.chartData.map((d) => d.sales), 1000);
  const chartHeight = 160;

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-ink tracking-[-0.03em]">
          Dashboard Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time summary of sales, stock levels, and customer enquiries.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Today Sales */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today Sales</span>
            <span className="text-2xl font-bold text-ink">₹{stats.todaySales}</span>
            <span className="text-[11px] font-bold text-slate-400">
              {stats.todayOrders} new orders received today
            </span>
          </div>
          <div className="w-12 h-12 bg-paper text-gold-dark rounded-xl flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Card 2: Monthly Sales */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Sales</span>
            <span className="text-2xl font-bold text-ink">₹{stats.monthlySales}</span>
            <span className="text-[11px] font-bold text-slate-400 font-sans">
              {stats.monthlyOrders} orders this month
            </span>
          </div>
          <div className="w-12 h-12 bg-paper text-gold-dark rounded-xl flex items-center justify-center">
            <ShoppingBag size={22} />
          </div>
        </div>

        {/* Card 3: Pending Orders */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Orders</span>
            <span className="text-2xl font-bold text-ink">{stats.pendingOrdersCount}</span>
            <span className="text-[11px] font-bold text-amber-600 font-sans">
              Needs packing & dispatching
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ShieldAlert size={22} />
          </div>
        </div>

        {/* Card 4: Enquiries */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Leads</span>
            <span className="text-2xl font-bold text-ink">{stats.pendingEnquiries}</span>
            <span className="text-[11px] font-bold text-emerald-600 font-sans">
              Unanswered CRM pipeline leads
            </span>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
            <MessageSquare size={22} />
          </div>
        </div>
      </div>

      {/* Chart Section & Recent Activity split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Sales Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-ink text-base tracking-tight">
              Weekly Revenue Trend (7 Days)
            </h3>
            <span className="text-xs font-bold text-slate-400">Values in INR (₹)</span>
          </div>

          {/* Pure SVG Bar Chart (responsive) */}
          <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
            <svg viewBox={`0 0 500 ${chartHeight}`} className="w-full h-48">
              {/* grid lines */}
              <line x1="30" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="140" x2="480" y2="140" stroke="#e2e8f0" strokeWidth="2" />

              {/* Bars */}
              {stats.chartData.map((d, i) => {
                const barWidth = 36;
                const gap = 24;
                const x = 40 + i * (barWidth + gap);
                const barHeight = (d.sales / salesMax) * (chartHeight - 40);
                const y = chartHeight - 20 - barHeight;

                return (
                  <g key={i} className="group cursor-pointer">
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="6"
                      fill="#0f4c81"
                      className="transition-all hover:fill-gold duration-200"
                    />
                    {/* Tooltip on hover */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="9"
                      fontWeight="black"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      ₹{Math.round(d.sales)}
                    </text>
                    {/* labels */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Recent Activity (1 Column) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-ink text-base tracking-tight">
              Recent Orders
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-gold-dark hover:text-ink flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((ord) => (
                <div key={ord.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800">
                      Order #{ord.orderNumber}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {ord.customer?.name} • {new Date(ord.createdAt).toISOString().slice(0, 10)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                    <span className="font-bold text-slate-800">₹{ord.total}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      ord.status === "DELIVERED"
                        ? "bg-emerald-50 text-emerald-700"
                        : ord.status === "CANCELLED"
                        ? "bg-red-50 text-red-700"
                        : "bg-paper text-gold-dark"
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No recent order activity.</p>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock alerts & Top selling products splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-ink text-base tracking-tight flex items-center gap-1.5 text-red-600">
            <ShieldAlert size={16} />
            <span>Low Stock Alerts</span>
          </h3>

          <div className="flex flex-col divide-y divide-slate-100">
            {stats.lowStockProducts.length > 0 ? (
              stats.lowStockProducts.map((prod) => (
                <div key={prod.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{prod.name}</div>
                    <div className="text-[11px] text-slate-400 font-bold mt-0.5">
                      SKU: {prod.sku} • {prod.brand?.name}
                    </div>
                  </div>
                  <span className="font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded">
                    {prod.stock} left
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">All products have healthy stock levels! 🎉</p>
            )}
          </div>
        </div>

        {/* Top-Selling Products */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-ink text-base tracking-tight flex items-center gap-1.5 text-emerald-600">
            <TrendingUp size={16} />
            <span>Top-Selling Products</span>
          </h3>

          <div className="flex flex-col divide-y divide-slate-100">
            {stats.topProducts.map((prod) => (
              <div key={prod.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">{prod.name}</div>
                  <div className="text-[11px] text-slate-400 font-bold mt-0.5">
                    Price: ₹{prod.price} • {prod.brand?.name}
                  </div>
                </div>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
                  {prod.soldCount} sold
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
