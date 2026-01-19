import React, { useState } from 'react';
import { Icons } from './Icons';
import { ImageViewer } from './ImageViewer';

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
}

const MOCK_POSTS: FeedPost[] = [
  {
    id: 1,
    userName: "瘦身达人小美",
    time: "10分钟前",
    content: "今天的减脂午餐：水煮鸡胸肉 + 西兰花，坚持就是胜利！打卡第30天，已经瘦了5斤啦~ 💪",
    mealType: "午餐",
    calories: 450,
    likes: 124,
    images: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80"
    ],
    aiAnalysis: "非常棒的减脂午餐搭配！鸡胸肉提供了优质蛋白，西兰花富含膳食纤维，热量控制在450kcal左右非常合理。建议搭配少量复合碳水（如半根玉米或一小块红薯）会更加均衡，避免下午感到饥饿。"
  },
  {
    id: 2,
    userName: "健身Jason",
    time: "35分钟前",
    content: "练后来一顿高蛋白早餐，燕麦牛奶+鸡蛋。简单又营养。",
    mealType: "早餐",
    calories: 380,
    likes: 89,
    images: ["https://images.unsplash.com/photo-1511690656952-34342d5c2895?w=500&auto=format&fit=crop&q=80"],
    aiAnalysis: "经典的训练后补充方案。鸡蛋和牛奶提供了必要的蛋白质，燕麦是优质的慢碳，有助于恢复肌糖原。总体热量适中，营养密度高。如果运动强度较大，可以额外增加一个蛋白。"
  },
  {
    id: 3,
    userName: "KeepMoving",
    time: "1小时前",
    content: "晚餐吃少点，蔬菜沙拉配一点点坚果。虽然饿但是为了夏天拼了！🥗",
    mealType: "晚餐",
    calories: 200,
    likes: 245,
    images: [],
    aiAnalysis: "虽然热量控制得很低，但200kcal对于晚餐来说略显不足，容易导致夜间饥饿影响睡眠。建议加入一些低脂蛋白质（如虾仁、豆腐）增加饱腹感，同时坚果的优质脂肪对身体很有益，但要注意控制量。"
  }
];

export const Feed: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (images: string[], index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewerImages(images);
    setViewerIndex(index);
  };

  const renderImages = (images: string[], limit = 4) => {
    if (!images || images.length === 0) return null;

    const count = images.length;
    let gridClass = "grid-cols-1";
    if (count === 2) gridClass = "grid-cols-2";
    if (count >= 3) gridClass = "grid-cols-3";

    return (
      <div className={`grid ${gridClass} gap-1 rounded-xl overflow-hidden mb-3`}>
        {images.slice(0, limit).map((img, idx) => (
          <div
            key={idx}
            className={`aspect-square relative ${count === 1 ? 'aspect-video' : ''}`}
            onClick={(e) => openViewer(images, idx, e)}
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

  const renderPost = (post: FeedPost, isDetail = false) => (
    <div
      key={post.id}
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${!isDetail ? 'active:scale-[0.99] transition-transform cursor-pointer' : ''}`}
      onClick={() => !isDetail && setSelectedPost(post)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-100">
            {post.avatar ? (
              <img src={post.avatar} className="w-full h-full object-cover" />
            ) : (
              <Icons.User className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="font-bold text-gray-800 text-sm">{post.userName}</div>
            <div className="text-xs text-gray-400">{post.time} · {post.mealType}</div>
          </div>
        </div>
        <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {post.calories} kcal
        </div>
      </div>

      <p className={`text-gray-700 text-sm mb-3 leading-relaxed ${!isDetail ? 'line-clamp-3' : ''}`}>
        {post.content}
      </p>

      {post.images && renderImages(post.images, isDetail ? 9 : 3)}

      {/* AI Analysis Section - Only in Detail View */}
      {isDetail && post.aiAnalysis && (
        <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
          <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Icons.Activity className="w-4 h-4" />
            AI 营养分析
          </h3>
          <p className="text-sm text-blue-900 leading-relaxed">
            {post.aiAnalysis}
          </p>
        </div>
      )}

      <div className="flex items-center pt-3 border-t border-gray-50 text-gray-500 mt-2">
        <button
          className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Handle like logic
          }}
        >
          <Icons.Heart className="w-5 h-5" />
          <span className="text-xs">{post.likes}</span>
        </button>
      </div>
    </div>
  );

  // --- Detail View ---
  if (selectedPost) {
    return (
      <div className="animate-in slide-in-from-right duration-300 bg-gray-50 min-h-full flex flex-col">
        <div className="bg-white sticky top-0 z-10 px-4 pt-[calc(env(safe-area-inset-top,24px)+0.75rem)] pb-3 shadow-sm border-b border-gray-100 flex items-center gap-4">
          <button onClick={() => setSelectedPost(null)} className="text-gray-600">
            <Icons.ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">详情</h1>
        </div>
        <div className="p-4 pb-20">
          {renderPost(selectedPost, true)}
          {/* Deleted Comments Module */}
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
    <div className="animate-in fade-in duration-500 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 pt-[calc(env(safe-area-inset-top,24px)+0.75rem)] pb-3 shadow-sm border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-blue-600">轻塑</span>社区
        </h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg mb-6">
          <h2 className="font-bold text-lg mb-1">分享您的健康生活</h2>
          <p className="text-blue-100 text-sm mb-3">记录每一餐，和大家一起变瘦变美</p>
          <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
            <Icons.Activity className="w-3 h-3" />
            <span>已有 12,345 人今日打卡</span>
          </div>
        </div>

        {MOCK_POSTS.map(post => renderPost(post, false))}

        <div className="text-center text-gray-400 text-xs py-4">
          没有更多内容了
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
};