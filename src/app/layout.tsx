// import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: 'swap',
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: 'swap',
});

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Almuerzo.cl",
  description: "0% delivery, 100% comida rica",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Almuerzo",
  },
  formatDetection: {
    telephone: false,
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";
import { GoogleAnalytics } from "@next/third-parties/google";
import dynamic from 'next/dynamic';
const OnboardingModal = dynamic(() => import('@/components/blocks/OnboardingModal').then((mod) => mod.OnboardingModal), {
  ssr: false,
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <link rel="preconnect" href="https://kqanordhsmbtcwtjtrme.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://kqanordhsmbtcwtjtrme.supabase.co" />
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              {children}
              <OnboardingModal />
            </CartProvider>
            <Toaster position="top-center" />
          </NotificationProvider>
        </AuthProvider>
        {/* GA4 Tracking */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-SY7WXTXF2L"} />
      </body>
    </html>
  );
}
