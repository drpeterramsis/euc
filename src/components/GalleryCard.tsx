import React, { useState } from "react";
import { GalleryAlbum } from "../context/AppContext";
import GalleryLightbox from "./GalleryLightbox";

export default function GalleryCard({ album }: { album: GalleryAlbum }) {
  const [isOpen, setIsOpen] = useState(false);

  // Take up to 3 thumbnails
  const thumbnails = album.images.slice(0, 3);
  const remainingCount = album.images.length - 3;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4" onClick={() => setIsOpen(true)}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">📸 {album.title}</h3>
            <div className="flex items-center gap-2">
               <span className="text-xs text-gray-500 font-bold">Trip Gallery</span>
               <span className="text-gray-300">•</span>
               <span className="text-xs text-gray-500 font-bold">{album.images.length} photos</span>
            </div>
          </div>
          <span className="bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">{album.category.replace("-", " ")}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 cursor-pointer">
          {thumbnails.map((img, idx) => (
            <div key={idx} className="relative h-20 rounded-lg overflow-hidden group">
              <img src={img.url} alt="thumbnail" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              {idx === 2 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-black text-sm">+{remainingCount} more</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-3">
          <p className="text-sm text-gray-600 truncate flex-1 pr-4 italic">
            "{thumbnails[0]?.caption || album.title}"
          </p>
          <button onClick={() => setIsOpen(true)} className="text-black font-bold text-xs underline whitespace-nowrap hover:text-yellow-600 transition-colors">
            View Full Album →
          </button>
        </div>
      </div>

      {isOpen && <GalleryLightbox album={album} onClose={() => setIsOpen(false)} />}
    </>
  );
}
