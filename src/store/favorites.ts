import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncCustomerFavorites, toggleCustomerFavoriteAction } from "@/lib/customerSync";
import { useCustomerAuthStore } from "./customerAuth";

interface FavoritesStore {
  favorites: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string, isCustomerSignedIn?: boolean) => Promise<void>;
  setFavorites: (favorites: string[]) => void;
  syncWithServer: () => Promise<void>;
}

function isUserSignedIn(explicit?: boolean): boolean {
  if (typeof explicit === "boolean") return explicit;
  try {
    return Boolean(useCustomerAuthStore.getState().user?.id);
  } catch {
    return false;
  }
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      isFavorite: (productId: string) => {
        return get().favorites.includes(productId);
      },

      toggleFavorite: async (productId: string, isCustomerSignedIn) => {
        const current = get().favorites;
        const exists = current.includes(productId);
        const updated = exists ? current.filter((id) => id !== productId) : [...current, productId];

        // Optimistic local update
        set({ favorites: updated });

        // If signed in, persist to backend
        if (isUserSignedIn(isCustomerSignedIn)) {
          try {
            const res = await toggleCustomerFavoriteAction(productId);
            if (res.ok && res.signedIn) {
              set({ favorites: res.favorites });
            }
          } catch (error) {
            console.error("Failed to sync favorite toggle to server:", error);
          }
        }
      },

      setFavorites: (favorites: string[]) => {
        set({ favorites });
      },

      syncWithServer: async () => {
        const local = get().favorites;
        try {
          const res = await syncCustomerFavorites(local);
          if (res.ok && res.signedIn) {
            set({ favorites: res.favorites });
          }
        } catch (error) {
          console.error("Failed to sync favorites with server:", error);
        }
      },
    }),
    {
      name: "goodwill-favorites-storage",
    }
  )
);
