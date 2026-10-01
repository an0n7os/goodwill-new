"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { useLanguageStore } from "@/store/language";
import { ShoppingCart, MessageSquare, Check, ShieldAlert, Truck, ChevronRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { formatINR, FREE_DELIVERY_THRESHOLD, DELIVERY_CHARGE } from "@/lib/pricing";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";

interface ProductDetailClientProps {
  product: any;
  relatedProducts: any[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { t } = useLanguageStore();
  const addItem = useCartStore((state) => state.addItem);

  // States
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<{
    checked: boolean;
    available: boolean;
    charge: number;
    days: string;
  } | null>(null);

  // Feedback notifications
  const [addedToCart, setAddedToCart] = useState(false);

  // Get current active variant details
  const activeVariant = useMemo(() => {
    if (!selectedVariantId || !product.variants) return null;
    return product.variants.find((v: any) => v.id === selectedVariantId);
  }, [selectedVariantId, product.variants]);

  // Derived Values
  const price = activeVariant ? activeVariant.price : product.price;
  // Variants have no MRP column: scale the product's MRP by the variant price so the discount % stays consistent
  const mrp = activeVariant
    ? product.price > 0
      ? Math.round((activeVariant.price * product.mrp) / product.price)
      : activeVariant.price
    : product.mrp;
  const stock = activeVariant ? activeVariant.stock : product.stock;
  const sku = activeVariant ? activeVariant.sku : product.sku;
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  // Variant Display Name
  const variantNameString = activeVariant ? activeVariant.name : "";

  // Read page URL after mount so server and client render the same href
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => setPageUrl(window.location.href), []);

  // Dynamic WhatsApp pre-fill text
  const whatsappUrl = useMemo(() => {
    const text = `Hi Goodwill, I am interested in:
Product: ${product.name}
${variantNameString ? `Variant: ${variantNameString}` : ""}
SKU: ${sku}
Price: ₹${price}
Link: ${pageUrl}`;
    return `https://wa.me/919744164444?text=${encodeURIComponent(text)}`;
  }, [product.name, variantNameString, sku, price, pageUrl]);

  // Handle Add to Cart
  const handleAddToCart = () => {
    addItem({
      id: selectedVariantId || product.id,
      productId: product.id,
      name: product.name,
      price: price,
      image: product.images?.[0]?.url || "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=200",
      quantity: quantity,
      variantName: variantNameString || null,
      sku: sku,
      unit: product.unit,
      stock: stock,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Pincode checker — mirrors the Delivery Policy (local area only; charge depends on order value)
  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6) return;

    const pin = parseInt(pincode);
    const orderValue = price * quantity;
    const charge = orderValue >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;

    // Shoranur / Kulappully / Cheruthuruthy and nearby 6791xx pincodes are served by our own vehicles
    if ([679121, 679122, 679123, 679531].includes(pin)) {
      setDeliveryStatus({ checked: true, available: true, charge, days: "usually same or next working day" });
    } else if (pin >= 679101 && pin <= 679599) {
      setDeliveryStatus({ checked: true, available: true, charge, days: "usually 1–2 working days" });
    } else {
      setDeliveryStatus({ checked: true, available: false, charge: 0, days: "" });
    }
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

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 min-w-0">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <ChevronRight size={12} className="flex-shrink-0" />
        <Link href="/products" className="hover:text-ink transition-colors">Products</Link>
        {product.category && (
          <>
            <ChevronRight size={12} className="flex-shrink-0" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink transition-colors whitespace-nowrap">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} className="flex-shrink-0" />
        <span className="text-slate-600 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-16 md:mb-24">
        {/* Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="aspect-square rounded-[2rem] overflow-hidden bg-white border border-ink/[0.06] relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images?.[activeImageIndex]?.url || "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=900"}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            {discountPercent > 0 && (
              <span className="absolute top-5 left-5 bg-white/95 backdrop-blur text-ink text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                −{discountPercent}%
              </span>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Show image ${idx + 1}`}
                  className={`w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-white border-2 transition-all ${
                    activeImageIndex === idx ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32 flex flex-col gap-7">
            <div>
              <span className="eyebrow">{product.brand?.name ?? "Genuine product"}</span>
              <h1 className="text-3xl md:text-[2.5rem] font-semibold text-ink tracking-[-0.03em] leading-[1.1] mt-4">
                {t(product.name, product.nameML)}
              </h1>
              <p className="text-xs text-slate-400 mt-3">
                SKU {sku} · Sold per {product.unit}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 flex-wrap pb-7 border-b border-ink/[0.08]">
              <span className="text-4xl font-semibold text-ink tracking-tight leading-none">₹{formatINR(price)}</span>
              {mrp > price && (
                <>
                  <span className="text-base text-slate-400 line-through leading-none mb-0.5">₹{formatINR(mrp)}</span>
                  <span className="text-xs font-semibold text-gold-dark bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-full mb-0.5">
                    Save ₹{formatINR(mrp - price)}
                  </span>
                </>
              )}
              <span className="w-full text-xs text-slate-500 mt-1">Inclusive of all taxes · GST invoice provided</span>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  {t("Size / variant", "ലഭ്യമായ അളവുകൾ")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: any) => {
                    const isSelected = selectedVariantId === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`h-10 px-5 rounded-full text-sm font-medium transition-all border ${
                          isSelected ? "bg-ink border-ink text-white" : "bg-white border-ink/10 text-slate-700 hover:border-gold/60"
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & actions */}
            <div className="flex flex-col gap-3">
              {stock > 0 ? (
                <>
                  <p className="text-sm text-emerald-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    In stock{stock <= 10 ? ` — only ${stock} left` : ""}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-ink/10 rounded-full bg-white h-12 px-1.5">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        aria-label="Decrease quantity"
                        className="w-9 h-9 rounded-full hover:bg-paper flex items-center justify-center text-lg text-slate-600"
                      >
                        −
                      </button>
                      <span className="font-semibold text-sm text-ink w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                        aria-label="Increase quantity"
                        className="w-9 h-9 rounded-full hover:bg-paper flex items-center justify-center text-lg text-slate-600"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className={`flex-1 h-12 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        addedToCart ? "bg-emerald-600 text-white" : "bg-ink hover:bg-ink-2 text-white hover:-translate-y-0.5"
                      }`}
                    >
                      {addedToCart ? <Check size={17} /> : <ShoppingCart size={17} />}
                      <span>{addedToCart ? t("Added to cart", "കാർട്ടിൽ ചേർത്തു!") : t("Add to cart", "കാർട്ടിൽ ചേർക്കുക")}</span>
                    </button>
                  </div>
                  {addedToCart && (
                    <Link href="/cart" className="link-arrow w-fit text-sm">
                      View cart & checkout <ChevronRight size={14} />
                    </Link>
                  )}
                </>
              ) : (
                <div className="bg-paper border border-ink/10 rounded-2xl p-4 flex items-start gap-3 text-slate-700 text-sm">
                  <ShieldAlert size={18} className="flex-shrink-0 text-gold-dark mt-0.5" />
                  <span>Currently out of stock. Message us on WhatsApp — we can usually source it within a few days.</span>
                </div>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-full border border-ink/10 bg-white hover:border-emerald-400 hover:bg-emerald-50/60 text-ink font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare size={16} className="text-emerald-600" />
                <span>{t("Ask about this on WhatsApp", "വില വിവരങ്ങൾ വാട്സാപ്പിൽ ചോദിക്കുക")}</span>
              </a>
            </div>

            {/* Assurance */}
            <ul className="grid grid-cols-3 gap-px bg-ink/[0.07] rounded-2xl overflow-hidden border border-ink/[0.07] text-center">
              {[
                { icon: BadgeCheck, label: "100% genuine" },
                { icon: ShieldCheck, label: "Brand warranty" },
                { icon: Truck, label: "Free delivery ₹1,000+" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="bg-white px-2 py-4 flex flex-col items-center gap-2">
                  <Icon size={18} className="text-gold-dark" strokeWidth={1.75} />
                  <span className="text-[11px] text-slate-600 leading-tight">{label}</span>
                </li>
              ))}
            </ul>

            {/* Delivery pincode checker */}
            <div>
              <h2 className="text-sm font-medium text-ink mb-3 flex items-center gap-2">
                <Truck size={15} className="text-gold-dark" />
                Check delivery to your pincode
              </h2>
              <form onSubmit={handlePincodeCheck} className="relative max-w-sm">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit pincode"
                  className="w-full h-11 pl-5 pr-24 border border-ink/10 rounded-full bg-white focus:outline-none focus:ring-4 focus:ring-gold/15 focus:border-gold/60 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-5 rounded-full bg-ink hover:bg-ink-2 text-white text-xs font-semibold transition-colors"
                >
                  Check
                </button>
              </form>

              {deliveryStatus &&
                (deliveryStatus.available ? (
                  <p className="mt-3 text-sm text-slate-700 flex items-start gap-2 animate-fade-in">
                    <Check size={15} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>
                      We deliver here — {deliveryStatus.days}.{" "}
                      {deliveryStatus.charge === 0
                        ? "Free delivery for this order."
                        : `₹${formatINR(deliveryStatus.charge)} delivery (free on orders ₹${formatINR(FREE_DELIVERY_THRESHOLD)}+).`}
                    </span>
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-slate-700 flex items-start gap-2 animate-fade-in">
                    <ShieldAlert size={15} className="text-gold-dark mt-0.5 flex-shrink-0" />
                    <span>
                      Outside our regular delivery area. Choose store pickup, or{" "}
                      <a href="https://wa.me/919744164444" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-gold-dark">
                        ask us on WhatsApp
                      </a>{" "}
                      about delivery.
                    </span>
                  </p>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overview & specs */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16 md:mb-24">
        <div className="lg:col-span-7 card-lux !transform-none p-7 md:p-9">
          <span className="eyebrow">Overview</span>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line mt-5">
            {t(product.description || "Genuine product supplied with manufacturer warranty and GST invoice.", product.descriptionML)}
          </p>
        </div>

        <div className="lg:col-span-5 card-lux !transform-none p-7 md:p-9 h-fit">
          <span className="eyebrow">Specifications</span>
          {Object.keys(parsedSpecs).length > 0 ? (
            <dl className="mt-5 flex flex-col divide-y divide-ink/[0.06]">
              {Object.entries(parsedSpecs).map(([key, val]: any, idx) => (
                <div key={idx} className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-slate-500 capitalize">{key}</dt>
                  <dd className="font-medium text-ink text-right">{val}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-400 mt-5">{t("No technical specs listed yet.", "രേഖപ്പെടുത്തിയിട്ടില്ല.")}</p>
          )}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="w-full">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="eyebrow">You may also need</span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-ink mt-4">
                {t("Related", "സമാനമായ")} <span className="font-display italic text-gold-dark">{t("products.", "ഉൽപ്പന്നങ്ങൾ")}</span>
              </h2>
            </div>
            <Link href="/products" className="link-arrow hidden sm:inline-flex">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} showAddToCart />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
