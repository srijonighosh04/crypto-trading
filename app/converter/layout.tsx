import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Converter",
  description: "Instantly convert between major cryptocurrencies and fiat currencies with our real-time exchange rate calculator.",
};

export default function ConverterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
