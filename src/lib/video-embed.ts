// Convierte enlaces de YouTube o Loom en su URL de embed correspondiente,
// para poder reproducir el vídeo dentro de la app sin salir a otra pestaña.
export function getEmbedUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
    let videoId: string | null = null;
    if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1);
    } else if (u.pathname.startsWith("/shorts/")) {
      videoId = u.pathname.split("/shorts/")[1];
    } else if (u.pathname === "/watch") {
      videoId = u.searchParams.get("v");
    } else if (u.pathname.startsWith("/embed/")) {
      videoId = u.pathname.split("/embed/")[1];
    }
    videoId = videoId ? videoId.split("?")[0].split("&")[0] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (u.hostname.includes("loom.com")) {
    const match = u.pathname.match(/\/(?:share|embed)\/([a-zA-Z0-9]+)/);
    const id = match ? match[1] : null;
    return id ? `https://www.loom.com/embed/${id}` : null;
  }

  return null;
}
