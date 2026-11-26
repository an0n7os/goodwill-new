import { create } from "zustand";
import { persist } from "zustand/middleware";
import { minimumQuantity } from "@/lib/units";
import { syncCustomerCart, persistCustomerCart, SyncCartInput } from "@/lib/customerSync";
import { useCustomerAuthStore } from "./customerAuth";

export interface CartItem {
  id: string; // unique identifier (variant ID if exists, otherwise product ID)
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variantName?: string | null;
  sku: string;
  unit: string;
  stock: number;
  gstRate?: number;
}

export interface CartCoupon {
  code: string;
  type: string;
  value: number;
  maxDiscount?: number | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem, isCustomerSignedIn?: boolean) => void;
  removeItem: (id: string, isCustomerSignedIn?: boolean) => void;
  updateQuantity: (id: string, quantity: number, isCustomerSignedIn?: boolean) => void;
  clearCart: (isCustomerSignedIn?: boolean) => void;
  setItems: (items: CartItem[]) => void;
  syncWithServer: () => Promise<void>;
  coupon: CartCoupon | null;
  setCoupon: (coupon: CartCoupon | null) => void;
  refreshItems: (items: Omit<CartItem, "quantity">[]) => void;
}

function toSyncInputs(items: CartItem[]): SyncCartInput[] {
  return items.map((i) => ({
    id: i.id,
    productId: i.productId,
    variantId: i.variantName ? i.id : null,
    quantity: i.quantity,
  }));
}

function isUserSignedIn(explicit?: boolean): boolean {
  if (typeof explicit === "boolean") return explicit;
  try {
    return Boolean(useCustomerAuthStore.getState().user?.id);
  } catch {
    return false;
  }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      setItems: (items) => set({ items }),

      addItem: (newItem, isCustomerSignedIn) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex((item) => item.id === newItem.id);
          let nextItems: CartItem[];
          if (existingItemIndex > -1) {
            nextItems = [...state.items];
            const currentItem = nextItems[existingItemIndex];
            const newQuantity = Math.min(currentItem.quantity + newItem.quantity, newItem.stock);
            nextItems[existingItemIndex] = {
              ...currentItem,
              ...newItem,
              quantity: newQuantity,
            };
          } else {
            if (newItem.stock <= 0 || !(newItem.price > 0)) return state;
            nextItems = [
              ...state.items,
              {
                ...newItem,
                quantity: Math.min(Math.max(newItem.quantity, minimumQuantity(newItem.unit)), newItem.stock),
              },
            ];
          }

          if (isUserSignedIn(isCustomerSignedIn)) {
            persistCustomerCart(toSyncInputs(nextItems)).catch((err) => {
              console.error("Failed to persist cart item add:", err);
            });
          }

          return { items: nextItems };
        });
      },

      removeItem: (id, isCustomerSignedIn) => {
        set((state) => {
          const nextItems = state.items.filter((item) => item.id !== id);
          if (isUserSignedIn(isCustomerSignedIn)) {
            persistCustomerCart(toSyncInputs(nextItems)).catch((err) => {
              console.error("Failed to persist cart removal:", err);
            });
          }
          return { items: nextItems };
        });
      },

      updateQuantity: (id, quantity, isCustomerSignedIn) => {
        set((state) => {
          const nextItems = state.items.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.min(Math.max(quantity, minimumQuantity(item.unit)), item.stock) }
              : item
          );
          if (isUserSignedIn(isCustomerSignedIn)) {
            persistCustomerCart(toSyncInputs(nextItems)).catch((err) => {
              console.error("Failed to persist cart quantity:", err);
            });
          }
          return { items: nextItems };
        });
      },

      clearCart: (isCustomerSignedIn) => {
        set({ items: [], coupon: null });
        if (isUserSignedIn(isCustomerSignedIn)) {
          persistCustomerCart([]).catch((err) => {
            console.error("Failed to clear cart on server:", err);
          });
        }
      },

      syncWithServer: async () => {
        const local = toSyncInputs(get().items);
        try {
          const res = await syncCustomerCart(local);
          if (res.ok && res.signedIn) {
            set({ items: res.items });
          }
        } catch (error) {
          console.error("Failed to sync cart with server:", error);
        }
      },

      setCoupon: (coupon) => set({ coupon }),

      refreshItems: (updates) =>
        set((state) => ({
          items: state.items.map((item) => {
            const fresh = updates.find((i) => i.id === item.id);
            return fresh ? { ...item, ...fresh, quantity: item.quantity } : item;
          }),
        })),
    }),
    {
      name: "goodwill-cart-storage",
    }
  )
);
