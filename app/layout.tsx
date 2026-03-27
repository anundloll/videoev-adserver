import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VideoEV AdCP Sandbox",
  description: "EV Charging Retail Media Network — Ad Server",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-slate-900 text-white antialiased overflow-hidden h-full`}>
        {children}
      </body>
    </html>
  );
}
