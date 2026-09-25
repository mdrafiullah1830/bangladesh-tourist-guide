import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ChatAssistant } from "@/components/layout/ChatAssistant";
import { ToastProvider } from "@/components/ui/Toast";
import { PWARegister } from "@/components/pwa/PWARegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Bangladesh Travel Guide | Travel Deeper",
  description: "A practical, local-first guide for foreign visitors exploring Bangladesh — destinations, itineraries, transport, culture and safety.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#073c32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-[#f6f3eb] min-h-screen`}>
        <ToastProvider>
          <Navbar />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
          <ChatAssistant />
          <PWARegister />
        </ToastProvider>
      </body>
    </html>
  );
}
