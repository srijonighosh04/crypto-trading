import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markets",
  description: "Explore live cryptocurrency prices, 24h changes, market capitalization, and volume rankings on ApexCrypto.",
};

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
