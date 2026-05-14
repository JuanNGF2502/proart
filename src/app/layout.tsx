import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/components/providers";
import { InstallButton, OfflineDetector } from "@/components/pwa";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#d4a612",
};

export const metadata: Metadata = {
  title: "Proart - Gestão Gráfica",
  description: "Sistema de gestão para gráfica e comunicação visual",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Proart",
    startupImage: [
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 768px)",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Proart",
  },
  icons: [
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/icons/icon-32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/icons/icon-16.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/icons/icon-180.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "152x152",
      url: "/icons/icon-152.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "120x120",
      url: "/icons/icon-120.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
      url: "/icons/icon-192.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "512x512",
      url: "/icons/icon-512.png",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Proart" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/icon-152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/icons/icon-120.png"
        />
      </head>
      <body
        className={`${inter.variable} min-h-screen antialiased`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <Providers>
          <OfflineDetector />
          {children}
          <InstallButton />
        </Providers>
      </body>
    </html>
  );
}