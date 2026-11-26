"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
import { useCustomerAuthStore } from "@/store/customerAuth";
import { useLanguageStore } from "@/store/language";
import {
  ShoppingCart,
  MessageSquare,
  Check,
  CheckCircle2,
  Heart,
  Truck,
  ChevronRight,
  ChevronLeft,
  BadgeCheck,
  Star,
  Zap,
  Sparkles,
  Share2,
  Maximize2,
  X,
} from "lucide-react";
import { formatINR, isPriceOnRequest } from "@/lib/pricing";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import ProductReviewsSection from "@/components/storefront/ProductReviewsSection";
import type { CatalogueProduct, CatalogueListProduct } from "@/lib/catalogTypes";
import type { ProductReviewsSummary } from "@/lib/actions";
import { getDeliveryQuote } from "@/lib/businessActions";
import { minimumQuantity } from "@/lib/units";
import { useHydrated } from "@/lib/useHydrated";

interface ProductDetailClientProps {
  product: CatalogueProduct;
  relatedProducts: CatalogueListProduct[];
  reviewsSummary: ProductReviewsSummary;
}

export default function ProductDetailClient({
  product,
  relatedProducts,
  reviewsSummary,
}: ProductDetailClientProps) {
  const router = useRouter();
  const photographedRelatedProducts = relatedProducts.filter(
    (item) =>
      (!item.images?.length && !item.sku.startsWith("LISHA-")) ||
      item.images.some((image) => !image.url.includes("/lisha-catalogue/"))
  );
  const { t } = useLanguageStore();
  const addItem = useCartStore((state) => state.addItem);
  const user = useCustomerAuthStore((state) => state.user);
  const isFav = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const handleToggleFavorite = () => {
    toggleFavorite(product.id, Boolean(user?.id));
  };

  // States
  const [activeTab, setActiveTab] = useState<"specs" | "overview" | "reviews">("specs");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants && product.variants.length > 0
      ? product.variants.find((v) => v.stock > 0)?.id ?? product.variants[0].id
      : null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<{
    checked: boolean;
    available: boolean;
    charge: number;
    days: string;
    location?: string | null;
  } | null>(null);

  // Modals & UI States
  const [addedToCart, setAddedToCart] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isReviewsDrawerOpen, setIsReviewsDrawerOpen] = useState(false);

  // Get current active variant details
  const activeVariant = useMemo(() => {
    if (!selectedVariantId || !product.variants) return null;
    return product.variants.find((v) => v.id === selectedVariantId);
  }, [selectedVariantId, product.variants]);

  // Derived Values
  const price = activeVariant ? activeVariant.price : product.price;
  const mrp = activeVariant
    ? product.price > 0
      ? Math.round((activeVariant.price * product.mrp) / product.price)
      : activeVariant.price
    : product.mrp;
  const stock = activeVariant ? activeVariant.stock : product.stock;
  const sku = activeVariant ? activeVariant.sku : product.sku;
  const onRequest = isPriceOnRequest(price);
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const variantNameString = activeVariant ? activeVariant.name : "";

  // Read page URL after mount so server and client render the same href
  const hydrated = useHydrated();
  const pageUrl = hydrated ? window.location.href : "";

  // Dynamic WhatsApp pre-fill text
  const whatsappUrl = useMemo(() => {
    const text = `Hi Goodwill Electrical World, I am interested in:
Product: ${product.name}
${variantNameString ? `Variant: ${variantNameString}` : ""}
SKU: ${sku}
${price > 0 ? `Price: ₹${price}` : "Please share the price and availability."}
Link: ${pageUrl}`;
    return `https://wa.me/919744164444?text=${encodeURIComponent(text)}`;
  }, [product.name, variantNameString, sku, price, pageUrl]);

  // Handle Add to Cart
  const handleAddToCart = () => {
    addItem(
      {
        id: selectedVariantId || product.id,
        productId: product.id,
        name: product.name,
        price: price,
        image:
          product.images?.[0]?.url ||
          "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=200",
        quantity: Math.min(quantity, stock),
        variantName: variantNameString || null,
        sku: sku,
        unit: product.unit,
        stock: stock,
        gstRate: product.gstRate,
      },
      Boolean(user?.id)
    );

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Direct 1-Click "Buy Now"
  const handleBuyNow = () => {
    addItem(
      {
        id: selectedVariantId || product.id,
        productId: product.id,
        name: product.name,
        price: price,
        image:
          product.images?.[0]?.url ||
          "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=200",
        quantity: Math.min(quantity, stock),
        variantName: variantNameString || null,
        sku: sku,
        unit: product.unit,
        stock: stock,
        gstRate: product.gstRate,
      },
      Boolean(user?.id)
    );
    router.push("/checkout");
  };

  // Direct Pincode check helper
  const checkPincodeDirect = async (pin: string) => {
    const clean = pin.trim();
    if (!clean || clean.length !== 6) return;
    setPincode(clean);
    setCheckingDelivery(true);
    try {
      if (typeof window !== "undefined") localStorage.setItem("goodwill_pincode", clean);
      const quote = await getDeliveryQuote(clean, price * quantity);
      setDeliveryStatus({
        checked: true,
        available: !!quote,
        charge: quote?.charge ?? 0,
        days: quote?.estimate ?? "",
        location: (quote as { location?: string | null })?.location || null,
      });
    } catch {
      setDeliveryStatus({
        checked: true,
        available: false,
        charge: 0,
        days: "Could not check delivery. Please try again.",
      });
    } finally {
      setCheckingDelivery(false);
    }
  };

  // Auto-fill pincode from previous checkout/memory if available
  useEffect(() => {
    try {
      const savedPin = typeof window !== "undefined" ? localStorage.getItem("goodwill_pincode") : null;
      if (savedPin && /^\d{6}$/.test(savedPin)) {
        queueMicrotask(() => {
          checkPincodeDirect(savedPin);
        });
      }
    } catch {}
    // Run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincodeDirect(pincode);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} at Goodwill Electrical World`,
          url: window.location.href,
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Parse specifications
  const parsedSpecs = useMemo(() => {
    if (!product.specs) return {};
    try {
      return typeof product.specs === "string" ? JSON.parse(product.specs) : product.specs;
    } catch {
      return {};
    }
  }, [product.specs]);

  const imagesList = product.images && product.images.length > 0 ? product.images : [];
  const currentImageUrl =
    imagesList[activeImageIndex]?.url ||
    "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=900";

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-28 md:pb-12">
      {/* Breadcrumbs & Share */}
      <div className="flex items-center justify-between gap-3 mb-6 min-w-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0 truncate">
          <Link href="/" className="hover:text-ink transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="flex-shrink-0" />
          <Link href="/products" className="hover:text-ink transition-colors">
            Products
          </Link>
          {product.category && (
            <>
              <ChevronRight size={12} className="flex-shrink-0" />
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-ink transition-colors whitespace-nowrap"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} className="flex-shrink-0" />
          <span className="text-slate-600 truncate">{product.name}</span>
        </nav>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-ink bg-white border border-ink/10 px-3 py-1.5 rounded-full transition-colors shrink-0 shadow-2xs cursor-pointer"
          title="Share product link"
        >
          <Share2 size={13} />
          <span>{copiedLink ? "Link Copied!" : "Share"}</span>
        </button>
      </div>

      {/* Reference Image Layout: Left Studio Showcase | Right Modern Slate Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch mb-12">
        {/* Left Column: Full-Bleed Studio Showcase (Matches Right Card Height & Zero White Space) */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-3.5 w-full h-full">
          {/* Main Showcase Frame: Full Bleed Image, Zero White Space, Matches Right Panel Height */}
          <div className="w-full flex-1 min-h-[380px] sm:min-h-[440px] lg:min-h-0 rounded-3xl overflow-hidden bg-slate-100 relative group border border-slate-200/80 shadow-xs flex items-center justify-center p-0 transition-all">
            {/* Full-Bleed Image: Fills the entire card edge-to-edge without white borders */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImageUrl}
              alt={product.name}
              className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.03]"
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* Discount Pill Overlay */}
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-xs text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10 flex items-center gap-1">
                <Sparkles size={11} className="text-gold" />
                −{discountPercent}% OFF
              </span>
            )}

            {/* Floating Top Right Actions: Favorite & Lightbox */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                aria-label="View full image"
                title="View full image"
                className="w-9 h-9 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 flex items-center justify-center shadow-xs backdrop-blur-xs transition-all cursor-pointer"
              >
                <Maximize2 size={14} />
              </button>

              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label={isFav ? "Remove from saved favorites" : "Save to favorites"}
                title={isFav ? "Saved to your favorites" : "Save to favorites"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs backdrop-blur-xs cursor-pointer ${
                  isFav
                    ? "bg-rose-50 text-rose-600 border border-rose-200 scale-105"
                    : "bg-white/85 text-slate-600 hover:text-rose-600 hover:bg-white border border-slate-200/80"
                }`}
              >
                <Heart size={15} className={isFav ? "fill-rose-500 text-rose-500" : ""} />
              </button>
            </div>

            {/* Chevron Navigation Controls if multiple images */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1))
                  }
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-slate-900 border border-slate-200/80 flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0))
                  }
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-slate-900 border border-slate-200/80 flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Counter Pill */}
                <span className="absolute bottom-3 right-4 text-[11px] font-mono font-medium text-slate-700 bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/50 shadow-2xs">
                  {activeImageIndex + 1} / {imagesList.length}
                </span>
              </>
            )}
          </div>

          {/* Thumbnails row (Rounded Square Cards) */}
          {imagesList.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto py-1 no-scrollbar w-full">
              {imagesList.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View photo ${idx + 1}`}
                  className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? "border-slate-900 shadow-md scale-102"
                      : "border-slate-200/80 opacity-70 hover:opacity-100 hover:scale-102"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Soft Tinted Panel matching reference layout */}
        <div className="lg:col-span-6 rounded-3xl bg-[#f5f7fb] border border-slate-200/60 p-6 sm:p-8 md:p-9 flex flex-col justify-between gap-4 shadow-xs h-full">
          <div>
            {/* Category / Brand Eyebrow */}
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              {product.brand?.name ?? product.category?.name ?? "PREMIUM COLLECTION"}
            </span>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {t(product.name, product.nameML)}
            </h1>

            {/* Rating Row (★ 4.8 · 24 Reviews) */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsReviewsDrawerOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                title="Read reviews"
              >
                <Star size={14} className="fill-amber-400 text-amber-500" />
                <span className="font-bold text-slate-900">{reviewsSummary.averageRating.toFixed(1)}/5</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 underline decoration-slate-300 underline-offset-2">
                  {reviewsSummary.totalReviews} Reviews
                </span>
              </button>

              <span className="text-slate-300">|</span>

              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <BadgeCheck size={12} className="text-emerald-600" />
                Verified Goodwill Stock
              </span>
            </div>
          </div>

          {/* Color / Variant Swatches (like the dots in reference) */}
          {product.variants && product.variants.length > 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Options:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedVariantId === v.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Aesthetic showroom finish dots */
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-300 ring-2 ring-slate-900 ring-offset-2 shadow-xs" />
              <span className="w-5 h-5 rounded-full bg-slate-800 ring-1 ring-slate-200 shadow-xs" />
            </div>
          )}

          {/* Short Description Paragraph */}
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md line-clamp-3">
            {t(
              product.description ||
                "Genuine manufacturer certified product with full warranty coverage, tested and packaged at Goodwill showroom.",
              product.descriptionML
            )}
          </p>

          {/* Boxed Specs Micro-Card (Exact match to reference HEIGHT 52cm | WIDTH 43cm) */}
          <div className="border border-slate-200 rounded-xl p-2.5 bg-white/90 max-w-md shadow-2xs">
            <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
              <div className="px-2">
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">BRAND</span>
                <span className="block text-xs font-bold text-slate-800 truncate">{product.brand?.name ?? "Goodwill"}</span>
              </div>
              <div className="px-2">
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">SKU</span>
                <span className="block text-xs font-mono font-bold text-slate-800 truncate">{sku}</span>
              </div>
              <div className="px-2">
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">GST RATE</span>
                <span className="block text-xs font-bold text-slate-800">{product.gstRate}% Included</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2.5 mt-1">
            {onRequest ? (
              <span className="text-2xl font-extrabold text-slate-900 font-sans">Price on request</span>
            ) : (
              <span className="text-3xl sm:text-4xl font-black text-slate-900 font-sans tracking-tight">
                ₹{formatINR(price)}
              </span>
            )}
            {mrp > price && (
              <>
                <span className="text-sm font-medium text-slate-400 line-through">₹{formatINR(mrp)}</span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Save ₹{formatINR(mrp - price)}
                </span>
              </>
            )}
          </div>

          {/* Quantity Stepper (Exact match to reference [ - ] 1 [ + ]) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(minimumQuantity(product.unit), quantity - 1))}
              aria-label="Decrease"
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              −
            </button>
            <span className="w-9 text-center font-bold text-sm text-slate-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              aria-label="Increase"
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-black text-white flex items-center justify-center font-bold text-sm shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              +
            </button>
            <span className="text-[11px] text-slate-400 ml-2 font-medium">Per {product.unit}</span>
            {stock > 0 && stock <= 10 && (
              <span className="ml-auto text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Only {stock} left
              </span>
            )}
          </div>

          {/* Action Buttons: [ ADD TO CART ] & [ BUY NOW ] (Exact Match to Reference Image) */}
          <div className="grid grid-cols-2 gap-3 mt-1 max-w-md">
            {/* Left: ADD TO CART (White, uppercase bold, rounded-xl) */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`h-12 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] ${
                addedToCart
                  ? "bg-emerald-600 text-white"
                  : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 hover:border-slate-300"
              }`}
            >
              {addedToCart ? <Check size={16} /> : <ShoppingCart size={16} className="text-slate-600" />}
              <span>{addedToCart ? "ADDED" : "ADD TO CART"}</span>
            </button>

            {/* Right: BUY NOW (Deep black, elevated with soft shadow, uppercase bold, rounded-xl) */}
            <button
              type="button"
              onClick={handleBuyNow}
              className="h-12 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase bg-[#0c0d12] hover:bg-black text-white shadow-xl shadow-slate-900/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <Zap size={15} className="text-gold fill-gold" />
              <span>BUY NOW</span>
            </button>
          </div>

          {/* Split Row: Pincode Check (Left 50%) + WhatsApp Chat (Right 50%) */}
          <div className="flex flex-col gap-1.5 max-w-md mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
              {/* Left: Compact Pincode Input */}
              <form onSubmit={handlePincodeSubmit} className="relative flex items-center">
                <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dark pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter Pincode (e.g. 679122)"
                  className="w-full h-9 pl-8 pr-16 border border-slate-200 rounded-xl bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={checkingDelivery || pincode.trim().length !== 6}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2.5 rounded-lg bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {checkingDelivery ? "…" : "Check"}
                </button>
              </form>

              {/* Right: Compact WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full h-9 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate px-3 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-800 shadow-2xs`}
                title="Chat on WhatsApp"
              >
                <MessageSquare size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">Chat on WhatsApp</span>
              </a>
            </div>

            {/* Delivery Result Line */}
            {deliveryStatus && (
              <div className="text-xs animate-fade-in">
                {deliveryStatus.available ? (
                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-2 shadow-2xs text-[11px]">
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      <Check size={12} className="text-emerald-600 shrink-0" />
                      {deliveryStatus.location || "Kerala"} · {deliveryStatus.days}
                    </span>
                    <span className="shrink-0 font-bold text-emerald-800">
                      {deliveryStatus.charge === 0 ? "Free Delivery" : `+₹${formatINR(deliveryStatus.charge)}`}
                    </span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate">Store pickup / transit outside Kerala</span>
                    <a
                      href="https://wa.me/919744164444"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 underline text-gold-dark font-semibold text-[10px]"
                    >
                      WhatsApp Us
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Minimal Unified Specifications & Overview Container */}
      <section id="product-tabs" className="mt-6 mb-12 card-lux !transform-none p-5 md:p-7">
        {/* Modern Tab Bar */}
        <div className="flex items-center gap-2 border-b border-ink/[0.08] pb-3 mb-5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "specs"
                ? "bg-ink text-white shadow-xs"
                : "text-slate-600 hover:text-ink hover:bg-paper/80"
            }`}
          >
            {t("Specifications", "സ്പെസിഫിക്കേഷൻസ്")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-ink text-white shadow-xs"
                : "text-slate-600 hover:text-ink hover:bg-paper/80"
            }`}
          >
            {t("Product Overview", "വിവരണം & ഫീച്ചറുകൾ")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "reviews"
                ? "bg-ink text-white shadow-xs"
                : "text-slate-600 hover:text-ink hover:bg-paper/80"
            }`}
          >
            <span>{t("Customer Reviews", "കസ്റ്റമർ റിവ്യൂസ്")}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "reviews" ? "bg-white/20 text-white" : "bg-ink/5 text-ink"
              }`}
            >
              {reviewsSummary.totalReviews}
            </span>
          </button>
        </div>

        {/* Tab 1: Specifications */}
        {activeTab === "specs" && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs">
              <div className="flex justify-between py-2 border-b border-ink/[0.05]">
                <span className="text-slate-500 font-medium">Brand</span>
                <span className="font-semibold text-ink text-right">{product.brand?.name ?? "Goodwill"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/[0.05]">
                <span className="text-slate-500 font-medium">SKU Code</span>
                <span className="font-mono text-ink text-right">{sku}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/[0.05]">
                <span className="text-slate-500 font-medium">Unit</span>
                <span className="font-medium text-ink text-right capitalize">{product.unit}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/[0.05]">
                <span className="text-slate-500 font-medium">GST Rate</span>
                <span className="font-medium text-ink text-right">{product.gstRate}% (Included in price)</span>
              </div>
              {Object.entries(parsedSpecs).map(([key, val], idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-ink/[0.05]">
                  <span className="text-slate-500 font-medium capitalize">{key}</span>
                  <span className="font-semibold text-ink text-right">{String(val)}</span>
                </div>
              ))}
            </div>

            {/* Compact Trust Highlights */}
            <div className="mt-5 pt-4 border-t border-ink/[0.07] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Wholesale Warranty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>GST Tax Invoice</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Kulappully Inspected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Local Support</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Overview */}
        {activeTab === "overview" && (
          <div className="animate-fade-in max-w-3xl">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">
              {t(
                product.description ||
                  "Genuine branded product supplied with full manufacturer warranty and GST invoice.",
                product.descriptionML
              )}
            </p>
            <div className="mt-5 pt-4 border-t border-ink/[0.07] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>100% Genuine authorized showroom stock</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Original tax invoice with full GST credit for contractors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Direct dispatch from Kulappully, Shoranur warehouse</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Immediate local counter replacement for defective items</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Reviews */}
        {activeTab === "reviews" && (
          <div className="animate-fade-in">
            <ProductReviewsSection
              productId={product.id}
              productName={product.name}
              initialSummary={reviewsSummary}
            />
          </div>
        )}
      </section>

      {/* Related Products */}
      {photographedRelatedProducts.length > 0 && (
        <section className="w-full mt-10">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <span className="eyebrow">You may also need</span>
              <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.03em] text-ink mt-1">
                {t("Related", "സമാനമായ")}{" "}
                <span className="font-display italic text-gold-dark">{t("products.", "ഉൽപ്പന്നങ്ങൾ")}</span>
              </h2>
            </div>
            <Link href="/products" className="link-arrow hidden sm:inline-flex text-xs">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-4">
            {photographedRelatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} showAddToCart />
            ))}
          </div>
        </section>
      )}

      {/* Reviews Slide-Over Drawer */}
      {isReviewsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsReviewsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col p-6 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between pb-4 border-b border-ink/10 mb-5">
              <div>
                <h3 className="text-lg font-bold text-ink">Ratings & Reviews</h3>
                <p className="text-xs text-slate-500">{product.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-paper hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                aria-label="Close reviews"
              >
                <X size={16} />
              </button>
            </div>

            <ProductReviewsSection
              productId={product.id}
              productName={product.name}
              initialSummary={reviewsSummary}
            />
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo Inspection */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close image preview"
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImageUrl}
            alt={product.name}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar with Direct BUY NOW */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-ink/10 px-4 py-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] flex items-center justify-between gap-2.5 safe-area-pb animate-fade-in">
        <div className="min-w-0 pr-1">
          <div className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">{product.name}</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-ink">
              {price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Ask Price"}
            </span>
            {stock > 0 ? (
              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                In Stock
              </span>
            ) : (
              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center text-emerald-600 bg-white active:bg-slate-50 shadow-2xs shrink-0"
            aria-label="WhatsApp Quote"
          >
            <MessageSquare size={17} />
          </a>

          {stock > 0 && (
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                addedToCart
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white border-ink/20 text-slate-700 active:bg-slate-100"
              }`}
              title="Add to cart"
            >
              {addedToCart ? <Check size={16} /> : <ShoppingCart size={16} />}
            </button>
          )}

          <button
            type="button"
            onClick={stock > 0 ? handleBuyNow : undefined}
            disabled={stock <= 0}
            className={`h-10 px-4 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
              stock > 0
                ? "bg-ink text-white active:bg-ink-2"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Zap size={14} className="text-gold fill-gold" />
            <span>{stock > 0 ? t("Buy Now", "വാങ്ങാം") : "Out of Stock"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
