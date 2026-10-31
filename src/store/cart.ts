import { create } from "zustand";
import { persist } from "zustand/middleware";
import {minimumQuantity} from '@/lib/units';

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
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  coupon: CartCoupon | null;
  setCoupon: (coupon: CartCoupon | null) => void;
  refreshItems:(items:Omit<CartItem,'quantity'>[])=>void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      addItem: (newItem) =>
        set((state) => {
          const existingItemIndex = state.items.findIndex((item) => item.id === newItem.id);
          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingItemIndex];
            const newQuantity = Math.min(currentItem.quantity + newItem.quantity, newItem.stock);
            updatedItems[existingItemIndex] = {
              ...currentItem,...newItem,
              quantity: newQuantity,
            };
            return { items: updatedItems };
          }
          if (newItem.stock <= 0 || !(newItem.price > 0)) return state;
          return { items: [...state.items, { ...newItem, quantity: Math.min(Math.max(newItem.quantity, minimumQuantity(newItem.unit)), newItem.stock) }] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.min(Math.max(quantity, minimumQuantity(item.unit)), item.stock) } : item
          ),
        })),
      clearCart: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
      refreshItems: updates=>set(state=>({items:state.items.map(item=>{const fresh=updates.find(i=>i.id===item.id);return fresh?{...item,...fresh,quantity:item.quantity}:item;})})),
    }),
    {
      name: "goodwill-cart-storage",
    }
  )
);
