import type { Metadata, Viewport } from 'next'

// Separate viewport export as recommended by Next.js 15+
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export const metadata: Metadata = {
  title: "Asset Details | KeepKey Vault",
  description: "View and manage your crypto assets with KeepKey Vault.",
};

export default function AssetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 