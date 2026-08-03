import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Dashboard",
  description: "Stream real-time price tickers of your favorite cryptocurrencies in a custom live watchlist dashboard.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
