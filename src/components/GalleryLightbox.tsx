import React, { useState, useEffect, useCallback } from "react";
import { GalleryAlbum } from "../context/AppContext";

export default function GalleryLightbox({ album, onClose }: { album: GalleryAlbum; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = useCallback(() => {
    setCurrentIndex(i => (i === 0 ? album.images.length - 1 : i - 1));
  }, [album.images.length]);

  const next = useCallback(() => {
    setCurrentIndex(i => (i === album.images.length - 1 ? 0 : i + 1));
  }, [album.images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, prev, next]);

  // Simple touch swipe logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const end = e.changedTouches[0].clientX;
    if (touchStart - end > 50) next();
    if (end - touchStart > 50) prev();
    setTouchStart(null);
  };

  const currentImg = album.images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-4 right-4 text-white p-2">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full">
        {currentIndex + 1} / {album.images.length}
      </div>

      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hidden sm:block hover:bg-white/10 rounded-full transition">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hidden sm:block hover:bg-white/10 rounded-full transition">
         <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      <div className="relative max-w-full max-h-[80vh] flex items-center justify-center" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <img src={currentImg.url} alt="Gallery" className="max-w-full max-h-[80vh] object-contain transition-opacity duration-300 pointer-events-none" />
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center px-4">
        <p className="text-white font-bold max-w-2xl mx-auto drop-shadow-md bg-black/50 rounded-lg inline-block px-4 py-2">
           {currentImg.caption || album.title}
        </p>
      </div>
    </div>
  );
}
