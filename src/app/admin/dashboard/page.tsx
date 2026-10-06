import React from "react";
import Link from "next/link";
import { getAdminStats } from "@/lib/actions";
import { formatINR } from "@/lib/pricing";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { TrendingUp, ShoppingBag, MessageSquare, ShieldAlert, ArrowRight, Plus, TicketPercent } from "lucide-react";

export const revalidate = 0; // Fresh metrics

const STATUS_STYLE: Record<string, string> = {
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  RETURNED: "bg-slate-100 text-slate-500",
};

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const salesMax = Math.max(...stats.chartData.map((d) => d.sales), 1000);
  const chartHeight = 160;
  const weekTotal = stats.chartData.reduce((sum, d) => sum + d.sales, 0);

  const cards = [
    {
      label: "Today's sales",
      value: `₹${formatINR(stats.todaySales)}`,
      hint: `${stats.todayOrders} order${stats.todayOrders === 1 ? "" : "s"} today`,
      icon: <TrendingUp size={18} />,
      tone: "bg-paper text-gold-dark",
      href: "/admin/orders",
    },
    {
      label: "This month",
      value: `₹${formatINR(stats.monthlySales)}`,
      hint: `${stats.monthlyOrders} orders`,
      icon: <ShoppingBag size={18} />,
      tone: "bg-paper text-gold-dark",
      href: "/admin/orders",
    },
    {
      label: "To dispatch",
      value: String(stats.pendingOrdersCount),
      hint: "Placed, confirmed or packed",
      icon: <ShieldAlert size={18} />,
      tone: "bg-amber-50 text-amber-600",
      href: "/admin/orders",
    },
    {
      label: "Open enquiries",
      value: String(stats.pendingEnquiries),
      hint: "Awaiting a reply or quote",
      icon: <MessageSquare size={18} />,
      tone: "bg-teal-50 text-teal-600",
      href: "/admin/enquiries",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Dashboard"
        description="Sales, stock and enquiries at a glance."
        actions={
          <>
            <Link href="/admin/coupons" className="adm-btn-ghost">
              <TicketPercent size={15} /> Coupons
            </Link>
            <Link href="/admin/products" className="adm-btn">
              <Plus size={15} /> Manage products
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="adm-card p-5 flex items-start justify-between gap-3 hover:border-gold/40 transition-colors">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{c.label}</span>
              <span className="text-xl md:text-2xl font-semibold text-ink tracking-tight truncate">{c.value}</span>
              <span className="text-[11px] text-slate-400">{c.hint}</span>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.tone}`}>{c.icon}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 adm-card p-5 flex flex-col gap-3">
          <div className="flex justify-between items-baseline">
            <h3 className="font-semibold text-ink text-sm">Last 7 days</h3>
            <span className="text-xs text-slate-400">₹{formatINR(weekTotal)} total</span>
          </div>
          <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100">
            <svg viewBox={`0 0 500 ${chartHeight}`} className="w-full h-44" role="img" aria-label="Sales for the last 7 days">
              <line x1="30" y1="140" x2="480" y2="140" stroke="#e2e8f0" strokeWidth="1.5" />
              {stats.chartData.map((d, i) => {
                const barWidth = 36;
                const gap = 28;
                const x = 40 + i * (barWidth + gap);
                const barHeight = Math.max((d.sales / salesMax) * (chartHeight - 40), d.sales > 0 ? 3 : 0);
                const y = chartHeight - 20 - barHeight;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={barWidth} height={barHeight} rx="6" fill="#0b0f19" className="hover:fill-[#c9a24a] transition-colors" />
                    {d.sales > 0 && (
                      <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">
                        ₹{formatINR(Math.round(d.sales))}
                      </text>
                    )}
                    <text x={x + barWidth / 2} y={chartHeight - 4} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="adm-card p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-ink text-sm">Recent orders</h3>
            <Link href="/admin/orders" className="text-xs font-semibold text-gold-dark hover:text-ink flex items-center gap-0.5">
              All orders <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((ord) => (
                <div key={ord.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">#{ord.orderNumber}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {ord.customer?.name} · {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="font-semibold text-ink">₹{formatINR(ord.total)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLE[ord.status] ?? "bg-paper text-gold-dark"}`}>
                      {ord.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No orders yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="adm-card p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm flex items-center gap-1.5 text-red-600">
              <ShieldAlert size={15} /> Low stock
            </h3>
            <Link href="/admin/products" className="text-xs font-semibold text-gold-dark hover:text-ink flex items-center gap-0.5">
              Restock <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {stats.lowStockProducts.length > 0 ? (
              stats.lowStockProducts.map((prod) => (
                <div key={prod.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink truncate">{prod.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {prod.sku}
                      {prod.brand?.name ? ` · ${prod.brand.name}` : ""}
                    </div>
                  </div>
                  <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded flex-shrink-0">{prod.stock} left</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">All products have healthy stock.</p>
            )}
          </div>
        </div>

        <div className="adm-card p-5 flex flex-col gap-3">
          <h3 className="font-semibold text-sm flex items-center gap-1.5 text-emerald-600">
            <TrendingUp size={15} /> Top sellers
          </h3>
          <div className="flex flex-col divide-y divide-slate-100">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((prod) => (
                <div key={prod.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink truncate">{prod.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ₹{formatINR(prod.price)}
                      {prod.brand?.name ? ` · ${prod.brand.name}` : ""}
                    </div>
                  </div>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex-shrink-0">{prod.soldCount} sold</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No sales yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
