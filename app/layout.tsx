import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT On-call | สรุปเวรและค่าตอบแทน",
  description: "แดชบอร์ดติดตามเวร เหตุการณ์ และค่าตอบแทนทีมไอที",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
