import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { ImageViewer } from './ImageViewer';
import PullToRefresh from 'react-simple-pull-to-refresh';
import ReactMarkdown from 'react-markdown';
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

interface FeedProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigateToProfile: () => void;
}

/**
 * @description 社区页面组件
 */
export const Feed: React.FC<FeedProps> = ({ showToast, onNavigateToProfile }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const loadFeed = async () => {
    try {
      setIsLoading(true);
      const data = await fetchFeed();
      setPosts(data);
    } catch (err: any) {
      console.error("Failed to fetch feed", err);
      showToast(`社区加载失败: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleRefresh = async () => {
    try {
      const data = await fetchFeed();
      setPosts(data);
      showToast("已刷新", 'success');
    } catch (err: any) {
      showToast(`刷新失败: ${err.message}`);
    }
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
        className={`bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 ${!isDetail ? 'active:scale-[0.97] transition-all cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]' : ''}`}
        onClick={() => !isDetail && setSelectedPost(post)}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white overflow-hidden shadow-md ring-2 ring-white/50">
              {post.avatar ? (
                <img src={post.avatar} className="w-full h-full object-cover" />
              ) : (
                <Icons.User className="w-6 h-6" />
              )}
            </div>
            {post.streak && post.streak >= 7 && (
              <div className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg transform -rotate-12 border border-white">
                🔥{post.streak}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <div className="font-bold text-gray-900 text-[16px] line-clamp-1">{post.userName}</div>
              <div className="flex items-center gap-1 bg-emerald-500 px-2 py-1 rounded-lg shadow-[0_4px_10px_rgba(16,185,129,0.15)] shrink-0">
                <Icons.Activity className="w-2.5 h-2.5 text-white" />
                <span className="text-[12px] font-black text-white leading-none">{post.calories}</span>
                <span className="text-[9px] text-emerald-100 font-bold leading-none">kcal</span>
              </div>
            </div>
            <div className="text-[11px] text-gray-400 flex items-center gap-2 whitespace-nowrap overflow-hidden">
              <span className="shrink-0">{post.time}</span>
              <span className="w-1 h-1 rounded-full bg-gray-200 shrink-0" />
              <span className={`bg-gradient-to-r ${getMealTypeColor(post.mealType)} text-transparent bg-clip-text font-bold`}>
                {post.mealType}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className={`text-gray-600 text-[14px] leading-relaxed mb-5 px-0.5 ${!isDetail ? 'line-clamp-3' : ''}`}>
          {post.content}
        </p>

        {/* Images */}
        {post.images && renderImages(post.images, isDetail ? 9 : 3)}

        {/* AI Analysis - Detail View Only */}
        {isDetail && post.aiAnalysis && (
          <div className="mt-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2 whitespace-nowrap">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-100">
                <Icons.Activity className="w-4 h-4 text-white" />
              </div>
              AI 营养分析报告
            </h3>
            <div className="prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-800 prose-headings:font-bold prose-strong:text-gray-800 prose-li:marker:text-blue-500">
              <ReactMarkdown>{post.aiAnalysis}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-1">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${isLiked
              ? 'bg-rose-50 text-rose-500 shadow-sm'
              : 'bg-gray-50 text-gray-400 hover:text-rose-400'
              }`}
            onClick={(e) => handleLike(post.id, e)}
          >
            <Icons.Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold">{post.likes + (isLiked ? 1 : 0)}</span>
          </button>
          {!isDetail && (
            <div className="flex items-center gap-1 text-[11px] text-blue-500 font-bold bg-blue-50 px-3 py-1.5 rounded-xl">
              <span>查看报告详情</span>
              <Icons.ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Detail View ---
  if (selectedPost) {
    return (
      <div className="animate-in slide-in-from-right duration-300 bg-gray-50 min-h-full flex flex-col h-full relative z-[60]">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 sticky top-0 left-0 right-0 z-10 px-4 pb-4 flex items-center gap-4 shadow-lg text-white"
          style={{ paddingTop: 'max(16px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 16px))' }}
        >
          <button
            onClick={() => setSelectedPost(null)}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-all active:scale-90"
          >
            <Icons.ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight">动态详情</h1>
            <p className="text-[10px] text-blue-100 uppercase tracking-wider">Post Details</p>
          </div>
        </div>
        <div className="p-4 pb-20 flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-2xl mx-auto">
            {renderPost(selectedPost, true)}
          </div>
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
            <button
              onClick={onNavigateToProfile}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
            >
              <Icons.User className="w-5 h-5 text-white" />
            </button>
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