"use client";

import { useHydrated } from "@/lib/useHydrated";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useCustomerAuthStore } from "@/store/customerAuth";
import CustomerAuthModal from "@/components/auth/CustomerAuthModal";
import BrandLogo from "@/components/layout/BrandLogo";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Percent,
  Droplets,
  Bath,
  ArrowRight,
  Truck,
  FileText,
  User,
  LogOut,
  Zap,
  Phone,
  MessageSquare,
} from "lucide-react";
import { getProducts, getCategories, getCustomerSession, logoutCustomer } from "@/lib/actions";

interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  children?: { name: string; slug: string }[];
}

const DEFAULT_CATEGORIES: CategoryTree[] = [
  {
    id: "cat-elec",
    name: "Electrical",
    slug: "electrical",
    children: [
      { name: "Switches & Sockets", slug: "switches-sockets" },
      { name: "Wires & Cables", slug: "wires-cables" },
      { name: "LED Bulbs & Lights", slug: "led-bulbs-lights" },
    ],
  },
  {
    id: "cat-plumb",
    name: "Plumbing",
    slug: "plumbing",
    children: [
      { name: "UPVC & CPVC Pipes", slug: "upvc-cpvc-pipes" },
    ],
  },
  {
    id: "cat-sani",
    name: "Sanitary Ware",
    slug: "sanitary-ware",
    children: [
      { name: "Water Closets", slug: "water-closets" },
      { name: "Wash Basins", slug: "wash-basins" },
    ],
  },
  {
    id: "cat-bath",
    name: "Bath Fittings",
    slug: "bath-fittings",
    children: [
      { name: "Taps & Mixers", slug: "taps-mixers" },
      { name: "Showers", slug: "showers" },
    ],
  },
];

export default function Header() {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const { user, login, logout } = useCustomerAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const mounted = useHydrated();

  // The httpOnly session cookie is the source of truth: mirror it into the store
  // (this also clears any stale demo sign-in left in localStorage)
  useEffect(() => {
    getCustomerSession().then((session) => {
      if (session) login(session);
      else logout();
    });
  }, [login, logout]);

  const handleLogout = async () => {
    await logoutCustomer();
    logout();
    router.refresh();
  };

  // Cart lives in client storage, so render 0 until mounted to keep SSR markup stable
  const cartCount = mounted ? cartTotal : 0;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Starts from the built-in list (stable SSR markup), then follows the categories set in admin
  const [categories, setCategories] = useState<CategoryTree[]>(DEFAULT_CATEGORIES);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  const suggestionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Lift the nav with a shadow once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" focuses the search box, like most catalogue sites
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getCategories().then((all) => {
      const tree = all
        .filter((c) => !c.parentId)
        .map((c) => ({ id: c.id, name: c.name, slug: c.slug, children: c.children.map((ch) => ({ name: ch.name, slug: ch.slug })) }));
      if (tree.length > 0) setCategories(tree);
    });
  }, []);

  // Debounced search suggestion
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) { setSuggestions([]); return; }
      const results = await getProducts({ search: searchQuery });
      if (!cancelled) setSuggestions(results.slice(0, 5));
    }, 200);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const categoryIcons: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
    electrical: Zap,
    plumbing: Droplets,
    "sanitary-ware": Sparkles,
    "bath-fittings": Bath,
  };

  const navLinks = [
    { href: "/products", label: "All Products", active: pathname === "/products" },
    { href: "/products?brand=jaquar", label: "Jaquar", active: false, wide: true },
    { href: "/products?brand=supreme", label: "Supreme", active: false, wide: true },
    { href: "/track-order", label: "Track Order", active: pathname === "/track-order" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main Navigation Bar */}
      <nav
        className={`w-full bg-white/85 border-b backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-500 ${scrolled ? "border-ink/[0.08] shadow-[0_10px_30px_-18px_rgba(11,15,25,0.35)]" : "border-ink/[0.06]"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" aria-label="Goodwill Electrical World — home" className="flex-shrink-0 py-0.5 transition-opacity hover:opacity-80">
            <BrandLogo size="md" priority />
          </Link>

          {/* Search Bar Container */}
          <div ref={suggestionRef} className="hidden md:block flex-1 max-w-sm relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full group/search">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-gold-dark transition-colors pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search products…"
                className="w-full h-10 pl-10 pr-20 rounded-full border border-ink/10 bg-paper/70 focus:outline-none focus:ring-4 focus:ring-gold/15 focus:bg-white focus:border-gold/60 transition-all text-[13px] text-ink placeholder:text-slate-400"
              />
              {searchQuery ? (
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-ink-2 transition-colors"
                >
                  Search
                </button>
              ) : (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center h-6 px-2 rounded-md border border-ink/10 bg-white text-[11px] font-medium text-slate-400 font-sans">
                  /
                </kbd>
              )}
            </form>

            {/* Auto Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-[min(28rem,90vw)] mt-2 bg-white rounded-2xl shadow-premium-lg border border-ink/[0.06] overflow-hidden z-50 animate-fade-in p-1.5">
                <div className="px-3 pt-2 pb-2 text-[11px] font-medium text-slate-400 uppercase tracking-[0.16em]">
                  Matches in inventory
                </div>
                {suggestions.map((prod) => (
                  <Link
                    key={prod.id}
                    href={`/product/${prod.slug}`}
                    onClick={() => setShowSuggestions(false)}
                    className="flex items-center gap-3.5 p-2.5 hover:bg-paper rounded-xl transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-ink/[0.06]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prod.images?.[0]?.url || "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=100"}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{prod.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {prod.brand?.name} · {prod.category?.name}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-ink flex-shrink-0">
                      {prod.price > 0 ? `₹${prod.price.toLocaleString("en-IN")}` : "Ask price"}
                    </div>
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full flex items-center justify-between px-3 py-2.5 mt-1 border-t border-ink/[0.06] text-xs font-medium text-gold-dark hover:text-ink transition-colors"
                >
                  <span>See all results for “{searchQuery}”</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Right Actions — Cart → Sign In → Mobile */}
          <div className="flex items-center gap-2">

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} items`}
              className="relative inline-flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:pl-3.5 sm:pr-2 rounded-full
                         border border-ink/10 bg-white hover:bg-paper hover:border-gold/60
                         text-ink transition-all"
            >
              <ShoppingCart size={17} strokeWidth={1.75} />
              <span className="hidden sm:inline text-xs font-semibold">Cart</span>
              <span
                className={`hidden sm:inline-flex min-w-[22px] h-[22px] px-1.5 items-center justify-center rounded-full text-[11px] font-bold ${cartCount > 0 ? "bg-gold text-ink" : "bg-paper text-slate-400"
                  }`}
              >
                {cartCount}
              </span>
              {cartCount > 0 && (
                <span className="sm:hidden absolute -top-1 -right-1 bg-gold text-ink rounded-full text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Sign In CTA / Logged-in avatar (dropdown opens on hover, or on tap via focus) */}
            {mounted && user ? (
              <div className="relative group">
                <button className="inline-flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-full
                                   bg-ink hover:bg-ink-2
                                   text-white text-xs font-semibold transition-all cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-b from-gold-light to-gold text-ink font-bold text-[11px] flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                {/* Dropdown — pt bridges the hover gap */}
                <div className="absolute right-0 top-full pt-2 w-60 hidden group-hover:block group-focus-within:block z-50">
                  <div className="bg-white border border-ink/[0.08] rounded-2xl p-1.5 shadow-premium-lg">
                    <div className="px-3 py-3 border-b border-ink/[0.06] mb-1">
                      <div className="text-sm font-semibold text-ink truncate">{user.name}</div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{user.email ?? (user.phone ? `+91 ${user.phone}` : "")}</div>
                    </div>
                    <Link href="/account" className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:text-ink hover:bg-paper rounded-xl transition-colors">
                      <Truck size={15} className="text-gold-dark shrink-0" />
                      <span>My orders</span>
                    </Link>
                    <Link href="/bulk-enquiry" className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:text-ink hover:bg-paper rounded-xl transition-colors">
                      <FileText size={15} className="text-gold-dark shrink-0" />
                      <span>Request a bulk quote</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1 border-t border-ink/[0.06] cursor-pointer"
                    >
                      <LogOut size={15} className="shrink-0" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                aria-label="Sign In"
                className="inline-flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:px-5 rounded-full
                           bg-ink hover:bg-ink-2 active:scale-95
                           text-white text-xs font-semibold
                           transition-all cursor-pointer"
              >
                <User size={14} className="shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Sign In</span>
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={isMobileMenuOpen}
              className="h-10 w-10 inline-flex items-center justify-center md:hidden rounded-full border border-ink/10 hover:bg-paper text-ink transition-all"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* 3. Categories Navbar (Desktop) */}
        <div className="hidden md:block w-full border-t border-ink/[0.05]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-[13px] font-medium text-slate-600">
            <div className="flex items-center gap-1">
              {/* Mega menu trigger — opens on hover or click */}
              <div
                className="relative"
                onMouseEnter={() => setIsCatDropdownOpen(true)}
                onMouseLeave={() => setIsCatDropdownOpen(false)}
              >
                <button
                  onClick={() => {
                    // Mouse users get hover; touch devices toggle on tap
                    if (!window.matchMedia("(hover: hover)").matches) setIsCatDropdownOpen((open) => !open);
                  }}
                  className={`flex items-center gap-2 h-11 pr-4 whitespace-nowrap transition-colors ${isCatDropdownOpen ? "text-ink" : "hover:text-ink"}`}
                >
                  <Menu size={15} className="text-gold-dark" />
                  <span className="font-semibold text-ink">Shop by Category</span>
                  <ChevronDown size={13} className={`transition-transform duration-300 ${isCatDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isCatDropdownOpen && (
                  <div className="absolute top-full left-0 pt-1 z-50 animate-fade-in">
                    <div className="w-[760px] bg-white rounded-3xl shadow-premium-lg border border-ink/[0.08] p-3 grid grid-cols-[1fr_1fr_220px] gap-1">
                      {categories.map((cat) => {
                        const Icon = categoryIcons[cat.slug] ?? Zap;
                        return (
                          <div key={cat.id} className="p-3 rounded-2xl hover:bg-paper transition-colors group/cat">
                            <Link
                              href={`/products?category=${cat.slug}`}
                              onClick={() => setIsCatDropdownOpen(false)}
                              className="flex items-center gap-3"
                            >
                              <span className="w-9 h-9 rounded-full border border-ink/10 bg-white flex items-center justify-center text-ink group-hover/cat:bg-ink group-hover/cat:text-gold-light transition-colors">
                                <Icon size={16} strokeWidth={1.75} />
                              </span>
                              <span className="font-semibold text-ink">{cat.name}</span>
                              <ArrowRight size={14} className="ml-auto text-slate-300 group-hover/cat:text-gold-dark group-hover/cat:translate-x-0.5 transition-all" />
                            </Link>
                            {cat.children && cat.children.length > 0 && (
                              <div className="mt-2 pl-12 flex flex-col gap-1">
                                {cat.children.map((sub, idx) => (
                                  <Link
                                    key={idx}
                                    href={`/products?category=${sub.slug}`}
                                    onClick={() => setIsCatDropdownOpen(false)}
                                    className="text-[13px] font-normal text-slate-500 hover:text-ink transition-colors py-0.5"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Promo card */}
                      <Link
                        href="/bulk-enquiry"
                        onClick={() => setIsCatDropdownOpen(false)}
                        className="row-span-2 col-start-3 row-start-1 relative overflow-hidden rounded-2xl hero-backdrop p-5 flex flex-col justify-between text-white group/promo"
                      >
                        <div className="absolute inset-0 hero-grid opacity-60 pointer-events-none" />
                        <div className="relative">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-light">For contractors</span>
                          <p className="text-xl font-semibold leading-tight mt-3">
                            Wholesale rates on{" "}
                            <span className="font-display italic text-gold-gradient">bulk orders.</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Send your material list and get a project quote on WhatsApp.
                          </p>
                        </div>
                        <span className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-gold-light mt-4">
                          Request a BOQ quote
                          <ArrowRight size={13} className="group-hover/promo:translate-x-1 transition-transform" />
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <span className="w-px h-4 bg-ink/10 mx-2" />

              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative h-11 items-center px-3 whitespace-nowrap transition-colors ${link.wide ? "hidden lg:inline-flex" : "inline-flex"} after:absolute after:left-3 after:right-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-gold after:origin-left after:transition-transform after:duration-300 ${link.active ? "text-ink after:scale-x-100" : "hover:text-ink after:scale-x-0 hover:after:scale-x-100"
                    }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/products?discount=true"
                className="ml-2 inline-flex items-center gap-1.5 h-7 px-3 whitespace-nowrap rounded-full bg-gold/10 border border-gold/30 text-gold-dark hover:bg-gold/20 transition-colors text-xs font-semibold"
              >
                <Percent size={12} />
                Offers
              </Link>
            </div>

            <Link
              href="/bulk-enquiry"
              className={`group/bulk hidden lg:inline-flex items-center gap-1.5 h-11 whitespace-nowrap transition-colors ${pathname === "/bulk-enquiry" ? "text-ink" : "hover:text-ink"
                }`}
            >
              <span>Contractor &amp; bulk pricing</span>
              <ArrowRight size={14} className="text-gold-dark group-hover/bulk:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 4. Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden w-full border-t border-ink/[0.06] bg-white px-4 pt-4 pb-6 flex flex-col gap-6 animate-fade-in max-h-[calc(100dvh-64px)] overflow-y-auto">
            {/* Search */}
            <form
              onSubmit={(e) => {
                handleSearchSubmit(e);
                setIsMobileMenuOpen(false);
              }}
              className="relative w-full"
            >
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full h-11 pl-11 pr-4 rounded-full border border-ink/10 bg-paper/70 focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm"
              />
            </form>

            {/* Categories */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.18em]">Shop by category</span>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const Icon = categoryIcons[cat.slug] ?? Zap;
                  return (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-3 rounded-2xl border border-ink/[0.08] bg-paper/60 text-sm font-medium text-ink active:bg-paper"
                    >
                      <span className="w-8 h-8 rounded-full bg-white border border-ink/10 flex items-center justify-center text-gold-dark flex-shrink-0">
                        <Icon size={15} strokeWidth={1.75} />
                      </span>
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Links */}
            <nav className="flex flex-col divide-y divide-ink/[0.06] border-y border-ink/[0.06]">
              {[
                { href: "/products", label: "All products" },
                { href: "/products?discount=true", label: "Offers", gold: true },
                { href: "/track-order", label: "Track order" },
                { href: "/bulk-enquiry", label: "Contractor & bulk pricing" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-3.5 text-[15px] ${l.gold ? "text-gold-dark font-medium" : "text-ink"}`}
                >
                  {l.label}
                  <ArrowRight size={15} className="text-slate-300" />
                </Link>
              ))}
            </nav>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-2">
              <a href="tel:+919744164444" className="h-11 rounded-full border border-ink/10 text-sm font-medium text-ink flex items-center justify-center gap-2">
                <Phone size={15} className="text-gold-dark" /> Call us
              </a>
              <a
                href="https://wa.me/919744164444"
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 rounded-full bg-ink text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <MessageSquare size={15} className="text-emerald-400" /> WhatsApp
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}
