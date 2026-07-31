import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IT On-call Compensation Desk",
    short_name: "IT On-call",
    description: "ติดตามภาระงานและค่าตอบแทนของทีมไอทีอย่างโปร่งใส",
    id: "/",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#06101f",
    theme_color: "#0a2238",
    icons: [
      { src: "/windows-icon-44.png", sizes: "44x44", type: "image/png", purpose: "any" },
      { src: "/windows-icon-55.png", sizes: "55x55", type: "image/png", purpose: "any" },
      { src: "/windows-icon-66.png", sizes: "66x66", type: "image/png", purpose: "any" },
      { src: "/windows-icon-88.png", sizes: "88x88", type: "image/png", purpose: "any" },
      { src: "/windows-icon-96.png", sizes: "96x96", type: "image/png", purpose: "any" },
      { src: "/windows-icon-176.png", sizes: "176x176", type: "image/png", purpose: "any" },
      { src: "/windows-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/windows-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
