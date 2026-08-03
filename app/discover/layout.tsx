import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover",
  description: "Discover trending crypto assets, top market movers, gainers, losers, and industry sectors.",
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
