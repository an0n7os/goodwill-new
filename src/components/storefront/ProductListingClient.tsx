"use client";

import {productFacets} from "@/lib/productFacets";
import React, { useState, useMemo, useDeferredValue } from "react";
import { useLanguageStore } from "@/store/language";
import { Search, SlidersHorizontal, Check, X, BadgePercent, ChevronDown, RotateCcw, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/pricing";
import ProductCard from "@/components/storefront/ProductCard";
import type { CatalogueListProduct, CatalogueCategory, CatalogueBrand } from "@/lib/catalogTypes";
import { useDialog } from "@/lib/useDialog";

interface ProductListingClientProps {
  initialProducts: CatalogueListProduct[];
  categories: CatalogueCategory[];
  brands: CatalogueBrand[];
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
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedFacets,setSelectedFacets]=useState<Record<string,string>>({});
  const [selectedCategory, rawSetSelectedCategory] = useState(initialCategory);
  const setSelectedCategory=(value:string)=>{rawSetSelectedCategory(value);setSelectedFacets({});};
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [priceRange, setPriceRange] = useState<number>(MAX_PRICE);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(initialOffersOnly);
  const [sortBy, setSortBy] = useState("popular");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const filterDialogRef = useDialog(isMobileFiltersOpen, () => setIsMobileFiltersOpen(false));

  // Top-level categories for the pill row; sub-categories stay in the dropdown
  const parentCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const brandGroups = useMemo(() => {
    const groups = new Map<string, { name: string; slugs: string[] }>();
    for (const brand of brands) {
      const key = brand.name.trim().toLowerCase();
      const group = groups.get(key) ?? { name: brand.name, slugs: [] };
      group.slugs.push(brand.slug);
      groups.set(key, group);
    }
    return [...groups.values()];
  }, [brands]);

  const handleBrandToggle = (slugs: string[]) => {
    setSelectedBrands((prev) => slugs.some((slug) => prev.includes(slug))
      ? prev.filter((slug) => !slugs.includes(slug))
      : [...prev, ...slugs]);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedBrands([]);
    setPriceRange(MAX_PRICE);
    setInStockOnly(false);
    setOffersOnly(false);
    setSortBy("popular");
    setSelectedFacets({});
    setVisibleCount(24);
  };

  const activeFilterCount =
    Object.values(selectedFacets).filter(Boolean).length +
    (searchQuery.trim() ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    brandGroups.filter((group) => group.slugs.some((slug) => selectedBrands.includes(slug))).length +
    (priceRange < MAX_PRICE ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (offersOnly ? 1 : 0);

  const filteredProducts = useMemo(() => {
    // Whole catalogue pages remain supporting documents, not product-card photos.
    let result = initialProducts.filter((product) =>
      (!product.images?.length && !product.sku.startsWith('LISHA-')) || product.images.some((image) => !image.url.includes('/lisha-catalogue/'))
    );

    // A parent category (e.g. "electrical") also matches products in its sub-categories
    if (selectedCategory) {
      result = result.filter(
        (p) => p.category?.slug === selectedCategory || p.category?.parent?.slug === selectedCategory
      );
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand?.slug ?? ""));
    }

    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameML && p.nameML.toLowerCase().includes(q)) ||
          p.brand?.name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    result=result.filter(p=>Object.entries(selectedFacets).every(([key,value])=>!value||productFacets(p.specs)[key]===value));
    if (priceRange < MAX_PRICE) result = result.filter((p) => p.price <= priceRange);
    if (inStockOnly) result = result.filter((p) => p.stock > 0);
    if (offersOnly) result = result.filter((p) => p.mrp > p.price);

    switch (sortBy) {
      case "price-low":
        // "Price on request" items (price 0) go last in both price sorts
        result.sort((a, b) => (a.price || Number.MAX_VALUE) - (b.price || Number.MAX_VALUE));
        break;
      case "price-high":
        result.sort((a, b) => (b.price || -Number.MAX_VALUE) - (a.price || -Number.MAX_VALUE));
        break;
      case "name-az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        result.sort((a, b) => b.soldCount - a.soldCount);
    }

    return result;
  }, [initialProducts, selectedCategory, selectedBrands, deferredSearchQuery, priceRange, inStockOnly, offersOnly, sortBy, selectedFacets]);

function getFacetColorDot(key: string, value: string) {
  const normKey = key.toLowerCase();
  if (normKey !== "colour" && normKey !== "color") return null;
  const val = value.toLowerCase().trim();
  let bgClass = "bg-slate-300";
  let borderClass = "border-slate-400/40";

  if (val.includes("cool white")) {
    bgClass = "bg-sky-50";
    borderClass = "border-sky-300";
  } else if (val.includes("warm white")) {
    bgClass = "bg-amber-100";
    borderClass = "border-amber-300";
  } else if (val.includes("white")) {
    bgClass = "bg-white";
    borderClass = "border-slate-300";
  } else if (val.includes("black")) {
    bgClass = "bg-slate-900";
    borderClass = "border-slate-700";
  } else if (val.includes("grey") || val.includes("gray")) {
    bgClass = "bg-slate-400";
    borderClass = "border-slate-500";
  } else if (val.includes("gold") || val.includes("brass")) {
    bgClass = "bg-amber-400";
    borderClass = "border-amber-500";
  } else if (val.includes("silver") || val.includes("chrome")) {
    bgClass = "bg-slate-200";
    borderClass = "border-slate-400";
  } else if (val.includes("ivory")) {
    bgClass = "bg-[#fefce8]";
    borderClass = "border-amber-200";
  }

  return (
    <span
      className={`w-2.5 h-2.5 rounded-full ${bgClass} border ${borderClass} shadow-xs inline-block flex-shrink-0`}
      aria-hidden="true"
    />
  );
}

  const facetOptions=useMemo(()=>{const result:Record<string,string[]>={};for(const p of initialProducts.filter(p=>!selectedCategory||p.category.slug===selectedCategory||p.category.parent?.slug===selectedCategory)){for(const [key,value] of Object.entries(productFacets(p.specs))){if(!result[key])result[key]=[];if(!result[key].includes(value))result[key].push(value);}}return Object.entries(result).filter(([key]) => !["Current rating", "Module", "Wattage"].includes(key)).filter(([,values])=>values.length>1&&values.length<=40).sort(([a],[b])=>a.localeCompare(b));},[initialProducts,selectedCategory]);
  const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em]";
  const fieldClass =
    "w-full h-10 px-4 border border-ink/10 rounded-xl bg-paper/70 focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 focus:bg-white text-sm text-ink transition-all";

  const filterPanel = (
    <div className="flex flex-col gap-6">
      {/* Active filters pill tray */}
      {activeFilterCount > 0 && (
        <div className="flex flex-col gap-2 pb-5 border-b border-ink/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Active filters</span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-semibold text-gold-dark hover:text-ink transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold/15 text-ink border border-gold/30 hover:bg-gold/25 transition-all cursor-pointer"
                title="Remove search filter"
              >
                <span>&ldquo;{searchQuery}&rdquo;</span>
                <X size={11} className="text-slate-500" />
              </button>
            )}
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold/15 text-ink border border-gold/30 hover:bg-gold/25 transition-all cursor-pointer"
                title="Remove category filter"
              >
                <span>{categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span>
                <X size={11} className="text-slate-500" />
              </button>
            )}
            {brandGroups
              .filter((g) => g.slugs.some((slug) => selectedBrands.includes(slug)))
              .map((br) => (
                <button
                  key={br.name}
                  type="button"
                  onClick={() => handleBrandToggle(br.slugs)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold/15 text-ink border border-gold/30 hover:bg-gold/25 transition-all cursor-pointer"
                  title={`Remove brand ${br.name}`}
                >
                  <span>{br.name}</span>
                  <X size={11} className="text-slate-500" />
                </button>
              ))}
            {Object.entries(selectedFacets)
              .filter(([, v]) => Boolean(v))
              .map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    const next = { ...selectedFacets };
                    delete next[k];
                    setSelectedFacets(next);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ink text-gold-light border border-ink hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
                  title={`Remove ${k} filter`}
                >
                  <span className="text-white/60">{k}:</span>
                  <span>{v}</span>
                  <X size={11} className="text-gold-light/70" />
                </button>
              ))}
            {priceRange < MAX_PRICE && (
              <button
                type="button"
                onClick={() => setPriceRange(MAX_PRICE)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold/15 text-ink border border-gold/30 hover:bg-gold/25 transition-all cursor-pointer"
                title="Reset price limit"
              >
                <span>≤ ₹{formatINR(priceRange)}</span>
                <X size={11} className="text-slate-500" />
              </button>
            )}
            {inStockOnly && (
              <button
                type="button"
                onClick={() => setInStockOnly(false)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold/15 text-ink border border-gold/30 hover:bg-gold/25 transition-all cursor-pointer"
              >
                <span>In stock</span>
                <X size={11} className="text-slate-500" />
              </button>
            )}
            {offersOnly && (
              <button
                type="button"
                onClick={() => setOffersOnly(false)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold/15 text-ink border border-gold/30 hover:bg-gold/25 transition-all cursor-pointer"
              >
                <span>Offers</span>
                <X size={11} className="text-slate-500" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Search</label>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, brand or SKU"
            className={`${fieldClass} pl-10 pr-9`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink p-1 rounded-full cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className={labelClass}>Category</label>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className="text-[11px] font-medium text-gold-dark hover:text-ink transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className={`${fieldClass} cursor-pointer`}
        >
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

      {/* Brands */}
      <div className="flex flex-col gap-2.5 pt-5 border-t border-ink/[0.08]">
        <div className="flex items-center justify-between">
          <label className={labelClass}>Brands</label>
          {selectedBrands.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedBrands([])}
              className="text-[11px] font-medium text-gold-dark hover:text-ink transition-colors cursor-pointer"
            >
              Clear ({selectedBrands.length})
            </button>
          )}
        </div>
        <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto -mx-1 px-1 pr-2 scrollbar-thin">
          {brandGroups.map((br) => {
            const isSelected = br.slugs.some((slug) => selectedBrands.includes(slug));
            return (
              <button
                key={br.name}
                type="button"
                onClick={() => handleBrandToggle(br.slugs)}
                aria-pressed={isSelected}
                className={`flex items-center justify-between text-left text-xs py-2 px-2.5 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? "bg-ink/[0.05] text-ink font-semibold"
                    : "hover:bg-paper text-slate-700"
                }`}
              >
                <span className="truncate">{br.name}</span>
                <span
                  className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                    isSelected ? "bg-ink border-ink text-gold-light" : "border-ink/20 bg-white"
                  }`}
                >
                  {isSelected && <Check size={11} strokeWidth={3.5} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Specifications / Facets as tactile chip badges */}
      {facetOptions.length > 0 && (
        <div className="flex flex-col gap-4 pt-5 border-t border-ink/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-gold-dark" />
              <span className="text-[11px] font-bold text-ink tracking-wider uppercase">Specifications</span>
            </div>
            {Object.values(selectedFacets).some(Boolean) && (
              <button
                type="button"
                onClick={() => setSelectedFacets({})}
                className="text-[11px] font-semibold text-gold-dark hover:text-ink transition-colors cursor-pointer"
              >
                Clear specs
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {facetOptions.map(([key, values]) => {
              const selectedVal = selectedFacets[key];
              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{key}</span>
                    {selectedVal && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold/15 text-gold-dark border border-gold/30">
                        {selectedVal}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {values.sort().map((val) => {
                      const isSelected = selectedVal === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              const next = { ...selectedFacets };
                              delete next[key];
                              setSelectedFacets(next);
                            } else {
                              setSelectedFacets({ ...selectedFacets, [key]: val });
                            }
                          }}
                          className={`h-8 px-3 rounded-xl text-xs font-medium border transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-ink text-gold-light border-ink shadow-sm ring-1 ring-gold/40 font-semibold"
                              : "bg-paper/70 text-slate-700 border-ink/10 hover:border-gold/50 hover:bg-white hover:text-ink"
                          }`}
                        >
                          {getFacetColorDot(key, val)}
                          <span>{val}</span>
                          {isSelected && <Check size={12} strokeWidth={3} className="text-gold" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range with presets */}
      <div className="flex flex-col gap-3 pt-5 border-t border-ink/[0.08]">
        <div className="flex justify-between items-center">
          <label className={labelClass}>Max price</label>
          <span className="text-sm font-bold text-ink">
            {priceRange >= MAX_PRICE ? "Any price" : `₹${formatINR(priceRange)}`}
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
        {/* Quick price chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {[
            { label: "All", val: MAX_PRICE },
            { label: "< ₹500", val: 500 },
            { label: "< ₹1,500", val: 1500 },
            { label: "< ₹3,000", val: 3000 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPriceRange(preset.val)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                priceRange === preset.val
                  ? "bg-ink text-gold-light border-ink font-semibold"
                  : "bg-paper/60 text-slate-600 border-ink/10 hover:border-gold/40 hover:bg-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* In stock & Offers switches */}
      <div className="flex flex-col gap-3 pt-5 border-t border-ink/[0.08]">
        {[
          { label: "In stock only", checked: inStockOnly, set: setInStockOnly },
          { label: "Offers only", checked: offersOnly, set: setOffersOnly },
        ].map((opt) => (
          <label key={opt.label} className="flex items-center justify-between cursor-pointer text-sm text-slate-700 select-none">
            <span className="font-medium text-xs text-slate-700">{opt.label}</span>
            <input type="checkbox" checked={opt.checked} onChange={(e) => opt.set(e.target.checked)} className="peer sr-only" />
            <span className="relative w-9 h-5 rounded-full bg-ink/15 peer-checked:bg-ink transition-colors after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4 shadow-inner" />
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Category pills with mobile scroll fade */}
      <div className="relative mb-8">
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
          {[{ slug: "", name: "All" }, ...parentCategories].map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug || "all"}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex-shrink-0 h-10 px-5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                  active
                    ? "bg-ink text-white border-ink shadow-sm"
                    : "bg-white text-slate-600 border-ink/10 hover:border-gold/60 hover:text-ink active:bg-paper"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
          <button
            onClick={() => setOffersOnly(!offersOnly)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
              offersOnly ? "bg-gold text-ink border-gold shadow-sm" : "bg-gold/10 text-gold-dark border-gold/30 hover:bg-gold/20"
            }`}
          >
            <BadgePercent size={15} />
            Offers
          </button>
        </div>
        {/* Right edge fade hint for mobile horizontal scroll */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-paper to-transparent sm:hidden" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-3">
          <div className="card-lux !transform-none p-5 sm:p-6 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ink/10 rounded-2xl bg-white/95 backdrop-blur-md">
            <div className="flex justify-between items-center pb-4 mb-5 border-b border-ink/[0.08]">
              <h2 className="font-bold text-ink flex items-center gap-2 text-base">
                <SlidersHorizontal size={17} className="text-gold-dark" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gold text-ink text-[11px] font-bold inline-flex items-center justify-center shadow-xs">
                    {activeFilterCount}
                  </span>
                )}
              </h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-gold-dark hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw size={12} />
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

          {initialProducts.some((product) => product.images?.some((image) => image.url.includes('/lisha-catalogue/'))) && (
            <p className="text-sm text-slate-500 mb-6">
              {t("Additional sizes and finishes are listed in the catalogue references on product pages.", "കൂടുതൽ സൈസുകളും നിറങ്ങളും പ്രൊഡക്റ്റ് പേജിലെ കാറ്റലോഗ് റഫറൻസിൽ കാണാം.")}
            </p>
          )}
          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.slice(0, visibleCount).map((prod) => (
                  <ProductCard key={prod.id} product={prod} showAddToCart />
                ))}
              </div>
              {filteredProducts.length > visibleCount && (
                <div className="flex flex-col items-center justify-center mt-10 gap-3 pb-6">
                  <p className="text-xs text-slate-500 font-medium">
                    Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} products
                  </p>
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                    className="btn-dark px-8 py-3 text-sm font-semibold cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    Load more products
                  </button>
                </div>
              )}
            </>
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
          <div ref={filterDialogRef} role="dialog" aria-modal="true" aria-labelledby="filter-title" className="w-[88vw] max-w-sm bg-white h-full flex flex-col shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-ink/[0.06]">
              <h2 id="filter-title" className="font-semibold text-ink text-lg">Filters</h2>
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
