// ─────────────────────────────────────────────
// FILE: src/pages/Media.tsx
// PURPOSE: Renders the media gallery, matching coming soon & visibility rules with staff overrides.
// ─────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useApp, DEFAULT_MEDIA_CATEGORIES } from '../context/AppContext';
import MediaPostViewerModal from '../components/MediaPostViewerModal';
import { isPostVisible } from '../utils/postVisibility';
import { getLabel } from '../utils/labels';
import { getPageAccess } from '../utils/pageAccess';
import { getPageAccess as getCentralPageAccess } from '../lib/pageAccess';
import ComingSoon from '../components/ComingSoon';
import VideoPlayer from '../components/VideoPlayer';
import { detectLinkType } from '../utils/linkUtils';
import GalleryCard from '../components/GalleryCard';

export default function Media() {
  const { media, galleries, settings, currentUser, appConfig, content } = useApp() as any;
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest"); // latest, oldest, category

  const pageTitle = getLabel(appConfig, "media");

  const centralAccess = content?.settings 
    ? getCentralPageAccess(content.settings, currentUser?.id || "", "media", currentUser?.role)
    : { enabled: true, comingSoon: false };

  // Hidden Check
  if (!centralAccess.enabled) {
    return <Navigate to="/access-denied" replace />;
  }

  // ✅ ONLY use getPageAccess — NEVER check appConfig.pages directly
  const access = getPageAccess("media", currentUser?.role, appConfig);

  // Coming Soon Check
  if (access === "coming-soon" || centralAccess.comingSoon) {
    return (
      <Layout>
        <ComingSoon />
      </Layout>
    );
  }

  // Derive categories from settings + posts (filtered by visibility)
  const categories = useMemo(() => {
    const fromSettings = settings?.mediaCategories || DEFAULT_MEDIA_CATEGORIES;
    const fromPosts = media
      .filter((p: any) => isPostVisible(p, currentUser))
      .map((p: any) => p.category)
      .filter(Boolean);
    const fromGalleries = (galleries || [])
      .filter((g: any) => g.showInFeed)
      .map((g: any) => g.category)
      .filter(Boolean);
    return ["All", ...new Set([...fromSettings, ...fromPosts, ...fromGalleries])];
  }, [settings, media, currentUser, galleries]);

  const filteredMedia = useMemo(() => {
    const postsAccess = content?.settings 
      ? getCentralPageAccess(content.settings, currentUser?.id || "", "posts", currentUser?.role)
      : { enabled: true, comingSoon: false };

    const albumsAccess = content?.settings 
      ? getCentralPageAccess(content.settings, currentUser?.id || "", "albums", currentUser?.role)
      : { enabled: true, comingSoon: false };

    let rawPosts = [];
    if (postsAccess.enabled && !postsAccess.comingSoon) {
      rawPosts = media.filter((p: any) => isPostVisible(p, currentUser)).map((p: any) => ({ ...p, _type: 'post' }));
    }
    
    let rawGalleries = [];
    if (albumsAccess.enabled && !albumsAccess.comingSoon) {
      rawGalleries = (galleries || []).filter((g: any) => g.showInFeed).map((g: any) => ({ ...g, _type: 'gallery', createdAt: g.publishedAt }));
    }
    
    let combined = [...rawPosts, ...rawGalleries];

    // Apply category filter
    if (activeCategory !== "All") {
      combined = combined.filter(p => p.category === activeCategory);
    }

    // Apply sort
    if (sortBy === "latest") {
      combined.sort((a: any, b: any) => new Date(b.createdAt || b.publishedAt || 0).getTime() - new Date(a.createdAt || a.publishedAt || 0).getTime());
    } else if (sortBy === "oldest") {
      combined.sort((a: any, b: any) => new Date(a.createdAt || a.publishedAt || 0).getTime() - new Date(b.createdAt || b.publishedAt || 0).getTime());
    } else if (sortBy === "category") {
      combined.sort((a: any, b: any) => (a.category || "").localeCompare(b.category || ""));
    }

    return combined;
  }, [media, galleries, activeCategory, sortBy, currentUser, content]);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <div className="text-xs font-bold text-gray-400">PRAGUE-2026</div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="px-4 py-2 w-full mb-8">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="latest">Sort: Latest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="category">Sort: Category (A-Z)</option>
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
        {filteredMedia.map((post: any) => {
          if (post._type === 'gallery') {
            return (
              <div key={post.id} className="h-full">
                <GalleryCard album={post} />
              </div>
            );
          }

          const finalLink = post.linkUrl || post.link;
          const isVideo = finalLink && ["youtube", "vimeo", "facebook"].includes(detectLinkType(finalLink));

          return (
            <div 
              key={post.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-yellow-200 group"
              onClick={() => setSelectedPost(post)}
            >
              <div 
                className="relative aspect-video overflow-hidden bg-black" 
                onClick={isVideo ? (e) => e.stopPropagation() : undefined}
              >
                {isVideo ? (
                  <div className="w-full h-full">
                    <VideoPlayer url={finalLink} title={post.title} />
                  </div>
                ) : (
                  <img src={post.imageDataUrl || post.photoUrl || post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500 font-sans" />
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                  {post.comingSoon && (
                    <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full shadow w-max">
                      🕐 Coming Soon
                    </div>
                  )}
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-yellow-800 text-[10px] font-bold rounded shadow-sm capitalize border border-yellow-100 w-max font-semibold">
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
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow font-bold z-10 pointer-events-none">
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
                {finalLink && (
                  <a 
                    href={finalLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-black text-white text-[10px] font-bold py-1.5 rounded text-center uppercase tracking-tight hover:bg-gray-800 cursor-pointer"
                  >
                    {post.linkLabel || "Open Link"}
                  </a>
                )}
                {post.allowDownload !== false && !isVideo && (post.imageDataUrl || post.photoUrl || post.thumbnailUrl) && (
                  <a 
                    href={post.imageDataUrl || post.photoUrl || post.thumbnailUrl} 
                    download={`euc_post_${post.id}.jpg`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full border-2 border-gray-900 text-gray-900 text-[10px] font-bold py-1.5 rounded text-center uppercase tracking-tight hover:bg-gray-50 cursor-pointer"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          </div>
          );
        })}
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
