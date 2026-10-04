import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MindVault",
    short_name: "MindVault",
    description: "A private, local-first vault for notes, tasks and files.",
    id: "/app",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf9",
    theme_color: "#fafaf9",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "New note", url: "/app/notes?new=1", description: "Start writing" },
      { name: "Ask", url: "/app/ask", description: "Ask your vault" },
      { name: "Calendar", url: "/app/calendar" },
    ],
  };
}
