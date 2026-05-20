import React from "react";
import { detectLinkType, extractYouTubeId, extractVimeoId } from "../utils/linkUtils";

interface VideoPlayerProps {
  url: string;
  title?: string;
}

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
  const type = detectLinkType(url);

  // ── YOUTUBE ──────────────────────────────────────────────
  if (type === "youtube") {
    const id = extractYouTubeId(url);
    if (!id) return <LinkFallback url={url} />;
    return (
      <div className="relative w-full overflow-hidden" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-xl border-0"
          src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&controls=1&fs=1`}
          title={title ?? "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // ── VIMEO ─────────────────────────────────────────────────
  if (type === "vimeo") {
    const id = extractVimeoId(url);
    if (!id) return <LinkFallback url={url} />;
    return (
      <div className="relative w-full overflow-hidden" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-xl border-0"
          src={`https://player.vimeo.com/video/${id}?controls=1&fullscreen=1`}
          title={title ?? "Vimeo video"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // ── FACEBOOK VIDEO ────────────────────────────────────────
  if (type === "facebook") {
    return (
      <div className="relative w-full overflow-hidden" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-xl border-0"
          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&appId`}
          title={title ?? "Facebook video"}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // ── GENERIC / INSTAGRAM / TWITTER ─────────────────────────
  // These don't support direct embed — show styled link card
  return <LinkFallback url={url} />;
}

// Fallback for non-embeddable links
function LinkFallback({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-yellow-50 hover:border-yellow-300 transition-colors group"
    >
      <span className="text-2xl">🔗</span>
      <span className="text-sm text-gray-700 group-hover:text-yellow-700 truncate flex-1">
        {url}
      </span>
      <span className="text-xs text-gray-400 flex-shrink-0">
        Open ↗
      </span>
    </a>
  );
}
