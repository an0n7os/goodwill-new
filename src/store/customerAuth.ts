import { create } from "zustand";
import { persist } from "zustand/middleware";

// Display copy of the signed-in customer. The real session is the httpOnly
// cookie set by the server; Header re-syncs this store from it on load.
export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
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
