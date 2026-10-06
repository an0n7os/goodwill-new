import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { getCustomerSession } from "@/lib/actions";
import { getMyOrdersDetailed } from "@/lib/orderActions";
import { statusLabel, STATUS_BADGE, orderSteps, isClosed } from "@/lib/orderStatus";
import { formatINR } from "@/lib/pricing";
import { paymentStatusLabel, deliveryTypeLabel } from "@/lib/orderLabels";
import { ArrowRight, Package, UserRound } from "lucide-react";

export const metadata: Metadata = {
  title: "My Account | Goodwill Electrical World",
};

export const revalidate = 0;

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AccountPage() {
  const [session, orders] = await Promise.all([getCustomerSession(), getMyOrdersDetailed()]);

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Header />
      <PageHeader
        width="5xl"
        eyebrow="My account"
        title={session ? `Hello, ${session.name.split(" ")[0]}` : "Your"}
        accent={session ? undefined : "account."}
        description={session ? `Signed in as ${session.email}${session.phone ? ` · +91 ${session.phone}` : ""}` : "Sign in to see your orders in one place."}
        breadcrumbs={[{ href: "/", label: "Home" }, { label: "Account" }]}
      />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-grow">
        {!session ? (
          <div className="card-lux !transform-none flex flex-col items-center text-center px-6 py-16">
            <div className="w-14 h-14 rounded-full bg-paper border border-ink/10 flex items-center justify-center text-gold-dark">
              <UserRound size={22} strokeWidth={1.75} />
            </div>
            <h2 className="text-xl font-semibold text-ink mt-5">You&apos;re not signed in</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              Use the <span className="font-medium text-ink">Sign In</span> button at the top of the page, or track a single
              order with your order number and phone.
            </p>
            <Link href="/track-order" className="btn-dark mt-7">
              Track an order <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <section>
            <div className="flex items-end justify-between gap-4 mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">Your orders</h2>
              <span className="text-sm text-slate-500">{orders?.length ?? 0} total</span>
            </div>

            {!orders || orders.length === 0 ? (
              <div className="card-lux !transform-none flex flex-col items-center text-center px-6 py-16">
                <div className="w-14 h-14 rounded-full bg-paper border border-ink/10 flex items-center justify-center text-gold-dark">
                  <Package size={22} strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold text-ink mt-5">No orders yet</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                  {session.phone ? `Orders placed with +91 ${session.phone} or ${session.email} will appear here.` : `Orders placed while signed in as ${session.email} will appear here.`}
                </p>
                <Link href="/products" className="btn-dark mt-7">
                  Browse the catalogue <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {orders.map((order) => (
                  <li key={order.id} className="card-lux !transform-none p-6 md:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-400">{formatDate(order.createdAt)}</div>
                        <div className="text-lg font-semibold text-ink mt-1">#{order.orderNumber}</div>
                      </div>
                      <span
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                          STATUS_BADGE[order.status] ?? "bg-paper text-slate-600 border-ink/10"
                        }`}
                      >
                        {statusLabel(order.status, order.deliveryType)}
                      </span>
                    </div>

                    {!isClosed(order.status) && <ProgressBar status={order.status} deliveryType={order.deliveryType} />}

                    <p className="text-sm text-slate-600 mt-4 line-clamp-2">
                      {order.items.map((i) => `${i.productName}${i.quantity > 1 ? ` × ${i.quantity}` : ""}`).join(", ")}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-5 border-t border-ink/[0.06]">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <span className="text-ink font-semibold">₹{formatINR(order.total)}</span>
                        <span className="text-slate-500">{paymentStatusLabel(order.paymentStatus, order.paymentMethod)}</span>
                        <span className="text-slate-500">{deliveryTypeLabel(order.deliveryType)}</span>
                      </div>
                      <Link
                        href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&phone=${order.customer.phone}`}
                        className="link-arrow text-sm"
                      >
                        {isClosed(order.status) ? "View details" : "Track order"} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

// Slim step indicator for open orders
function ProgressBar({ status, deliveryType }: { status: string; deliveryType: string }) {
  const steps = orderSteps(deliveryType);
  const at = Math.max(steps.indexOf(status as (typeof steps)[number]), 0);
  return (
    <div className="mt-5">
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= at ? "bg-ink" : "bg-ink/10"}`} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[11px] text-slate-400">
        <span>{statusLabel(steps[0], deliveryType)}</span>
        <span className="text-ink font-medium">{statusLabel(status, deliveryType)}</span>
        <span>{statusLabel(steps[steps.length - 1], deliveryType)}</span>
      </div>
    </div>
  );
}
