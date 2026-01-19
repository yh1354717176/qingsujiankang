import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Icons } from './Icons';
import { fetchHistory } from '../services/geminiService';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (updatedProfile: UserProfile) => void;
  onLogout: () => void;
  onNavigateToDate: (date: string) => void;
}

interface HistoryItem {
  date: string;
  calories: number;
}

/**
 * @description 个人中心页面组件
 * @param {ProfileProps} props - 组件属性
 */
export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onLogout, onNavigateToDate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editGender, setEditGender] = useState(user.gender);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load History on mount
  useEffect(() => {
    const loadCloudHistory = async () => {
      try {
        const cloudHistory = await fetchHistory(user.phoneNumber);
        if (Array.isArray(cloudHistory)) {
          setHistoryList(cloudHistory);
        }
      } catch (err) {
        console.error("Failed to fetch cloud history", err);
        setHistoryList([]);
      }
    };

    loadCloudHistory();
  }, [user.phoneNumber]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateUser({
      ...user,
      name: editName,
      gender: editGender,
      avatar: editAvatar
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(user.name);
    setEditGender(user.gender);
    setEditAvatar(user.avatar);
    setIsEditing(false);
  };

  // 计算统计数据
  const totalDays = historyList.length;
  const avgCalories = totalDays > 0
    ? Math.round(historyList.reduce((sum, item) => sum + item.calories, 0) / totalDays)
    : 0;

  // --- 历史记录页面 ---
  if (showHistory) {
    return (
      <div className="bg-white min-h-full animate-in slide-in-from-right duration-300 h-full flex flex-col relative z-[70]">
        {/* Header - Changed from fixed to sticky to fix alignment issues */}
        <div
          className="bg-white border-b border-gray-100 sticky top-0 left-0 right-0 z-10 px-5 pb-4 flex items-center gap-4 shadow-sm"
          style={{ paddingTop: 'max(16px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 16px))' }}
        >
          <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1 -ml-1">
            <Icons.ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">历史分析记录</h1>
        </div>

        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {historyList.length === 0 ? (
            <div className="text-center text-gray-400 py-16 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Icons.History className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-lg font-medium text-gray-500">暂无历史记录</p>
              <p className="text-sm text-gray-400 mt-1">开始记录您的饮食吧</p>
            </div>
          ) : (
            historyList.map((item, index) => (
              <div
                key={item.date}
                onClick={() => onNavigateToDate(item.date)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                    {item.date.split('-')[2]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{item.date}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Icons.Activity className="w-3 h-3" />
                      点击查看详细报告
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-green-600 font-bold">{item.calories}</div>
                    <div className="text-[10px] text-gray-400">kcal</div>
                  </div>
                  <Icons.ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // --- 主页面 ---
  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      {/* 顶部渐变区域 */}
      <div
        className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white px-6 pb-16 text-center relative overflow-hidden"
        style={{ paddingTop: 'max(32px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 32px))' }}
      >
        {/* 装饰性背景圆 */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />

        <h1 className="text-lg font-medium opacity-90 mb-8 relative z-10">个人中心</h1>

        {/* Avatar */}
        <div className="relative w-28 h-28 mx-auto mb-4">
          <div className="w-full h-full rounded-full border-4 border-white/30 overflow-hidden bg-white shadow-2xl ring-4 ring-white/10">
            {isEditing && editAvatar ? (
              <img src={editAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : user.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                <Icons.User className="w-14 h-14" />
              </div>
            )}
          </div>
          {isEditing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-white text-blue-600 p-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Icons.Camera className="w-5 h-5" />
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        {!isEditing && (
          <>
            <h2 className="text-2xl font-bold relative z-10">{user.name}</h2>
            <p className="text-blue-200 text-sm mt-1 relative z-10">
              {user.gender === 'male' ? '👨 男' : '👩 女'} · {user.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
            </p>
          </>
        )}
      </div>

      {/* 内容区域 - 上移覆盖 */}
      <div className="flex-1 overflow-y-auto -mt-8 relative z-10">
        <div className="px-4 space-y-4 pb-12">

          {/* 统计卡片 */}
          {!isEditing && (
            <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="text-3xl font-bold text-blue-600">{totalDays}</div>
                  <div className="text-xs text-gray-500 mt-1">累计记录天数</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="text-3xl font-bold text-green-600">{avgCalories || '-'}</div>
                  <div className="text-xs text-gray-500 mt-1">日均卡路里</div>
                </div>
              </div>
            </div>
          )}

          {/* 功能菜单 */}
          {!isEditing && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* 历史记录 */}
              <button
                onClick={() => setShowHistory(true)}
                className="w-full p-4 flex items-center justify-between group active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Icons.History className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-gray-800 block">历史分析记录</span>
                    <span className="text-xs text-gray-400">查看过往饮食分析报告</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {historyList.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                      {historyList.length}条
                    </span>
                  )}
                  <Icons.ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </button>

              <div className="h-px bg-gray-100 mx-4" />

              {/* 编辑资料 */}
              <button
                onClick={() => setIsEditing(true)}
                className="w-full p-4 flex items-center justify-between group active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Icons.Edit className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-gray-800 block">编辑个人资料</span>
                    <span className="text-xs text-gray-400">修改头像、昵称等信息</span>
                  </div>
                </div>
                <Icons.ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </button>
            </div>
          )}

          {/* 编辑表单 */}
          {isEditing && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg">编辑资料</h3>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">昵称</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                  placeholder="请输入昵称"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-3">性别</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditGender('male')}
                    className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${editGender === 'male'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                  >
                    👨 男
                  </button>
                  <button
                    onClick={() => setEditGender('female')}
                    className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-all ${editGender === 'female'
                      ? 'bg-pink-50 border-ピンク-500 text-pink-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                  >
                    👩 女
                  </button>
                </div>
              </div>

              {/* Phone (Read Only) */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">
                  手机号码 <span className="text-xs text-gray-400 font-normal">(不可修改)</span>
                </label>
                <div className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 flex items-center gap-2">
                  <Icons.Phone className="w-4 h-4 opacity-50" />
                  {user.phoneNumber}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3.5 rounded-xl active:scale-95 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Icons.Save className="w-5 h-5" />
                  保存修改
                </button>
              </div>
            </div>
          )}

          {/* 退出登录按钮 */}
          {!isEditing && (
            <button
              onClick={onLogout}
              className="w-full bg-white hover:bg-red-50 text-red-500 font-bold py-4 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Icons.LogOut className="w-5 h-5" />
              退出登录
            </button>
          )}

          {/* 版本信息 */}
          {!isEditing && (
            <p className="text-center text-xs text-gray-300 pt-2">
              轻塑健康 v1.0.0
            </p>
          )}
        </div>
      </div>
    </div>
  );
};