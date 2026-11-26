import ReorderButton from "@/components/storefront/ReorderButton";
import AccountSignInCard from "@/components/auth/AccountSignInCard";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import { getCustomerSession, getMyServiceRequests } from "@/lib/actions";
import { getMyOrdersDetailed } from "@/lib/orderActions";
import { statusLabel, STATUS_BADGE, orderSteps, isClosed } from "@/lib/orderStatus";
import { formatINR } from "@/lib/pricing";
import { paymentStatusLabel, deliveryTypeLabel } from "@/lib/orderLabels";
import { ArrowRight, Package, Heart, ShoppingCart, Wrench, Calendar, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "My Account | Goodwill Electrical World",
};

export const revalidate = 0;

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AccountPage() {
  const [session, orders, services] = await Promise.all([
    getCustomerSession(),
    getMyOrdersDetailed(),
    getMyServiceRequests(),
  ]);

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
          <AccountSignInCard />
        ) : (
          <section>
            {/* Customer Profile Banner */}
            <div className="card-lux !transform-none p-5 md:p-6 mb-8 flex flex-col sm:flex-row items-center gap-5 border border-ink/[0.08] bg-white">
              {session.image ? (
                <img
                  src={session.image}
                  alt={session.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gold/40 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-b from-gold-light to-gold text-ink font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
                  {session.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl font-bold text-ink">{session.name}</h1>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Verified Customer
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5 truncate">{session.email}</p>
                {session.phone && <p className="text-xs text-slate-400 mt-0.5">+91 {session.phone}</p>}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-3">
                  <Link
                    href="/wishlist"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                  >
                    <Heart size={13} className="fill-rose-500 text-rose-500" />
                    <span>Saved Favorites</span>
                  </Link>
                  <Link
                    href="/cart"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <ShoppingCart size={13} className="text-amber-700" />
                    <span>My Cart</span>
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Wrench size={13} className="text-blue-700" />
                    <span>Book Service</span>
                  </Link>
                </div>
              </div>
            </div>

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
                  {`Orders placed while signed in as ${session.email} will appear here.`}
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
                      <ReorderButton orderId={order.id}/>
                      <Link
                        href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&phone=${JSON.parse(order.shippingAddress).phone}`}
                        className="link-arrow text-sm"
                      >
                        {isClosed(order.status) ? "View details" : "Track order"} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Service & Installation Bookings */}
            <div className="mt-12 pt-8 border-t border-ink/[0.08]">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-ink flex items-center gap-2">
                    <Wrench size={18} className="text-gold-dark" />
                    <span>Your installation & service bookings</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Electrician & plumbing requests registered with Goodwill Kulappully.
                  </p>
                </div>
                <Link
                  href="/services"
                  className="btn-outline !py-1.5 !px-3 text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <span>New booking</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {!services || services.length === 0 ? (
                <div className="card-lux !transform-none p-6 text-center bg-white border border-ink/[0.06]">
                  <p className="text-xs text-slate-500">
                    No active service requests. Need a certified electrician or plumber?
                  </p>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-dark hover:underline mt-2"
                  >
                    <span>Book a service technician</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {services.map((req) => {
                    const stageBadge =
                      req.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : req.status === "scheduled"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : req.status === "contacted"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-amber-50 text-amber-700 border-amber-200";

                    return (
                      <li key={req.id} className="card-lux !transform-none p-5 bg-white border border-ink/[0.08]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-ink">{req.serviceType}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${stageBadge}`}>
                                {req.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                              <span className="flex items-center gap-1">
                                <MapPin size={12} /> {req.location}
                              </span>
                              {req.preferredDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} /> {formatDate(req.preferredDate)}
                                </span>
                              )}
                              <span>Requested {formatDate(req.createdAt)}</span>
                            </div>
                            {req.details && (
                              <p className="text-xs text-slate-600 mt-2 bg-paper/60 p-2.5 rounded-xl border border-ink/[0.04]">
                                {req.details}
                              </p>
                            )}
                          </div>

                          {req.assignedTo && (
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block uppercase">Technician</span>
                              <span className="text-xs font-bold text-ink">{req.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
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
