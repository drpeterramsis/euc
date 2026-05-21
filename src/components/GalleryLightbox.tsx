import React, { useEffect } from "react";
import { GalleryAlbum } from "../context/AppContext";

export default function GalleryLightbox({ album, onClose }: { album: GalleryAlbum; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-x-hidden overflow-y-auto">
      <div className="sticky top-0 left-0 right-0 w-full bg-white border-b border-gray-200 p-4 z-10 flex items-center justify-between shadow-sm">
        <h2 className="text-xl font-bold truncate max-w-[70%]">{album.title}</h2>
        <button onClick={onClose} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-lg transition-colors border-none cursor-pointer flex items-center gap-2">
           <span>←</span> Back
        </button>
      </div>

      <div className="p-4 w-full h-full max-w-full">
         <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {album.images.map((img, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden group aspect-square w-full bg-gray-100 block max-w-full">
                 <img src={img.url} alt="Gallery" className="w-full h-full object-cover transition-opacity duration-300" />
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
