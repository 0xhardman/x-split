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
  title: "X-Split - Twitter Long Image Splitter",
  description: "Free online tool to split long images into multiple segments for seamless display on Twitter/X. Create stunning multi-image posts with perfect alignment.",
  keywords: ["Twitter image splitter", "X image splitter", "long image split", "Twitter carousel", "image segmentation", "social media tool", "tap the post tool", "tap the post cropper", "x tap post tool", "twitter tap the post cropper", "tap post image splitter"],
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
    title: "X-Split - Tap The Post Tool - Free Online Cropper for X/Twitter",
    description: "Free online tool to split long images into multiple segments for seamless display on Twitter/X. Create stunning multi-image posts with perfect alignment.",
    siteName: "X-Split",
  },
  twitter: {
    card: "summary_large_image",
    title: "X-Split - Twitter Long Image Splitter",
    description: "Free online tool to split long images into multiple segments for seamless display on Twitter/X.",
    creator: "@xsplit",
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
