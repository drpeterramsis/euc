import React, { useState } from "react";
import { useApp, GalleryAlbum, GalleryImage } from "../../context/AppContext";
import { writeJSON } from "../../utils/github";
import { compressImage } from "../../utils/image";

export default function AdminGalleries() {
  const { galleries = [], updateGalleries } = useApp() as any;
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null);
  const [loading, setLoading] = useState(false);

  const initNew = () => {
    setEditingAlbum({
      id: "new",
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum) return;

    setLoading(true);
    const updated = [...galleries];
    const payload = {
      ...editingAlbum,
      id: editingAlbum.id === "new" ? `gallery_${Date.now()}` : editingAlbum.id
    };

    if (editingAlbum.id === "new") {
      updated.push(payload);
    } else {
      const idx = updated.findIndex((a: any) => a.id === payload.id);
      if (idx !== -1) updated[idx] = payload;
    }

    updateGalleries(updated);
    await writeJSON("gallery.json", updated);
    setEditingAlbum(null);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gallery?")) return;
    setLoading(true);
    const updated = galleries.filter((g: any) => g.id !== id);
    updateGalleries(updated);
    await writeJSON("gallery.json", updated);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingAlbum) return;
    
    setLoading(true);
    const newImages = [...editingAlbum.images];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file);
        newImages.push({ url: compressed, caption: "" });
    }

    setEditingAlbum({ ...editingAlbum, images: newImages });
    setLoading(false);
  };

  const removeImage = (index: number) => {
    if (!editingAlbum) return;
    const newImages = [...editingAlbum.images];
    newImages.splice(index, 1);
    setEditingAlbum({ ...editingAlbum, images: newImages });
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📸</span> Gallery Albums
        </h2>
        {!editingAlbum && (
            <button onClick={initNew} className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 shadow-sm transition-all">+ Create Album</button>
        )}
      </div>

      {editingAlbum ? (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
           <form onSubmit={handleSave} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Album Title *</label>
                    <input required value={editingAlbum.title} onChange={e => setEditingAlbum({...editingAlbum, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Category</label>
                    <select value={editingAlbum.category} onChange={e => setEditingAlbum({...editingAlbum, category: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500">
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
                    <input type="checkbox" checked={editingAlbum.showInFeed} onChange={e => setEditingAlbum({...editingAlbum, showInFeed: e.target.checked})} className="rounded text-black focus:ring-black" />
                    Show in News Feed
                </label>
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                    <input type="checkbox" checked={editingAlbum.showInLatest} onChange={e => setEditingAlbum({...editingAlbum, showInLatest: e.target.checked})} className="rounded text-black focus:ring-black" />
                    Show in Latest (Dashboard)
                </label>
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                    <input type="checkbox" checked={editingAlbum.allowDownload || false} onChange={e => setEditingAlbum({...editingAlbum, allowDownload: e.target.checked})} className="rounded text-black focus:ring-black" />
                    Allow Image Download
                </label>
             </div>

             <div className="pt-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Images ({editingAlbum.images.length})</label>
                  <label className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-3 sm:py-1.5 rounded-lg text-sm sm:text-xs font-bold cursor-pointer transition-colors text-center block">
                     {loading ? "Processing..." : "+ Add Photo"}
                     <input type="file" accept="image/*" multiple className="hidden" disabled={loading} onChange={handleImageUpload} />
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {editingAlbum.images.map((img, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 group aspect-square bg-gray-50 w-full">
                       <img src={img.url} className="w-full h-full object-cover" alt="Album photo" />
                       <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs min-h-[44px] min-w-[44px] shadow-md hover:bg-red-600 z-10 focus:outline-none">X</button>
                       <input 
                         placeholder="Caption..." 
                         value={img.caption} 
                         onChange={e => {
                           const newImages = [...editingAlbum.images];
                           newImages[idx].caption = e.target.value;
                           setEditingAlbum({...editingAlbum, images: newImages});
                         }} 
                         className="absolute bottom-0 left-0 right-0 text-[10px] w-full p-1 bg-white/90 border-t border-gray-200 focus:outline-none"
                       />
                    </div>
                  ))}
                  {editingAlbum.images.length === 0 && (
                     <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 font-bold text-sm">No photos added.</div>
                  )}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-gray-100 sm:flex sm:justify-end">
                <button type="button" onClick={() => setEditingAlbum(null)} className="w-full sm:w-auto px-4 py-3 sm:py-2 font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg" disabled={loading}>Cancel</button>
                <button type="submit" className="w-full sm:w-auto px-6 py-3 sm:py-2 font-bold text-sm bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <span className="animate-spin text-white">⚙️</span> : null}
                  Save
                </button>
             </div>
           </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
           <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-bold tracking-wider">
               <tr>
                  <th className="p-4">Album</th>
                  <th className="p-4">Photos</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Visibility</th>
                  <th className="p-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {galleries.map((g: any) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{g.title}</td>
                    <td className="p-4 font-bold text-gray-500">{g.images?.length || 0}</td>
                    <td className="p-4 capitalize text-gray-600">{g.category.replace("-", " ")}</td>
                    <td className="p-4 text-xs font-bold text-gray-500 space-y-1">
                      {g.showInFeed && <span className="block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block mr-1 leading-none uppercase tracking-widest text-[9px]">Feed</span>}
                      {g.showInLatest && <span className="block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full inline-block mr-1 leading-none uppercase tracking-widest text-[9px]">Latest</span>}
                    </td>
                    <td className="p-4 text-right space-x-3">
                       <button onClick={() => setEditingAlbum(g)} className="text-gray-400 hover:text-black transition-colors" title="Edit" disabled={loading}>✏️</button>
                       <button onClick={() => handleDelete(g.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete" disabled={loading}>🗑️</button>
                    </td>
                  </tr>
               ))}
               {galleries.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold italic">No albums found.</td></tr>
               )}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
