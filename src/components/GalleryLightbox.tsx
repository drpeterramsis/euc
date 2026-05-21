import React, { useState, useEffect, useRef } from "react";
import { GalleryAlbum } from "../context/AppContext";

export default function GalleryLightbox({ album, onClose }: { album: GalleryAlbum; onClose: () => void }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Touch handling
  const touchStartDist = useRef<number | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const lastTouchTime = useRef(0);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const currentImg = selectedIndex !== null ? album.images[selectedIndex] : null;

  useEffect(() => {
    if (selectedIndex === null) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    } else {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSelectedIndex(null);
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedIndex, onClose, album.images.length]);

  const handlePrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + album.images.length) % album.images.length);
    resetZoom();
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % album.images.length);
    resetZoom();
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(s => Math.min(s + 0.5, 4));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(s => Math.max(s - 0.5, 1));
    if (scale - 0.5 <= 1) setPosition({ x: 0, y: 0 });
  };

  // Mouse drag for panning
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => setIsDragging(false);

  // Touch interactions (Pinch-to-zoom + pan + double-tap)
  const getDistance = (t1: React.Touch, t2: React.Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDist.current = getDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTouchTime.current < 300) {
        // Double tap: toggle Zoom
        if (scale > 1) {
          resetZoom();
        } else {
          setScale(2.5);
          setPosition({ x: 0, y: 0 });
        }
      } else {
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (scale > 1) {
          dragStart.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
          setIsDragging(true);
        }
      }
      lastTouchTime.current = now;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      const delta = dist / touchStartDist.current;
      setScale(s => Math.max(1, Math.min(s * delta, 4)));
      touchStartDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1 && isDragging) {
      setPosition({ x: e.touches[0].clientX - dragStart.current.x, y: e.touches[0].clientY - dragStart.current.y });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    touchStartDist.current = null;
    setIsDragging(false);
    if (e.changedTouches.length === 1 && scale === 1 && touchStartPos.current) {
      const diffX = e.changedTouches[0].clientX - touchStartPos.current.x;
      const diffY = Math.abs(e.changedTouches[0].clientY - touchStartPos.current.y);
      if (Math.abs(diffX) > 50 && diffY < 60) {
        if (diffX > 50) handlePrev();
        else handleNext();
      }
    }
  };

  // Swipe back logic for when NO image is selected
  useEffect(() => {
    if (selectedIndex === null) {
      let startX = 0;
      let startY = 0;
      const onStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      };
      const onEnd = (e: TouchEvent) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (startX < 30 && dx > 80 && Math.abs(dy) < 60) {
          onClose(); // go back
        }
      };
      document.addEventListener("touchstart", onStart, { passive: true });
      document.addEventListener("touchend", onEnd, { passive: true });
      return () => {
        document.removeEventListener("touchstart", onStart);
        document.removeEventListener("touchend", onEnd);
      };
    }
  }, [selectedIndex, onClose]);

  if (selectedIndex === null) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-x-hidden overflow-y-auto">
        <div className="sticky top-0 left-0 right-0 w-full bg-white border-b border-gray-200 p-4 z-10 flex items-center justify-between shadow-sm">
          <h2 className="text-xl font-bold truncate max-w-[70%]">{album.title}</h2>
          {/* Hide back button on mobile, use swipe back */}
          <button onClick={onClose} className="hidden md:flex px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-lg transition-colors border-none cursor-pointer items-center gap-2">
             <span>←</span> Back
          </button>
        </div>

        <div className="p-4 w-full h-full max-w-full">
           <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {album.images.map((img, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden group aspect-square w-full bg-gray-100 block max-w-full cursor-pointer" onClick={() => setSelectedIndex(idx)}>
                   <img src={img.url} alt="Gallery" className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none" />
                   {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <p className="text-white text-xs truncate max-w-full">{img.caption}</p>
                      </div>
                   )}
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center font-sans touch-none"
         data-lightbox-open="true"
         onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
         onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      {/* Close button */}
      <button onClick={() => setSelectedIndex(null)} className="absolute top-4 right-4 text-white p-3 z-50 rounded-full hover:bg-white/10 border-none cursor-pointer bg-transparent">
        <svg className="w-8 h-8 font-bold drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* Photo counter at top center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-sm font-bold bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full z-50">
        {selectedIndex + 1} / {album.images.length}
      </div>

      {/* Navigation buttons: Centered on edges, visible on both mobile and desktop (if 2+ images) */}
      {album.images.length > 1 && (
        <>
          {/* Left edge: Previous */}
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/75 text-white rounded-full w-14 h-14 min-w-[56px] min-h-[56px] flex items-center justify-center transition-colors pointer-events-auto border-none cursor-pointer"
            aria-label="Previous Photo"
          >
            <span className="text-3xl font-black mb-1">‹</span>
          </button>
          {/* Right edge: Next */}
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleNext(); }} 
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/75 text-white rounded-full w-14 h-14 min-w-[56px] min-h-[56px] flex items-center justify-center transition-colors pointer-events-auto border-none cursor-pointer"
            aria-label="Next Photo"
          >
            <span className="text-3xl font-black mb-1">›</span>
          </button>
        </>
      )}

      {/* Centered Image with Transform and will-change GPU acceleration */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden" onClick={() => setSelectedIndex(null)}>
        <img 
          src={currentImg!.url} 
          alt="Gallery Viewer" 
          className="max-w-full max-h-screen object-contain pointer-events-auto"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
            cursor: scale > 1 ? 'grab' : 'default',
            transition: isDragging ? "none" : "transform 0.15s ease",
            willChange: "transform"
          }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 px-4 z-50 pointer-events-none">
        {currentImg?.caption && (
          <p className="text-white font-bold max-w-2xl text-center bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 drop-shadow-md pointer-events-auto">
             {currentImg.caption}
          </p>
        )}
        
        <div className="flex items-center gap-4 bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full pointer-events-auto">
          <button onClick={handleZoomOut} className="text-white hover:text-gray-300 font-bold px-3 py-1 flex items-center justify-center bg-white/10 rounded-full w-10 h-10 shadow-sm border-none cursor-pointer" aria-label="Zoom Out">-</button>
          <span className="text-white text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="text-white hover:text-gray-300 font-bold px-3 py-1 flex items-center justify-center bg-white/10 rounded-full w-10 h-10 shadow-sm border-none cursor-pointer" aria-label="Zoom In">+</button>
          
          {album.allowDownload && (
             <>
               <div className="w-px h-6 bg-gray-500/50 mx-2"></div>
               <a href={currentImg!.url} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:text-yellow-400 font-bold text-sm bg-white/10 px-4 py-2 rounded-full transition-colors shadow-sm">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Download
               </a>
             </>
          )}
        </div>
      </div>
    </div>
  );
}
