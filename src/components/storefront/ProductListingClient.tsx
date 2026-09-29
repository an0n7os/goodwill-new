"use client";

import React, { useState, useMemo } from "react";
import { useLanguageStore } from "@/store/language";
import { Search, SlidersHorizontal, Check, X, BadgePercent } from "lucide-react";
import { formatINR } from "@/lib/pricing";
import ProductCard from "@/components/storefront/ProductCard";

interface ProductListingClientProps {
  initialProducts: any[];
  categories: any[];
  brands: any[];
  initialCategory?: string;
  initialBrand?: string;
  initialSearch?: string;
  initialOffersOnly?: boolean;
}

const MAX_PRICE = 10000;

export default function ProductListingClient({
  initialProducts,
  categories,
  brands,
  initialCategory = "",
  initialBrand = "",
  initialSearch = "",
  initialOffersOnly = false,
}: ProductListingClientProps) {
  const { t } = useLanguageStore();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [priceRange, setPriceRange] = useState<number>(MAX_PRICE);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(initialOffersOnly);
  const [sortBy, setSortBy] = useState("popular");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Top-level categories for the pill row; sub-categories stay in the dropdown
  const parentCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);

  const handleBrandToggle = (brandSlug: string) => {
    setSelectedBrands((prev) => (prev.includes(brandSlug) ? prev.filter((s) => s !== brandSlug) : [...prev, brandSlug]));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedBrands([]);
    setPriceRange(MAX_PRICE);
    setInStockOnly(false);
    setOffersOnly(false);
    setSortBy("popular");
  };

  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    selectedBrands.length +
    (priceRange < MAX_PRICE ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (offersOnly ? 1 : 0);

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // A parent category (e.g. "electrical") also matches products in its sub-categories
    if (selectedCategory) {
      result = result.filter(
        (p) => p.category?.slug === selectedCategory || p.category?.parent?.slug === selectedCategory
      );
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand?.slug));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameML && p.nameML.toLowerCase().includes(q)) ||
          p.brand?.name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (priceRange < MAX_PRICE) result = result.filter((p) => p.price <= priceRange);
    if (inStockOnly) result = result.filter((p) => p.stock > 0);
    if (offersOnly) result = result.filter((p) => p.mrp > p.price);

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        result.sort((a, b) => b.soldCount - a.soldCount);
    }

    return result;
  }, [initialProducts, selectedCategory, selectedBrands, searchQuery, priceRange, inStockOnly, offersOnly, sortBy]);

  const labelClass = "text-[11px] font-medium text-slate-400 uppercase tracking-[0.16em]";
  const fieldClass =
    "w-full h-10 px-4 border border-ink/10 rounded-full bg-paper/70 focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 focus:bg-white text-sm text-ink transition-all";

  const filterPanel = (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <label className={labelClass}>Search</label>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, brand or SKU"
            className={`${fieldClass} pl-10`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <label className={labelClass}>Category</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`${fieldClass} cursor-pointer`}>
          <option value="">All categories</option>
          {parentCategories.map((cat) => (
            <optgroup key={cat.id} label={t(cat.name, cat.nameML)}>
              <option value={cat.slug}>All {cat.name}</option>
              {categories
                .filter((c) => c.parentId === cat.id)
                .map((sub) => (
                  <option key={sub.id} value={sub.slug}>
                    {t(sub.name, sub.nameML)}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2.5">
        <label className={labelClass}>Brands</label>
        <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto -mx-2 px-2">
          {brands.map((br) => {
            const isSelected = selectedBrands.includes(br.slug);
            return (
              <button
                key={br.id}
                onClick={() => handleBrandToggle(br.slug)}
                className="flex items-center justify-between text-left text-sm py-1.5 px-2 rounded-lg hover:bg-paper transition-colors text-slate-700"
              >
                <span className={isSelected ? "text-ink font-medium" : ""}>{br.name}</span>
                <span
                  className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center transition-all ${
                    isSelected ? "bg-ink border-ink text-gold-light" : "border-ink/20"
                  }`}
                >
                  {isSelected && <Check size={11} strokeWidth={3.5} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className={labelClass}>Max price</label>
          <span className="text-sm font-semibold text-ink">
            {priceRange >= MAX_PRICE ? "Any" : `₹${formatINR(priceRange)}`}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max={MAX_PRICE}
          step="50"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full accent-[#9c7a2e] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>₹50</span>
          <span>₹{formatINR(MAX_PRICE)}+</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-5 border-t border-ink/[0.06]">
        {[
          { label: "In stock only", checked: inStockOnly, set: setInStockOnly },
          { label: "Offers only", checked: offersOnly, set: setOffersOnly },
        ].map((opt) => (
          <label key={opt.label} className="flex items-center justify-between cursor-pointer text-sm text-slate-700">
            <span>{opt.label}</span>
            <input type="checkbox" checked={opt.checked} onChange={(e) => opt.set(e.target.checked)} className="peer sr-only" />
            <span className="relative w-9 h-5 rounded-full bg-ink/15 peer-checked:bg-ink transition-colors after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Category pills */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 mb-8">
        {[{ slug: "", name: "All" }, ...parentCategories].map((cat) => {
          const active = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug || "all"}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`flex-shrink-0 h-10 px-5 rounded-full text-sm font-medium border transition-all ${
                active ? "bg-ink text-white border-ink" : "bg-white text-slate-600 border-ink/10 hover:border-gold/60 hover:text-ink"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
        <button
          onClick={() => setOffersOnly(!offersOnly)}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-sm font-medium border transition-all ${
            offersOnly ? "bg-gold text-ink border-gold" : "bg-gold/10 text-gold-dark border-gold/30 hover:bg-gold/20"
          }`}
        >
          <BadgePercent size={15} />
          Offers
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-3">
          <div className="card-lux !transform-none p-6 sticky top-32">
            <div className="flex justify-between items-center pb-5 mb-6 border-b border-ink/[0.06]">
              <h2 className="font-semibold text-ink flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-gold-dark" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gold text-ink text-[11px] font-bold inline-flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </h2>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-xs font-medium text-slate-500 hover:text-ink transition-colors">
                  Clear all
                </button>
              )}
            </div>
            {filterPanel}
          </div>
        </aside>

        {/* Results */}
        <main className="md:col-span-8 lg:col-span-9">
          <div className="flex items-center justify-between gap-3 mb-6">
            <p className="text-sm text-slate-500 whitespace-nowrap">
              <span className="font-semibold text-ink">{filteredProducts.length}</span>
              <span className="hidden sm:inline"> {filteredProducts.length === 1 ? "product" : "products"}</span>
              <span className="sm:hidden"> items</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="md:hidden inline-flex items-center gap-2 h-10 px-4 rounded-full bg-ink text-white text-sm font-medium"
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && <span className="text-gold-light">({activeFilterCount})</span>}
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                className="h-10 pl-4 pr-8 max-w-[150px] sm:max-w-none border border-ink/10 rounded-full bg-white text-sm text-ink focus:outline-none focus:ring-4 focus:ring-gold/15 cursor-pointer"
              >
                <option value="popular">{t("Most popular", "പ്രശസ്തമായവ")}</option>
                <option value="price-low">{t("Price: low to high", "വില: കുറഞ്ഞത് മുതൽ")}</option>
                <option value="price-high">{t("Price: high to low", "വില: കൂടിയത് മുതൽ")}</option>
                <option value="name-az">{t("Name: A to Z", "പേര്: അക്ഷരമാലാക്രമത്തിൽ")}</option>
              </select>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} showAddToCart />
              ))}
            </div>
          ) : (
            <div className="card-lux !transform-none flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-paper border border-ink/10 flex items-center justify-center text-gold-dark">
                <Search size={22} strokeWidth={1.75} />
              </div>
              <h3 className="text-xl font-semibold text-ink mt-5">No products found</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-2">
                Nothing matches these filters. Try a different search, or ask us on WhatsApp — we stock far more than what&apos;s listed online.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-7">
                <button onClick={resetFilters} className="btn-dark">
                  Clear filters
                </button>
                <a href="https://wa.me/919744164444" target="_blank" rel="noopener noreferrer" className="btn-dark !bg-white !text-ink border border-ink/10 hover:!bg-paper">
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex justify-end" onClick={() => setIsMobileFiltersOpen(false)}>
          <div className="w-[88vw] max-w-sm bg-white h-full flex flex-col shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-ink/[0.06]">
              <h2 className="font-semibold text-ink text-lg">Filters</h2>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="w-9 h-9 rounded-full border border-ink/10 text-slate-500 hover:text-ink flex items-center justify-center"
              >
                <X size={17} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{filterPanel}</div>
            <div className="grid grid-cols-2 gap-3 px-6 py-5 border-t border-ink/[0.06]">
              <button onClick={resetFilters} className="h-11 rounded-full border border-ink/10 text-sm font-medium text-slate-600">
                Clear all
              </button>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="h-11 rounded-full bg-ink text-white text-sm font-medium">
                Show {filteredProducts.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
