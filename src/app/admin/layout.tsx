"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";
import { usePathname, useRouter } from "next/navigation";
import { getAdminSession, logoutAdminUser, syncWebsiteCatalogAction } from "@/lib/actions";
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
  RefreshCw,
} from "lucide-react";
import Toaster, { toast } from "@/components/admin/Toaster";
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
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);

  const handleGlobalSync = async () => {
    setIsGlobalSyncing(true);
    try {
      const res = await syncWebsiteCatalogAction();
      if (res.success) {
        toast.success(`Storefront synced: ${res.count} products live & cache updated.`);
      } else {
        toast.error(res.error || "Sync failed.");
      }
    } catch {
      toast.error("Failed to sync catalogue.");
    } finally {
      setIsGlobalSyncing(false);
    }
  };

  useEffect(() => {
    if (pathname === "/admin/login") return;
    getAdminSession().then(session=>{if(!session)router.replace("/admin/login");else setAdmin(session);});
    getOpenOrderCount().then(setOpenOrders);
  }, [pathname,router]);

  const initials = (admin?.name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = admin?.role ? admin.role.charAt(0).toUpperCase() + admin.role.slice(1) : "";

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAdminUser();
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard size={17} strokeWidth={1.75} />,
    },
    {
      name: "Products & stock",
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
      name: "Customer enquiries",
      href: "/admin/enquiries",
      icon: <MessageSquareHeart size={17} strokeWidth={1.75} />,
    },
  ];

  const setupItems = [
    {name:"Quotations",href:"/admin/quotations",icon:<ClipboardList size={17} strokeWidth={1.75}/>},
    {name:"Customer emails",href:"/admin/messages",icon:<MessageSquareHeart size={17} strokeWidth={1.75}/>},
    {name:"Payments & refunds",href:"/admin/payments",icon:<TicketPercent size={17} strokeWidth={1.75}/>},
    {name:"Backup & recovery",href:"/admin/backups",icon:<Settings size={17} strokeWidth={1.75}/>},
    { name: "Categories & Brands", href: "/admin/catalog", icon: <FolderTree size={17} strokeWidth={1.75} /> },
    { name: "Discount coupons", href: "/admin/coupons", icon: <TicketPercent size={17} strokeWidth={1.75} /> },
    { name: "Store settings", href: "/admin/settings", icon: <Settings size={17} strokeWidth={1.75} /> },
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

        <div className="flex flex-col relative flex-1 min-h-0">
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
          <nav className="p-3 flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto">
            <span className="px-3.5 pt-2 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">Daily work</span>
            {menuItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}

            {setupItems.filter(item => item.href === "/admin/settings" || (["/admin/quotations", "/admin/coupons"].includes(item.href) && ["owner", "manager"].includes(admin?.role || "")) || (item.href === "/admin/backups" && admin?.role === "owner")).map(item => <NavLink key={item.href} item={{...item, name: item.href === "/admin/settings" ? "Settings" : item.name}} />)}
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
            <span>View shop website</span>
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
              onClick={() => setShowLogoutModal(true)}
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

          <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
            <button
              onClick={handleGlobalSync}
              disabled={isGlobalSyncing}
              title="Sync complete catalogue and images with storefront"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/40 bg-gold/10 hover:bg-gold/20 text-ink font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={`text-gold-dark ${isGlobalSyncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isGlobalSyncing ? "Syncing..." : "Sync Website"}</span>
            </button>

            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-600 font-medium px-3 py-1.5 rounded-full border border-ink/10 bg-paper">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System live
            </span>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="font-semibold text-ink text-xs">{admin?.name}</div>
                <div className="text-[11px] text-slate-400">{roleLabel}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-gold-light text-xs font-bold ring-1 ring-gold/40">
                {initials}
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                title="Sign out of Admin Panel"
                aria-label="Sign out"
                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard inner window page */}
        <main className="flex-1 p-4 md:p-6 lg:p-7 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <Toaster />

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/65 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              if (!isLoggingOut) setShowLogoutModal(false);
            }}
          >
            <div
              className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-sm w-full p-6 flex flex-col items-center text-center gap-4 relative animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
                <LogOut size={24} strokeWidth={2.2} />
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 id="logout-title" className="text-lg font-bold text-ink">
                  Log out of Admin Panel?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to end your current session? You will need to sign in again to access the admin dashboard.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                  className="flex-1 h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
