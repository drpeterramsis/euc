// ─────────────────────────────────────────────
// FILE: src/pages/Media.tsx
// PURPOSE: Renders the media gallery, matching coming soon & visibility rules with staff overrides.
// ─────────────────────────────────────────────

import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useApp, DEFAULT_MEDIA_CATEGORIES } from '../context/AppContext';
import MediaPostViewerModal from '../components/MediaPostViewerModal';
import { isPostVisible } from '../utils/postVisibility';
import { getLabel } from '../utils/labels';
import { getPageAccess } from '../utils/pageAccess';

export default function Media() {
  const { media, settings, currentUser, appConfig } = useApp();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest"); // latest, oldest, category

  const pageTitle = getLabel(appConfig, "media");

  const access = getPageAccess("media", currentUser?.role, appConfig);

  // Hidden Check
  if (access === "hidden") {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 font-sans">
          <p className="text-gray-400 text-sm">This page is not available.</p>
        </div>
      </Layout>
    );
  }

  // Coming Soon Check
  if (access === "coming-soon") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center text-center px-6 py-20 font-sans">
          <span className="text-5xl mb-4">🔒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-500 mb-6 font-medium text-sm">
            This feature is currently under development and will be available soon.
          </p>
        </div>
      </Layout>
    );
  }

  // Derive categories from settings + posts (filtered by visibility)
  const categories = useMemo(() => {
    const fromSettings = settings?.mediaCategories || DEFAULT_MEDIA_CATEGORIES;
    const fromPosts = media
      .filter(p => isPostVisible(p, currentUser))
      .map(p => p.category)
      .filter(Boolean);
    return ["All", ...new Set([...fromSettings, ...fromPosts])];
  }, [settings, media, currentUser]);

  const filteredMedia = useMemo(() => {
    let filtered = media.filter(p => isPostVisible(p, currentUser));

    // Apply category filter
    if (activeCategory !== "All") {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    // Apply sort
    if (sortBy === "latest") {
      filtered.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === "oldest") {
      filtered.sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortBy === "category") {
      filtered.sort((a: any, b: any) => (a.category || "").localeCompare(b.category || ""));
    }

    return filtered;
  }, [media, activeCategory, sortBy, currentUser]);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <div className="text-xs font-bold text-gray-400">PRAGUE-2026</div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat 
                  ? "bg-yellow-500 border-yellow-600 text-black shadow-sm font-bold shadow-sm" 
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 pointer-events-auto cursor-pointer"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sort by:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-yellow-500"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="category">Category (A-Z)</option>
          </select>
        </div>
      </div>
      
      {filteredMedia.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-20 text-center">
           <span className="text-5xl mb-4 block">📭</span>
           <p className="text-gray-500 font-bold">
             {activeCategory === "All" ? "No photos or posts available yet." : `No posts in "${activeCategory}" category yet.`}
           </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMedia.map((post: any) => (
          <div 
            key={post.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-yellow-200 group"
            onClick={() => setSelectedPost(post)}
          >
            <div className="relative aspect-video overflow-hidden">
              <img src={post.imageDataUrl} alt={post.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {post.comingSoon && (
                  <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full shadow w-max">
                    🕐 Coming Soon
                  </div>
                )}
                <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-yellow-800 text-[10px] font-bold rounded shadow-sm capitalize border border-yellow-100 w-max">
                  {post.category}
                </span>

                {/* Private / Group Indicator for Admin */}
                {currentUser?.role === 'admin' && post.audienceType && post.audienceType !== 'all' && (
                  <span className="px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-[#FFBF00] text-[8px] font-black rounded border border-yellow-500/50 flex items-center gap-1 w-max font-bold">
                    {post.audienceType === 'roles' ? `👥 ${(post.audienceRoles || []).join(', ')}` : `👤 Targeting ${post.audienceUserIds?.length} users`}
                  </span>
                )}
              </div>
              
              {currentUser?.role === "admin" && post.scheduledAt && new Date(post.scheduledAt) > new Date() && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow font-bold">
                  📅 Scheduled
                </div>
              )}
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
                    {post.linkLabel || "Open Link"}
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
