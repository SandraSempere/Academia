import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Origen Digestivo · Academia",
    short_name: "Origen Digestivo",
    description: "Tu espacio de acompañamiento digestivo",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1ea",
    theme_color: "#e8a7a1",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
