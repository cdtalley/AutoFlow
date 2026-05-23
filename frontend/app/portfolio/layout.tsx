import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { PortfolioCaptureSurface } from "./PortfolioCaptureSurface";
import "./catalog-thumb.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-portfolio-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-portfolio-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${sans.variable} ${mono.variable} min-h-0 antialiased`}
      style={{ fontFamily: "var(--font-portfolio-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <PortfolioCaptureSurface>{children}</PortfolioCaptureSurface>
    </div>
  );
}
