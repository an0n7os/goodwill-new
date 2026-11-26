"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowRight, Sparkles, LogIn } from "lucide-react";
import ProductCard from "@/components/storefront/ProductCard";
import CustomerAuthModal from "@/components/auth/CustomerAuthModal";
import { useFavoritesStore } from "@/store/favorites";
import { useCustomerAuthStore } from "@/store/customerAuth";
import { useCartStore } from "@/store/cart";
import { getFavoriteProductsByIds } from "@/lib/customerSync";
import { useHydrated } from "@/lib/useHydrated";
import type { CatalogueListProduct } from "@/lib/catalogTypes";

export default function WishlistClient() {
  const favorites = useFavoritesStore((s) => s.favorites);
  const user = useCustomerAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const mounted = useHydrated();

  const [products, setProducts] = useState<CatalogueListProduct[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [moveAllStatus, setMoveAllStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load products whenever favorites change
  useEffect(() => {
    if (!mounted || favorites.length === 0) return;
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) setIsFetching(true);
    });

    getFavoriteProductsByIds(favorites)
      .then((items) => {
        if (!cancelled) {
          setProducts(items as unknown as CatalogueListProduct[]);
          setIsFetching(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load wishlist products:", err);
        if (!cancelled) setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [favorites, mounted]);

  const activeProducts = favorites.length === 0 ? [] : products;
  const loading = !mounted || (favorites.length > 0 && isFetching && activeProducts.length === 0);

  const handleAddAllToCart = () => {
    startTransition(() => {
      let count = 0;
      for (const p of activeProducts) {
        if (p.stock > 0 && p.price > 0 && (!p.variants || p.variants.length === 0)) {
          addItem(
            {
              id: p.id,
              productId: p.id,
              name: p.name,
              price: p.price,
              image: p.images?.[0]?.url || "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=200",
              quantity: 1,
              sku: p.sku,
              unit: p.unit,
              stock: p.stock,
              gstRate: p.gstRate,
            },
            Boolean(user?.id)
          );
          count++;
        }
      }
      setMoveAllStatus(`Added ${count} available items to your cart!`);
      setTimeout(() => setMoveAllStatus(null), 3000);
    });
  };

  if (!mounted || loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading your saved items…</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Sign-in prompt for guest users to save permanently across devices */}
      {!user && favorites.length > 0 && (
        <div className="mb-8 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-gold/10 to-transparent border border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-gold/20 text-gold-dark flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Sign in to save favorites to your account</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Your saved items will automatically sync across your phone, tablet, and PC.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="btn-gold !py-2 !px-4 text-xs font-semibold whitespace-nowrap flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <LogIn size={14} />
            <span>Sign in to sync</span>
          </button>
        </div>
      )}

      {activeProducts.length === 0 ? (
        <div className="card-lux !transform-none p-10 md:p-16 text-center max-w-lg mx-auto bg-white border border-ink/[0.08]">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Heart size={28} className="fill-rose-100 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-ink">No saved items yet</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
            Browse our catalog and tap the heart icon on any product to save it here for later.
          </p>
          <Link
            href="/products"
            className="btn-primary inline-flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full"
          >
            <span>Explore catalog</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-ink/[0.06]">
            <div>
              <span className="text-sm font-medium text-slate-600">
                You have <strong className="text-ink font-semibold">{activeProducts.length}</strong> saved {activeProducts.length === 1 ? "item" : "items"}
              </span>
              {moveAllStatus && (
                <p className="text-xs font-medium text-emerald-600 mt-1 animate-fade-in">{moveAllStatus}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddAllToCart}
                disabled={isPending}
                className="btn-outline !py-2 !px-4 text-xs font-semibold flex items-center gap-2 cursor-pointer hover:border-ink hover:text-ink"
              >
                <ShoppingBag size={14} />
                <span>Add available to cart</span>
              </button>
              <Link
                href="/cart"
                className="btn-gold !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>View cart</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {activeProducts.map((p) => (
              <ProductCard key={p.id} product={p} showAddToCart />
            ))}
          </div>
        </div>
      )}

      <CustomerAuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
