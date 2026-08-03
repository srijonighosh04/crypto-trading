import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const capitalizedId = id.charAt(0).toUpperCase() + id.slice(1);
  return {
    title: `${capitalizedId} Profile`,
    description: `Real-time candlestick chart, price updates, and market statistics for ${capitalizedId} on ApexCrypto.`,
  };
}

export default function CoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
