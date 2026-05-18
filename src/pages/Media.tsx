import { useState } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import MediaPostViewerModal from '../components/MediaPostViewerModal';

export default function Media() {
  const { media } = useApp();
  const [selectedPost, setSelectedPost] = useState<any>(null);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Gallery & Posts</h1>
      
      {media.length === 0 && <p className="text-gray-500 text-center py-10">No posts available.</p>}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {media.map((post: any) => (
          <div 
            key={post.id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-pointer transition-transform hover:shadow-lg hover:-translate-y-1"
            onClick={() => setSelectedPost(post)}
          >
            <img src={post.imageDataUrl} alt={post.title} className="w-full h-48 object-cover" />
            <div className="p-4 flex-1">
              <h3 className="font-bold text-gray-900 mb-2 truncate">{post.title}</h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded capitalize">{post.category}</span>
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
