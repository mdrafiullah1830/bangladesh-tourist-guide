import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ChatAssistant } from "@/components/layout/ChatAssistant";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Bangladesh Tourist Guide | AI-Powered Travel Companion",
  description: "Your intelligent travel companion for exploring Bangladesh. AI trip planning, transport booking, budget tracking, and safety assistance.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#047857",
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
      <body className={`${inter.variable} font-sans bg-gray-50 min-h-screen`}>
        <ToastProvider>
          <Navbar />
          <main className="pt-14 md:pt-16 pb-16 md:pb-0 min-h-screen">
            {children}
          </main>
          <ChatAssistant />
        </ToastProvider>
      </body>
    </html>
  );
}
