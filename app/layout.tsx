import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Backtest Lab — Walk-Forward Strategy Validation",
  description:
    "Vectorised backtester for momentum, mean-reversion, vol-targeted carry, and pairs strategies with walk-forward analysis, transaction costs, slippage, regime decomposition, and full risk metrics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
