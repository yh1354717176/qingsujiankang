import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { UserProfile } from '../types';
import { compressImage } from '../utils/imageHelper';

interface AuthProps {
  onLogin: (profile: UserProfile) => void;
}

/**
 * @description 登录/注册页面组件
 * @param {AuthProps} props - 组件属性
 */
export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatar, setAvatar] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 0.6, 400); // 压缩头像
        setAvatar(compressed);
      } catch (err) {
        console.error("Avatar compression failed", err);
        // Fallback to uncompressed
        const reader = new FileReader();
        reader.onloadend = () => setAvatar(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phoneNumber.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onLogin({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          gender,
          avatar
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      className="min-h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex flex-col relative overflow-hidden"
      style={{ paddingTop: 'max(40px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 40px))' }}
    >
      {/* 装饰性背景元素 */}
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/5" />
      <div className="absolute top-1/4 -left-24 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute bottom-1/3 right-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-20 left-1/4 w-56 h-56 rounded-full bg-white/5" />

      {/* 顶部品牌区域 */}
      <div className="relative z-10 text-center px-6 mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/15 mb-4 shadow-xl border border-white/20">
          <span className="text-4xl">🥗</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">轻塑健康</h1>
        <p className="text-blue-200 text-sm">AI 驱动的智能饮食管理助手</p>
      </div>

      {/* 登录卡片 */}
      <div className="flex-1 relative z-10">
        <div className="bg-white w-full h-full rounded-t-[2.5rem] px-6 pt-8 pb-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
          <div className="max-w-sm mx-auto">
            {/* 标题 */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">创建您的账户</h2>
              <p className="text-gray-400 text-sm mt-1">开启轻盈健康新生活</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar Upload */}
              <div className="flex justify-center mb-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:from-blue-100 hover:to-indigo-100 transition-all overflow-hidden group shadow-lg"
                >
                  {avatar ? (
                    <>
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Icons.Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Icons.Camera className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] text-blue-500 font-medium">添加头像</span>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">您的昵称</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <Icons.User className="w-4 h-4 text-white" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="怎么称呼您?"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-16 pr-4 py-4 focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-gray-800"
                    required
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">手机号码</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <Icons.Phone className="w-4 h-4 text-white" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="用于找回您的记录"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-16 pr-4 py-4 focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-gray-800"
                    required
                  />
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 ml-1">您的性别</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${gender === 'male'
                      ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-lg shadow-blue-100'
                      : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                  >
                    <span className="text-xl">👨</span>
                    <span className="font-medium">男生</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${gender === 'female'
                      ? 'bg-pink-50 border-pink-400 text-pink-700 shadow-lg shadow-pink-100'
                      : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                  >
                    <span className="text-xl">👩</span>
                    <span className="font-medium">女生</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!name.trim() || !phoneNumber.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 disabled:shadow-none flex items-center justify-center gap-2 mt-6"
              >
                {isSubmitting ? (
                  <Icons.Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-lg">开启健康之旅</span>
                    <Icons.ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Terms */}
              <p className="text-center text-xs text-gray-400 mt-4">
                继续即表示您同意我们的
                <span className="text-blue-500"> 服务条款 </span>
                和
                <span className="text-blue-500"> 隐私政策</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};