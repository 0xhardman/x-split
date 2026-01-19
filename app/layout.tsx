import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "X-Split - Tap The Post Tool | Seamless Long Image Splitter for Twitter/X",
  description: "Free online tool for creating 'tap to view' seamless long image posts on Twitter/X. Split images into 2-4 segments with automatic gap compensation - when viewers tap your post, images display as one continuous picture.",
  keywords: [
    "tap the post",
    "tap the post tool",
    "tap the post cropper",
    "Twitter image splitter",
    "X image splitter",
    "Twitter long image",
    "seamless Twitter post",
    "Twitter multi-image post",
    "Twitter carousel maker",
    "split image for Twitter",
    "Twitter gap tool",
    "X tap post tool",
    "Twitter tap the post cropper",
    "long image split",
    "image segmentation tool",
  ],
  authors: [{ name: "0xhardman" }],
  creator: "X-Split",
  publisher: "X-Split",
  metadataBase: new URL("https://x-split.0xhardman.xyz"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "X-Split - Tap The Post Tool | Create Seamless Long Image Posts",
    description: "Free tool to split long images for Twitter/X. When viewers tap your post, images display as one seamless picture. Supports 2-4 segments with mobile/desktop gap modes.",
    siteName: "X-Split",
  },
  twitter: {
    card: "summary_large_image",
    title: "X-Split - Tap The Post Tool for Twitter/X",
    description: "Create 'tap to view' seamless long image posts. Split images into 2-4 segments with automatic gap compensation for perfect alignment on Twitter/X.",
    creator: "@0xhardman",
    site: "@0xhardman",
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
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
