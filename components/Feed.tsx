import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { ImageViewer } from './ImageViewer';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { fetchFeed } from '../services/geminiService';

interface FeedPost {
  id: number;
  userName: string;
  avatar?: string;
  time: string;
  content: string;
  mealType: string;
  calories: number;
  likes: number;
  images?: string[];
  aiAnalysis?: string;
  streak?: number;
}

/**
 * @description 社区页面组件
 */
export const Feed: React.FC = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const loadFeed = async () => {
    try {
      const data = await fetchFeed();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch feed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleRefresh = async () => {
    await loadFeed();
  };

  const openViewer = (images: string[], index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewerImages(images);
    setViewerIndex(index);
  };

  const handleLike = (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const renderImages = (images: any, limit = 4) => {
    // 处理可能的字符串形式
    const imageList = typeof images === 'string' ? JSON.parse(images) : (images || []);
    if (!imageList || imageList.length === 0) return null;

    const count = imageList.length;
    let gridClass = "grid-cols-1";
    if (count === 2) gridClass = "grid-cols-2";
    if (count >= 3) gridClass = "grid-cols-3";

    return (
      <div className={`grid ${gridClass} gap-1.5 rounded-2xl overflow-hidden mb-3`}>
        {imageList.slice(0, limit).map((img: string, idx: number) => (
          <div
            key={idx}
            className={`aspect-square relative ${count === 1 ? 'aspect-video rounded-2xl' : ''}`}
            onClick={(e) => openViewer(imageList, idx, e)}
          >
            <img src={img} alt="Meal" className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-zoom-in" />
            {count > limit && idx === limit - 1 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                +{count - limit + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case '早餐': return 'from-orange-400 to-amber-500';
      case '午餐': return 'from-green-400 to-emerald-500';
      case '晚餐': return 'from-purple-400 to-indigo-500';
      default: return 'from-blue-400 to-cyan-500';
    }
  };

  const renderPost = (post: FeedPost, isDetail = false) => {
    const isLiked = likedPosts.has(post.id);

    return (
      <div
        key={post.id}
        className={`bg-white rounded-3xl p-5 shadow-sm border border-gray-100 ${!isDetail ? 'active:scale-[0.98] transition-all cursor-pointer hover:shadow-md' : ''}`}
        onClick={() => !isDetail && setSelectedPost(post)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3 items-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white overflow-hidden ring-2 ring-white shadow-lg">
                {post.avatar ? (
                  <img src={post.avatar} className="w-full h-full object-cover" />
                ) : (
                  <Icons.User className="w-6 h-6" />
                )}
              </div>
              {post.streak && post.streak >= 7 && (
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                  🔥{post.streak}
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-gray-800">{post.userName}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <span>{post.time}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className={`bg-gradient-to-r ${getMealTypeColor(post.mealType)} text-transparent bg-clip-text font-medium`}>
                  {post.mealType}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full border border-green-100">
            <Icons.Activity className="w-3.5 h-3.5 text-green-500" />
            <span className="text-sm font-bold text-green-600">{post.calories}</span>
            <span className="text-xs text-green-500">kcal</span>
          </div>
        </div>

        {/* Content */}
        <p className={`text-gray-700 leading-relaxed mb-4 ${!isDetail ? 'line-clamp-3' : ''}`}>
          {post.content}
        </p>

        {/* Images */}
        {post.images && renderImages(post.images, isDetail ? 9 : 3)}

        {/* AI Analysis - Detail View Only */}
        {isDetail && post.aiAnalysis && (
          <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Icons.Activity className="w-3.5 h-3.5 text-white" />
              </div>
              AI 营养分析
            </h3>
            <p className="text-sm text-blue-900 leading-relaxed">
              {post.aiAnalysis}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isLiked
              ? 'bg-red-50 text-red-500'
              : 'hover:bg-gray-50 text-gray-400 hover:text-red-400'
              }`}
            onClick={(e) => handleLike(post.id, e)}
          >
            <Icons.Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{post.likes + (isLiked ? 1 : 0)}</span>
          </button>
          {!isDetail && (
            <span className="text-xs text-gray-300">点击查看详情</span>
          )}
        </div>
      </div>
    );
  };

  // --- Detail View ---
  if (selectedPost) {
    return (
      <div className="animate-in slide-in-from-right duration-300 bg-white min-h-full flex flex-col h-full relative z-[60]">
        <div
          className="bg-white border-b border-gray-100 sticky top-0 left-0 right-0 z-10 px-4 pb-4 flex items-center gap-4 shadow-sm"
          style={{ paddingTop: 'max(16px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 16px))' }}
        >
          <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
            <Icons.ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">动态详情</h1>
        </div>
        <div className="p-4 pb-20 flex-1 overflow-y-auto">
          {renderPost(selectedPost, true)}
        </div>
        {viewerImages && (
          <ImageViewer
            images={viewerImages}
            initialIndex={viewerIndex}
            onClose={() => setViewerImages(null)}
          />
        )}
      </div>
    );
  }

  // --- Feed List View ---
  return (
    <div className="animate-in fade-in duration-500 bg-gray-50 h-full flex flex-col relative">
      {/* Fixed Header */}
      <div
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 fixed top-0 left-0 right-0 z-10 px-5 pb-4 shadow-lg"
        style={{ paddingTop: 'max(16px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 16px))' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-white/90 font-light">轻塑</span>
              <span>社区</span>
            </h1>
            <p className="text-blue-200 text-xs mt-0.5">发现健康生活方式</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Icons.User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ height: 'max(80px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 80px))' }} className="shrink-0" />

      <PullToRefresh
        onRefresh={handleRefresh}
        pullingContent={
          <div className="text-gray-400 text-sm py-4 text-center w-full">下拉刷新</div>
        }
        refreshingContent={
          <div className="text-blue-500 text-sm py-4 flex items-center justify-center gap-2 w-full">
            <Icons.Loader className="w-4 h-4 animate-spin" />
            <span>刷新中...</span>
          </div>
        }
        className="flex-1 overflow-y-auto w-full"
      >
        <div className="min-h-full">
          {/* Content */}
          <div className="px-4 space-y-4 pb-12">
            {/* Banner - Simplified */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mt-2 text-center">
              <div className="relative z-10">
                <h2 className="font-bold text-xl mb-1">在这个社区，每个人都在变好</h2>
                <p className="text-white/80 text-sm">分享你的健康瞬间，见证彼此的蜕变</p>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Icons.Loader className="w-10 h-10 animate-spin mb-4" />
                  <p>加载社区动态中...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <Icons.Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>暂无动态，快去打卡分享第一条吧！</p>
                </div>
              ) : (
                posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="animate-in fade-in slide-in-from-bottom duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {renderPost(post, false)}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {!isLoading && posts.length > 0 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
                  <div className="w-8 h-px bg-gray-200" />
                  <span>已经到底啦</span>
                  <div className="w-8 h-px bg-gray-200" />
                </div>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>

      {viewerImages && (
        <ImageViewer
          images={viewerImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerImages(null)}
        />
      )}
    </div>
  );
};