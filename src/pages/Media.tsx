import { useState } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import MediaPostViewerModal from '../components/MediaPostViewerModal';

export default function Media() {
  const { media } = useApp();
  const [selectedPost, setSelectedPost] = useState<any>(null);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gallery & Posts</h1>
        <div className="text-xs font-bold text-gray-400">PRAGUE-2026</div>
      </div>
      
      {media.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-20 text-center">
           <span className="text-5xl mb-4 block">📸</span>
           <p className="text-gray-500 font-bold">No photos or posts available yet.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...media].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((post: any) => (
          <div 
            key={post.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-yellow-200"
            onClick={() => setSelectedPost(post)}
          >
            <div className="relative aspect-video overflow-hidden">
              <img src={post.imageDataUrl} alt={post.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-yellow-800 text-[10px] font-bold rounded shadow-sm capitalize border border-yellow-100">
                  {post.category}
                </span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{post.title}</h3>
              <p className="text-[10px] text-gray-400 font-bold mb-3">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</p>
              
              {post.caption && (
                <p className="text-xs text-gray-500 italic mb-4 line-clamp-2">"{post.caption}"</p>
              )}

              <div className="mt-auto flex flex-col gap-2">
                {post.link && (
                  <a 
                    href={post.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-black text-white text-[10px] font-bold py-1.5 rounded text-center uppercase tracking-tight hover:bg-gray-800"
                  >
                    Open Link
                  </a>
                )}
                {post.allowDownload !== false && (
                  <a 
                    href={post.imageDataUrl} 
                    download={`euc_post_${post.id}.jpg`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full border-2 border-gray-900 text-gray-900 text-[10px] font-bold py-1.5 rounded text-center uppercase tracking-tight hover:bg-gray-50"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedPost && (
        <MediaPostViewerModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </Layout>
  );
}
