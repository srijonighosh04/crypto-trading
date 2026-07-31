import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Link from "next/link";
import { 
  LayoutDashboard, 
  BarChart3, 
  RefreshCw, 
  ArrowLeftRight, 
  Compass,
  Wallet,
  Activity
} from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApexCrypto | Professional Crypto Analytics Dashboard",
  description: "Real-time market insights, charts, and converter for crypto traders. Power up your investments with ApexCrypto.",
};

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Markets", href: "#markets", icon: BarChart3 },
  { name: "Converter", href: "#converter", icon: RefreshCw },
  { name: "Trades", href: "#trades", icon: ArrowLeftRight },
  { name: "Discover", href: "#discover", icon: Compass },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-white">
        <Providers>
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-border bg-[#090A0F]/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Brand Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent p-2 text-white shadow-lg shadow-primary/20">
                  <Activity className="h-5 w-5 animate-pulse" />
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-text-primary to-accent bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                  Apex<span className="text-primary">Crypto</span>
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:text-white hover:bg-card-light transition-all duration-200"
                    >
                      <Icon className="h-4 w-4 text-accent" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Header Right Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-[#121420]/50 px-3 py-1.5 text-xs font-semibold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping"></span>
                  CoinGecko Connected
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-hover px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all">
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Workspace */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border bg-[#090A0F] py-6">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <p className="text-xs text-text-muted">
                &copy; {new Date().getFullYear()} ApexCrypto. All rights reserved. Data powered by CoinGecko API.
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
