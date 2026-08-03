import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Trades",
  description: "Stream real-time on-chain transaction logs and decentralized pool trades with speed and freeze controls.",
};

export default function TradesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
