"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";
import { usePathname, useRouter } from "next/navigation";
import { getAdminSession, logoutAdminUser } from "@/lib/actions";
import {
  LayoutDashboard,
  Boxes,
  ClipboardList,
  MessageSquareHeart,
  Store,
  Menu,
  Users,
  LogOut,
  TicketPercent,
  FolderTree,
  Settings,
  X,
} from "lucide-react";
import Toaster from "@/components/admin/Toaster";
import { getOpenOrderCount } from "@/lib/orderActions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Desktop: sidebar shown unless collapsed. Mobile: hidden until opened.
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Remembers which page the mobile menu was opened on, so navigating closes it
  const [mobileOpenOn, setMobileOpenOn] = useState<string | null>(null);
  const isMobileOpen = mobileOpenOn === pathname;
  const setIsMobileOpen = (open: boolean) => setMobileOpenOn(open ? pathname : null);
  const [openOrders, setOpenOrders] = useState(0);
  const [admin, setAdmin] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    getAdminSession().then(setAdmin);
    getOpenOrderCount().then(setOpenOrders);
  }, [pathname]);

  const initials = (admin?.name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = admin?.role ? admin.role.charAt(0).toUpperCase() + admin.role.slice(1) : "";

  const handleLogout = async () => {
    await logoutAdminUser();
    router.replace("/admin/login");
    router.refresh();
  };

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard size={17} strokeWidth={1.75} />,
    },
    {
      name: "Inventory",
      href: "/admin/products",
      icon: <Boxes size={17} strokeWidth={1.75} />,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: <ClipboardList size={17} strokeWidth={1.75} />,
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: <Users size={17} strokeWidth={1.75} />,
    },
    {
      name: "Enquiries",
      href: "/admin/enquiries",
      icon: <MessageSquareHeart size={17} strokeWidth={1.75} />,
    },
  ];

  const setupItems = [
    { name: "Categories & Brands", href: "/admin/catalog", icon: <FolderTree size={17} strokeWidth={1.75} /> },
    { name: "Coupons", href: "/admin/coupons", icon: <TicketPercent size={17} strokeWidth={1.75} /> },
    { name: "Settings", href: "/admin/settings", icon: <Settings size={17} strokeWidth={1.75} /> },
  ];

  const NavLink = ({ item }: { item: { name: string; href: string; icon: React.ReactNode } }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        className={`relative flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
          isActive ? "bg-white/[0.07] text-white" : "hover:bg-white/[0.04] hover:text-slate-200"
        }`}
      >
        <span className={isActive ? "text-gold-light" : ""}>{item.icon}</span>
        <span>{item.name}</span>
        {item.href === "/admin/orders" && openOrders > 0 ? (
          <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-gold text-ink text-[11px] font-bold flex items-center justify-center" title="Orders to process">
            {openOrders}
          </span>
        ) : (
          isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
        )}
      </Link>
    );
  };

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-ink">{children}</div>;
  }

  const pageTitle =
    [...menuItems, ...setupItems].find((m) => pathname === m.href || pathname.startsWith(m.href + "/"))?.name ??
    pathname.split("/").pop()?.replace("-", " ");

  return (
    <div className="min-h-screen flex bg-paper text-ink antialiased font-sans">
      {/* 1. Desktop Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileOpen(false)} aria-hidden />
      )}
      <aside
        className={`bg-ink text-slate-400 w-60 flex-shrink-0 flex flex-col justify-between transition-all duration-300 border-r border-white/[0.06] overflow-hidden
          fixed inset-y-0 left-0 z-50 lg:sticky lg:top-0 lg:h-screen ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${
          isSidebarOpen ? "" : "lg:w-0 lg:border-r-0"
        }`}
      >
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-gold-light/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col relative">
          {/* Sidebar Header Logo */}
          <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
            <Link href="/admin/dashboard" aria-label="Goodwill Admin Panel" className="inline-block">
              <BrandLogo tone="light" size="md" subtitle="Admin Panel" />
            </Link>
            <button onClick={() => setIsMobileOpen(false)} aria-label="Close menu" className="lg:hidden p-1.5 rounded-full text-slate-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="p-3 flex flex-col gap-0.5 flex-grow overflow-y-auto">
            <span className="px-3.5 pt-2 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">Manage</span>
            {menuItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            <span className="px-3.5 pt-5 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">Setup</span>
            {setupItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </div>

        {/* Back to store links */}
        <div className="p-3 border-t border-white/[0.06] flex flex-col gap-1.5 relative">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/[0.04] hover:text-slate-200 transition-colors"
          >
            <Store size={17} strokeWidth={1.75} />
            <span>Storefront Website</span>
          </Link>
          <div className="flex items-center gap-3 px-3 py-3 mt-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-gold-light to-gold flex items-center justify-center text-ink text-xs font-bold">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-200 truncate">{admin?.name}</span>
              <span className="text-[11px] text-slate-500">{roleLabel}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-500 hover:text-rose-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Page Content frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white/85 backdrop-blur-xl border-b border-ink/[0.06] h-14 px-4 md:px-6 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.matchMedia("(min-width: 1024px)").matches) setIsSidebarOpen((v) => !v);
                else setIsMobileOpen(true);
              }}
              aria-label="Toggle menu"
              className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-ink/10 hover:bg-paper text-slate-600 transition-colors"
            >
              <Menu size={17} />
            </button>
            <h3 className="text-sm font-semibold text-ink capitalize">{pageTitle}</h3>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-600 font-medium px-3 py-1.5 rounded-full border border-ink/10 bg-paper">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System live
            </span>
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="font-semibold text-ink text-xs">{admin?.name}</div>
                <div className="text-[11px] text-slate-400">{roleLabel}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-gold-light text-xs font-bold ring-1 ring-gold/40">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard inner window page */}
        <main className="flex-1 p-4 md:p-6 lg:p-7 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  );
}
