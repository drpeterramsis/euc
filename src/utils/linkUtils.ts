export function ensureHttps(url: string | undefined | null): string {
  if (!url || url.trim() === "") return "#";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return "https://" + trimmed;
}

export type LinkType = "youtube" | "vimeo" | "facebook" | "instagram" | "twitter" | "generic";

export function detectLinkType(url: string): LinkType {
  if (!url) return "generic";
  if (/youtube\.com\/watch|youtu\.be\//.test(url))   return "youtube";
  if (/vimeo\.com\//.test(url))                      return "vimeo";
  if (/facebook\.com\//.test(url))                   return "facebook";
  if (/instagram\.com\//.test(url))                  return "instagram";
  if (/twitter\.com\/|x\.com\//.test(url))           return "twitter";
  return "generic";
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function getThumbnailUrl(url: string): string | null {
  const type = detectLinkType(url);

  if (type === "youtube") {
    const id = extractYouTubeId(url);
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }

  if (type === "vimeo") {
    const id = extractVimeoId(url);
    // Vimeo thumbnails require API call — return placeholder trigger
    if (id) return `https://vumbnail.com/${id}.jpg`;
  }

  // For Facebook, Instagram, Twitter, Generic:
  // Use a link preview meta-fetch proxy
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}
