import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  provider?: string;
}

interface CustomerAuthStore {
  user: CustomerUser | null;
  login: (user: CustomerUser) => void;
  logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthStore>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "goodwill_customer_session",
    }
  )
);
