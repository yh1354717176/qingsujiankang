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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = phoneNumber.trim();

    // 校验手机号
    if (!/^\d{11}$/.test(trimmedPhone)) {
      alert("请输入有效的11位手机号码");
      return;
    }

    if (trimmedPhone && !isSubmitting) {
      setIsSubmitting(true);
      try {
        // 生成默认昵称：用户 + 手机后四位
        const defaultName = `手机用户${trimmedPhone.slice(-4)}`;
        await onLogin({
          name: defaultName,
          phoneNumber: trimmedPhone,
          gender,
          avatar: '' // 登录后在编辑页设置
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
      <div className="relative z-10 text-center px-6 mb-10">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/15 mb-6 shadow-xl border border-white/20">
          <span className="text-5xl">🥗</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">轻塑健康</h1>
        <p className="text-blue-100 text-sm opacity-80 font-medium">AI 驱动的智能饮食管理助手</p>
      </div>

      {/* 登录卡片 */}
      <div className="flex-1 relative z-10">
        <div className="bg-white w-full h-full rounded-t-[3rem] px-8 pt-10 pb-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
          <div className="max-w-sm mx-auto">
            {/* 标题 */}
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">创建您的账户</h2>
              <p className="text-gray-400 text-sm mt-2 font-medium">开启轻盈健康新生活</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Input */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">手机号码</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <Icons.Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="用于找回您的记录"
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl pl-16 pr-4 py-4 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-bold placeholder:font-normal placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              {/* Gender Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 ml-1">您的性别</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 py-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${gender === 'male'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xl shadow-blue-100 scale-[1.02]'
                      : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-100'
                      }`}
                  >
                    <span className="text-3xl">👨</span>
                    <span className="font-bold text-sm">男生</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 py-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${gender === 'female'
                      ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-xl shadow-pink-100 scale-[1.02]'
                      : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-100'
                      }`}
                  >
                    <span className="text-3xl">👩</span>
                    <span className="font-bold text-sm">女生</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!phoneNumber.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 active:scale-95 transition-all text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-100 disabled:shadow-none flex items-center justify-center gap-3 mt-10 h-14"
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
              <p className="text-center text-[10px] text-gray-400 mt-6 font-medium leading-relaxed">
                继续即表示您同意我们的
                <span className="text-blue-500 font-bold"> 服务条款 </span>
                和
                <span className="text-blue-500 font-bold"> 隐私政策</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};