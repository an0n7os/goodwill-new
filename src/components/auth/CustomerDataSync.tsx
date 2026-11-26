"use client";

import { useEffect, useRef } from "react";
import { useCustomerAuthStore } from "@/store/customerAuth";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";

/**
 * Automatically syncs customer Cart & Saved Favorites with the database:
 * - When a user logs in (or visits signed-in):
 *   - Merges guest items/favorites into their account database.
 *   - Restores any previously saved cart & favorites from their account.
 */
export default function CustomerDataSync() {
  const user = useCustomerAuthStore((s) => s.user);
  const syncWithServerCart = useCartStore((s) => s.syncWithServer);
  const syncWithServerFavs = useFavoritesStore((s) => s.syncWithServer);
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      if (lastSyncedUserId.current !== user.id) {
        lastSyncedUserId.current = user.id;
        // Run both syncs in parallel
        Promise.all([syncWithServerCart(), syncWithServerFavs()]).catch((err) => {
          console.error("Customer cart/favorites sync error:", err);
        });
      }
    } else {
      lastSyncedUserId.current = null;
    }
  }, [user?.id, syncWithServerCart, syncWithServerFavs]);

  return null;
}
