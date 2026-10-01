import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart | Goodwill Electrical World",
  description: "Review the items in your cart before checkout.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
