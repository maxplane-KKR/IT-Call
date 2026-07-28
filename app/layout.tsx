import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT On-call Compensation Desk",
  description: "Local preview of the IT on-call compensation dashboard.",
  icons: {
    icon: "/icon-192.png",
    shortcut: "/favicon.ico",
    apple: "/icon-180.png",
  },
  manifest: "/manifest.webmanifest",
  other: {
    "msapplication-TileColor": "#0a2238",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a2238",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
