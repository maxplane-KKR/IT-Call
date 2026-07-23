import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "IT On-call | สรุปเวรและค่าตอบแทน";
const description = "แดชบอร์ดติดตามเวร เหตุการณ์ และค่าตอบแทนทีมไอที";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const image = `${origin}/og.png`;

  return {
    title,
    description,
    manifest: "/manifest-v2.webmanifest",
    icons: {
      icon: "/favicon-v2.svg",
      shortcut: "/favicon-v2.svg",
      apple: "/apple-touch-icon-v2.png",
    },
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
