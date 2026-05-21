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
  const touchStartPos = useRef<{x: number, y: number} | null>(null);
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

  // Mouse drag
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

  // Touch interactions
  const getDistance = (t1: React.Touch, t2: React.Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDist.current = getDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTouchTime.current < 300) {
        // Double tap
        if (scale > 1) resetZoom();
        else setScale(2);
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
      if (diffX > 50) handlePrev();
      else if (diffX < -50) handleNext();
    }
  };

  if (selectedIndex === null) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-x-hidden overflow-y-auto">
        <div className="sticky top-0 left-0 right-0 w-full bg-white border-b border-gray-200 p-4 z-10 flex items-center justify-between shadow-sm">
          <h2 className="text-xl font-bold truncate max-w-[70%]">{album.title}</h2>
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-lg transition-colors border-none cursor-pointer flex items-center gap-2">
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
         onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
         onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <button onClick={() => setSelectedIndex(null)} className="absolute top-4 right-4 text-white p-3 z-50 rounded-full hover:bg-white/10">
        <svg className="w-8 h-8 font-bold drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-sm font-bold bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full z-50">
        {selectedIndex + 1} / {album.images.length}
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4 z-40 pointer-events-none hidden sm:flex">
        <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="text-white p-4 hover:bg-white/10 rounded-full transition pointer-events-auto">
          <svg className="w-10 h-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="text-white p-4 hover:bg-white/10 rounded-full transition pointer-events-auto">
           <svg className="w-10 h-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="flex-1 w-full flex items-center justify-center overflow-hidden" onClick={() => setSelectedIndex(null)}>
        <img 
          src={currentImg!.url} 
          alt="Gallery Viewer" 
          className="max-w-full max-h-screen object-contain transition-transform"
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, cursor: scale > 1 ? 'grab' : 'default' }}
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
          <button onClick={handleZoomOut} className="text-white hover:text-gray-300 font-bold px-3 py-1 flex items-center justify-center bg-white/10 rounded-full w-10 h-10 shadow-sm" aria-label="Zoom Out">-</button>
          <span className="text-white text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="text-white hover:text-gray-300 font-bold px-3 py-1 flex items-center justify-center bg-white/10 rounded-full w-10 h-10 shadow-sm" aria-label="Zoom In">+</button>
          
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
