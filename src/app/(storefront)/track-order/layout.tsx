import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order | Goodwill Electrical World",
  description: "Check the status of your Goodwill Electrical World order.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
