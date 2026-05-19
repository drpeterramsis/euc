import { useState } from "react";

export default function MediaPostViewerModal({ post, onClose }: { post: any, onClose: () => void }) {
  const [imageError, setImageError] = useState(false);

  if (!post) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 z-10 text-xl font-bold">✕</button>

        <div className="w-full flex-1 bg-gray-100 flex items-center justify-center p-2">
          <img 
            src={imageError ? "https://placehold.co/800x400?text=Image+Unavailable" : post.imageDataUrl} 
            alt={post.title} 
            className="w-full h-full object-contain max-h-[50vh]"
            onError={() => setImageError(true)}
          />
        </div>

        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{post.title}</h2>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded capitalize">{post.category}</span>
            </div>
          
            <p className="text-gray-500 font-medium">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</p>
            
            {post.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">{post.description}</p>
                </div>
            )}
            
            {post.caption && (
                <p className="text-lg italic text-gray-600 font-serif">"{post.caption}"</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {post.link && (
                <a 
                  href={post.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-black text-white text-center py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                >
                  Join / Open Link
                </a>
              )}
              {post.allowDownload !== false && (
                <a 
                  href={post.imageDataUrl} 
                  download={`euc_post_${post.id}.jpg`}
                  className="flex-1 border-2 border-gray-900 text-gray-900 text-center py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Download Image
                </a>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
