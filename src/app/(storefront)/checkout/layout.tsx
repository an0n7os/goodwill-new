import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Goodwill Electrical World",
  description: "Place your order with cash on delivery or store pickup.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
