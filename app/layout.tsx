import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { StoreInitializer } from "@/components/store-initializer";
import { OfflineBanner } from "@/components/offline-banner";
import { CommandPalette } from "@/components/command-palette";
import { ShortcutsHelp } from "@/components/shortcuts-help";
import { PwaProvider } from "@/components/pwa-provider";
import { ApiKeyWarningBanner } from "@/components/api-key-warning";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "RTFM-GPT | Read The F*cking Manual",
  description: "AI-generated learning roadmaps that force you to read official documentation. No spoon-feeding. No shortcuts.",
  keywords: ["learning", "documentation", "programming", "roadmap", "tutorial", "coding", "self-study"],
  authors: [{ name: "RTFM-GPT" }],
  robots: "index, follow",
  metadataBase: new URL("https://rtfm-gpt.vercel.app"),
  openGraph: {
    title: "RTFM-GPT | Read The F*cking Manual",
    description: "AI-generated learning roadmaps that force you to read official documentation. No spoon-feeding. No shortcuts.",
    type: "website",
    url: "https://rtfm-gpt.vercel.app", // Placeholder, update with actual domain
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RTFM-GPT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RTFM-GPT | Read The F*cking Manual",
    description: "AI-generated learning roadmaps that force you to read official documentation. No spoon-feeding. No shortcuts.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistMono.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-mono text-foreground flex flex-col">
        <PwaProvider />
        <StoreInitializer />
        <OfflineBanner />
        <CommandPalette />
        <ShortcutsHelp />
        <Header />
        <ApiKeyWarningBanner />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
