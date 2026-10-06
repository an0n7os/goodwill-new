import { create } from "zustand";
import { persist } from "zustand/middleware";

// Display copy of the signed-in customer. The real session is Better Auth's
// httpOnly cookie; Header re-syncs this store from it on load.
export interface CustomerUser {
  id: string;
  name: string;
  phone: string | null;
  email?: string | null;
  image?: string | null;
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
      version: 2,
      // Older copies came from the pre-Better Auth sessions; drop them and re-sync from the server
      migrate: () => ({ user: null }) as unknown as CustomerAuthStore,
    }
  )
);
