import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/homepage/Navbar";
import AutoLogout from "@/components/AutoLogout";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kleenkars.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kleenkars — Premium Car Wash & Detailing in Aligarh",
    template: "%s | Kleenkars Aligarh",
  },
  description:
    "Kleenkars is Aligarh's top-rated premium car wash and detailing studio. Doorstep car wash, ceramic coating, paint protection film (PPF), paint correction, and interior detailing with free pickup & drop.",
  keywords: [
    "Car Wash Aligarh",
    "Car Detailing Aligarh",
    "Ceramic Coating Aligarh",
    "Paint Protection Film Aligarh",
    "PPF Aligarh",
    "Doorstep Car Wash Aligarh",
    "Car Polishing Aligarh",
    "Interior Detailing Aligarh",
    "Car Spa Aligarh",
    "Kleenkars",
  ],
  authors: [{ name: "Kleenkars Team", url: siteUrl }],
  creator: "Kleenkars",
  publisher: "Kleenkars",
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kleenkars — Premium Car Wash & Detailing in Aligarh",
    description:
      "Top-rated doorstep car wash, ceramic coating, PPF, paint correction, and interior detailing in Aligarh, UP.",
    url: siteUrl,
    siteName: "Kleenkars",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1080,
        height: 720,
        alt: "Kleenkars Premium Car Wash & Detailing Aligarh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kleenkars — Premium Car Wash & Detailing in Aligarh",
    description:
      "Top-rated doorstep car wash, ceramic coating, PPF, paint correction, and interior detailing in Aligarh, UP.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
};

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
      <body className="min-h-full bg-[#050507] text-white">
        <Navbar />
        <main className="flex-1 page-shell">{children}</main>
        <AutoLogout />
        <WhatsAppWidget />
      </body>
    </html>
  );
}
