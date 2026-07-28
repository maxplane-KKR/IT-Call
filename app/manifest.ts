import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IT On-call Compensation Desk",
    short_name: "IT On-call",
    description: "ติดตามภาระงานและค่าตอบแทนของทีมไอทีอย่างโปร่งใส",
    id: "/",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#06101f",
    theme_color: "#0a2238",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
