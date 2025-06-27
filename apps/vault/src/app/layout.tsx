import type { Metadata } from "next";
import { Provider } from './provider';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export const metadata: Metadata = {
  title: "KeepKey Vault | Secure Crypto Wallet Management",
  description: "KeepKey Vault - The secure way to manage your cryptocurrency wallet. Store, send and receive crypto with confidence using the trusted hardware wallet solution.",
  keywords: [
    "KeepKey", 
    "hardware wallet", 
    "crypto wallet", 
    "bitcoin wallet", 
    "cryptocurrency storage", 
    "secure wallet", 
    "digital asset management",
    "ethereum wallet",
    "cold storage",
    "blockchain security"
  ],
  authors: [{ name: "KeepKey" }],
  creator: "KeepKey",
  publisher: "KeepKey",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://keepkey.com/vault",
    siteName: "KeepKey Vault",
    title: "KeepKey Vault | Secure Crypto Wallet Management",
    description: "The secure way to manage your cryptocurrency with the trusted KeepKey hardware wallet. Take control of your digital assets.",
    images: [
      {
        url: "/images/logos/keepkey-logo-square.png",
        width: 1200,
        height: 630,
        alt: "KeepKey Vault"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "KeepKey Vault | Secure Crypto Wallet Management",
    description: "The secure way to manage your cryptocurrency with the trusted KeepKey hardware wallet. Take control of your digital assets.",
    images: ["/images/logos/keepkey-logo-square.png"],
    creator: "@keepkey"
  },
  icons: {
    icon: [
      { url: "/images/kk-icon-gold.png", sizes: "32x32", type: "image/png" },
      { url: "/images/kk-icon-gold.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/images/logos/keepkey-logo-square.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/images/kk-icon-gold.png"
  },
  robots: {
    index: true,
    follow: true
  },
  category: "Finance"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: any;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* @ts-ignore */}
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
