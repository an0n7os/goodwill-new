import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk & Contractor Quote | Goodwill Electrical World",
  description: "Send your material list and get direct wholesale pricing for your project.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
