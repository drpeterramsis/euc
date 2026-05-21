// ─────────────────────────────────────────────────────────────────
// FILE: src/pages/admin/AdminGalleries.tsx
// STRATEGY: 
// 1) Fast client-side image compression: native canvas resizing up to 1920px (longest side) at 0.82 JPEG quality
// 2) Progress counter text ("Uploading X / Y...") and full loading spinner when processing
// 3) Support multiple selection: <input type="file" multiple accept="image/*" />
// 4) Refactor album card listing from table to a responsive 2/3 column layout grid (no horizontal overflow)
// 5) Convert edit/delete actions into a robust 2-column grid button layout with proper colored backgrounds
// 6) Swipe back from left-edge in editing state to cancel editing/close, and call useSwipeBack() globally
// 7) Robust error checking, loading overlays, toast notifications, and state rollback on save mismatches
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import { useApp, GalleryAlbum } from "../../context/AppContext";
import { writeJSON, githubUploadPhoto, githubUpdateFile } from "../../utils/github";
import { compressImage } from "../../utils/image";
import { useSwipeBack } from "../../hooks/useSwipeBack";

export default function AdminGalleries() {
  // Call useSwipeBack() at the top as requested
  useSwipeBack();

  const { galleries = [], updateGalleries } = useApp() as any;
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Success / error toast message notifications state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Swipe back gesture specifically for closing the edit form when swiping left-to-right on mobile
  useEffect(() => {
    if (editingAlbum) {
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
          setEditingAlbum(null); // Close the edit/creation view
        }
      };
      document.addEventListener("touchstart", onStart, { passive: true });
      document.addEventListener("touchend", onEnd, { passive: true });
      return () => {
        document.removeEventListener("touchstart", onStart);
        document.removeEventListener("touchend", onEnd);
      };
    }
  }, [editingAlbum]);

  const initNew = () => {
    // Generate unique stable album ID immediately at initialization 
    // to support separate raw picture uploads correctly
    setEditingAlbum({
      id: `gallery_${Date.now()}`,
      type: "gallery",
      title: "",
      category: "trip-gallery",
      publishedAt: new Date().toISOString(),
      scheduledAt: null,
      images: [],
      showInFeed: true,
      showInLatest: false,
      uploadedBy: "admin"
    });
  };

  /**
   * Robust flow to save album details.
   * If saving fails, it triggers state rollback and leaves composer open.
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum || loading) return;

    setLoading(true);
    const oldGalleries = [...galleries]; // Capture snapshot for rollback
    const targetAlbum = { ...editingAlbum };

    // Compute updated list using functional approach and existing state
    const isNew = !galleries.some((a: any) => a.id === targetAlbum.id);
    const updated = isNew 
      ? [...galleries, targetAlbum]
      : galleries.map((a: any) => a.id === targetAlbum.id ? targetAlbum : a);

    try {
      // Optimistic state update with functional updater form
      updateGalleries((prev: GalleryAlbum[]) => {
        const checkNew = !prev.some(a => a.id === targetAlbum.id);
        return checkNew 
          ? [...prev, targetAlbum]
          : prev.map(a => a.id === targetAlbum.id ? targetAlbum : a);
      });

      // Save lightweight configuration file ONCE to GitHub
      await githubUpdateFile(
        "data/gallery.json",
        JSON.stringify(updated, null, 2),
        `Save album: ${targetAlbum.title}`
      );

      showToast("Album successfully saved is globally visible to everyone!", "success");
      setEditingAlbum(null);
    } catch (err: any) {
      console.error("Failed to save and persist gallery to GitHub:", err);
      // State Rollback using functional form
      updateGalleries(oldGalleries);
      showToast("Failed to save. Keeping album composer draft open.", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete album option with dynamic rollback support.
   */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gallery?")) return;
    setLoading(true);
    const oldGalleries = [...galleries]; // Capture snapshot for rollback
    const updated = galleries.filter((g: any) => g.id !== id);
    
    try {
      // Optimistic delete using functional updater style
      updateGalleries((prev: GalleryAlbum[]) => prev.filter(g => g.id !== id));

      // Persist deletion to GitHub once
      await githubUpdateFile(
        "data/gallery.json",
        JSON.stringify(updated, null, 2),
        `Delete album: ${id}`
      );
      showToast("Album deleted successfully!", "success");
    } catch (err: any) {
      console.error("Failed to delete album on GitHub:", err);
      // State Rollback using functional style
      updateGalleries(oldGalleries);
      showToast("Failed to delete. Please check internet connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Modern compressed image uploader with multiple select support and SEQUENTIAL upload loop
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingAlbum) return;
    
    setLoading(true);
    const total = files.length;
    const albumId = editingAlbum.id;
    
    try {
      // Process photos SEQUENTIALLY to prevent parallel PUT SHA race conditions on GitHub
      for (let i = 0; i < total; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        
        setUploadProgress(`Uploading photo ${i + 1} of ${total}...`);
        
        // 1) Compress the image client-side first
        const compressed = await compressImage(file);
        
        // 2) Strip the data URLs prefix to get raw base64 string
        const base64 = compressed.split(",")[1];
        const fileName = `${Date.now()}_${i}.jpg`;
        
        // 3) Upload raw file separately to Github repo
        const url = await githubUploadPhoto(
          albumId,
          fileName,
          base64,
          `Add photo to album ${albumId}`
        );
        
        // 4) Add image raw public URL to state using functional updater form
        setEditingAlbum(prev => {
          if (!prev) return null;
          return {
            ...prev,
            images: [...(prev.images || []), { url, caption: "" }]
          };
        });
      }
      showToast("Photos uploaded with success!", "success");
    } catch (err: any) {
      console.error("Photos upload failed:", err);
      showToast(`Upload failed at photo processing. Please try again.`, "error");
    } finally {
      setUploadProgress(null);
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    if (!editingAlbum) return;
    
    // Functional state modification for removing album images
    setEditingAlbum(prev => {
      if (!prev) return null;
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-100 relative">
      {/* Toast Notification HUD */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-2 animate-bounce ${
          toast.type === "success" 
            ? "bg-green-50 text-green-800 border-green-200" 
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📸</span> Gallery Albums
        </h2>
        {!editingAlbum && (
            <button onClick={initNew} disabled={loading} className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 disabled:bg-gray-400 shadow-sm transition-all border-none cursor-pointer">+ Create Album</button>
        )}
      </div>

      {editingAlbum ? (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
           <form onSubmit={handleSave} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Album Title *</label>
                     <input required value={editingAlbum.title} disabled={loading} onChange={e => setEditingAlbum({...editingAlbum, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500 font-medium" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Category</label>
                     <select value={editingAlbum.category} disabled={loading} onChange={e => setEditingAlbum({...editingAlbum, category: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500 font-bold">
                       <option value="trip-gallery">Trip Gallery</option>
                       <option value="conference">Conference</option>
                       <option value="social">Social</option>
                       <option value="landmarks">Landmarks</option>
                       <option value="user-uploads">User Uploads</option>
                     </select>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                      <input type="checkbox" checked={editingAlbum.showInFeed} disabled={loading} onChange={e => setEditingAlbum({...editingAlbum, showInFeed: e.target.checked})} className="rounded text-black focus:ring-black" />
                      Show in News Feed
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                      <input type="checkbox" checked={editingAlbum.showInLatest} disabled={loading} onChange={e => setEditingAlbum({...editingAlbum, showInLatest: e.target.checked})} className="rounded text-black focus:ring-black" />
                      Show in Latest (Dashboard)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                      <input type="checkbox" checked={editingAlbum.allowDownload || false} disabled={loading} onChange={e => setEditingAlbum({...editingAlbum, allowDownload: e.target.checked})} className="rounded text-black focus:ring-black" />
                      Allow Image Download
                  </label>
              </div>

              <div className="pt-4 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Images ({editingAlbum.images.length})</label>
                    <label className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-3 sm:py-1.5 rounded-lg text-sm sm:text-xs font-bold cursor-pointer transition-colors text-center block">
                       {loading ? (uploadProgress || "Uploading...") : "+ Add Photo"}
                       <input type="file" accept="image/*" multiple className="hidden" disabled={loading} onChange={handleImageUpload} />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {editingAlbum.images.map((img, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 group aspect-square bg-gray-50 w-full">
                         <img src={img.url} className="w-full h-full object-cover" alt="Album photo" />
                         <button type="button" onClick={() => removeImage(idx)} disabled={loading} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600 z-10 border-none cursor-pointer">✕</button>
                         <input 
                           placeholder="Caption..." 
                           value={img.caption} 
                           disabled={loading}
                           onChange={e => {
                             setEditingAlbum(prev => {
                               if (!prev) return null;
                               const newImages = [...prev.images];
                               newImages[idx] = { ...newImages[idx], caption: e.target.value };
                               return { ...prev, images: newImages };
                             });
                           }} 
                           className="absolute bottom-0 left-0 right-0 text-[10px] w-full p-1 bg-white/90 border-t border-gray-200 focus:outline-none font-medium"
                         />
                      </div>
                    ))}
                    {editingAlbum.images.length === 0 && (
                       <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 font-bold text-sm">No photos added.</div>
                    )}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-gray-100 sm:flex sm:justify-end font-bold">
                 {/* Hide cancel button on mobile, utilize natural swipe back gesture */}
                 <button type="button" onClick={() => setEditingAlbum(null)} className="hidden md:block w-full sm:w-auto px-4 py-2 font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg border-none cursor-pointer" disabled={loading}>Cancel</button>
                 <button type="submit" className="w-full sm:w-auto px-6 py-2 font-bold text-sm bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center gap-2 border-none cursor-pointer" disabled={loading}>
                   {loading ? (
                     <>
                       <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                       </svg>
                       <span>Processing...</span>
                     </>
                   ) : (
                     <span>Save</span>
                   )}
                 </button>
              </div>
           </form>
         </div>
       ) : (
         // Render responsive album grid layout for action buttons instead of a cramped table
         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {galleries.map((g: any) => {
              const firstImage = g.images && g.images.length > 0 ? g.images[0].url : "";
              return (
                <div key={g.id} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div>
                    <div className="aspect-square w-full rounded-lg bg-gray-50 overflow-hidden mb-2 relative border border-gray-100">
                      {firstImage ? (
                        <img src={firstImage} alt={g.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold bg-gray-50">Empty</div>
                      )}
                      <span className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {g.images?.length || 0} Photos
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-950 leading-tight text-sm truncate" title={g.title}>{g.title}</h3>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mt-1">{g.category.replace("-", " ")}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {g.showInFeed && <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase leading-none">Feed</span>}
                      {g.showInLatest && <span className="text-[8px] font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded uppercase leading-none">Latest</span>}
                      {g.allowDownload && <span className="text-[8px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase leading-none">Download</span>}
                    </div>
                  </div>
                  
                  {/* Below album info: Actions buttons in a 2-column grid to look pristine on mobile */}
                  <div className="grid grid-cols-2 gap-2 w-full mt-3">
                    <button 
                      type="button" 
                      onClick={() => setEditingAlbum(g)} 
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium border-none cursor-pointer text-center font-bold"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDelete(g.id)} 
                      className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium border-none cursor-pointer text-center font-bold"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
            {galleries.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 font-bold italic">No albums found.</div>
            )}
         </div>
       )}
     </div>
  );
}
