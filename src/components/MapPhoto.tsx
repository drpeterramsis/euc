import { useState, useEffect } from "react";

interface MapPhotoProps {
  url?: string;
  alt: string;
  className?: string;
}

export function MapPhoto({ url, alt, className = "w-full h-32 object-cover rounded-lg shadow-sm" }: MapPhotoProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    let isMounted = true;
    
    // Quick local bypass for direct image URLs, Unsplash paths, or Base64 data images
    if (
      url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff)/i) || 
      url.includes("images.unsplash.com") || 
      url.includes("placeholder") ||
      url.startsWith("data:image/")
    ) {
      setPhotoUrl(url);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Check version 3 of local storage to automatically clear any stale wrong photo selections from old versions
    const cacheKey = `map_photo_cache_v3_${url}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setPhotoUrl(cached);
      setLoading(false);
      return;
    }

    fetch(`/api/maps-photo?url=${encodeURIComponent(url)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch photo");
        return res.json();
      })
      .then(data => {
        if (isMounted && data.photoUrl) {
          setPhotoUrl(data.photoUrl);
          localStorage.setItem(cacheKey, data.photoUrl);
        }
      })
      .catch(err => {
        console.warn("Could not load map photo gracefully, will attempt fallback:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (!url) return null;
  if (loading) {
    return (
      <div className={`${className} bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400 font-sans`}>
        Loading Airport Photo...
      </div>
    );
  }
  if (!photoUrl) return null;

  return (
    <img 
      src={photoUrl} 
      alt={alt} 
      className={className} 
      referrerPolicy="no-referrer"
    />
  );
}
