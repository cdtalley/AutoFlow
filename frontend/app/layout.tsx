import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteConfigProvider } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "AutoFlow";
const tagline =
  process.env.NEXT_PUBLIC_APP_TAGLINE?.trim() ||
  "Multi-agent inquiry automation — classify, route, respond, escalate.";

export const metadata: Metadata = {
  title: `${appName} · Control Center`,
  description: tagline,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <SiteConfigProvider>{children}</SiteConfigProvider>
      </body>
    </html>
  );
}
