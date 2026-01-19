import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AnalysisResult } from '../types';
import { Icons } from './Icons';

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
    const items: HistoryItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`nutriplan_analysis_${user.phoneNumber}_`)) {
            const date = key.split('_').pop();
            if (date) {
                try {
                    const data: AnalysisResult = JSON.parse(localStorage.getItem(key) || '{}');
                    if (data.macros) {
                        items.push({ date, calories: data.macros.calories });
                    }
                } catch (e) {
                    console.error("Error parsing history", e);
                }
            }
        }
    }
    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryList(items);
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

  if (showHistory) {
      return (
          <div className="bg-gray-50 min-h-full animate-in slide-in-from-right duration-300">
             <div className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm border-b border-gray-100 flex items-center gap-4">
                <button onClick={() => setShowHistory(false)} className="text-gray-600">
                    <Icons.ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">历史分析记录</h1>
            </div>
            <div className="p-4 space-y-3">
                {historyList.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                        <Icons.History className="w-12 h-12 mb-2 opacity-20" />
                        <p>暂无历史分析记录</p>
                    </div>
                ) : (
                    historyList.map(item => (
                        <div 
                            key={item.date}
                            onClick={() => onNavigateToDate(item.date)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                    {item.date.split('-')[2]}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">{item.date}</div>
                                    <div className="text-xs text-gray-400">点击查看详细报告</div>
                                </div>
                            </div>
                            <div className="text-green-600 font-medium text-sm">
                                {item.calories} kcal
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
      )
  }

  return (
    <div className="animate-in slide-in-from-right duration-500 pb-6">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-b-[2.5rem] shadow-lg mb-6 pt-12 text-center relative">
        <h1 className="text-xl font-bold mb-6">个人中心</h1>
        
        {/* Avatar Display */}
        <div className="relative w-28 h-28 mx-auto mb-4">
          <div className="w-full h-full rounded-full border-4 border-white/30 overflow-hidden bg-white shadow-xl">
            {isEditing && editAvatar ? (
               <img src={editAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : user.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                <Icons.User className="w-12 h-12" />
              </div>
            )}
          </div>
          {isEditing && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-white text-blue-600 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
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
             <h2 className="text-2xl font-bold">{user.name}</h2>
        )}
      </div>

      <div className="px-6 space-y-4">
        
        {/* History Entry */}
        {!isEditing && (
             <button 
                onClick={() => setShowHistory(true)}
                className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all"
             >
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                         <Icons.History className="w-5 h-5" />
                     </div>
                     <span className="font-bold text-gray-800">历史分析记录</span>
                 </div>
                 <Icons.ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
             </button>
        )}

        {/* Form Fields */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800">基本信息</h3>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-blue-600 flex items-center gap-1 text-sm font-medium"
                    >
                        <Icons.Edit className="w-4 h-4" />
                        编辑
                    </button>
                )}
            </div>

            {/* Name */}
            <div>
                <label className="text-xs text-gray-400 block mb-1">姓名</label>
                {isEditing ? (
                    <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border-b border-blue-500 py-1 focus:outline-none bg-transparent text-gray-800"
                    />
                ) : (
                    <div className="text-gray-800 font-medium">{user.name}</div>
                )}
            </div>

             {/* Gender */}
             <div>
                <label className="text-xs text-gray-400 block mb-1">性别</label>
                {isEditing ? (
                   <div className="flex gap-4 mt-2">
                      <button
                        onClick={() => setEditGender('male')}
                        className={`px-4 py-2 rounded-lg text-sm border ${editGender === 'male' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}
                      >男</button>
                      <button
                        onClick={() => setEditGender('female')}
                        className={`px-4 py-2 rounded-lg text-sm border ${editGender === 'female' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-gray-200'}`}
                      >女</button>
                   </div>
                ) : (
                    <div className="text-gray-800 font-medium">
                        {user.gender === 'male' ? '男' : '女'}
                    </div>
                )}
            </div>

            {/* Phone (Read Only) */}
            <div>
                <label className="text-xs text-gray-400 block mb-1">手机号码 <span className="text-[10px] text-red-300 ml-1">(不可修改)</span></label>
                <div className="text-gray-500 font-medium flex items-center gap-2">
                    <Icons.Phone className="w-4 h-4 opacity-50" />
                    {user.phoneNumber}
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        {isEditing ? (
             <div className="flex gap-4">
                 <button 
                    onClick={handleCancel}
                    className="flex-1 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl active:scale-95 transition-all"
                >
                    取消
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Icons.Save className="w-5 h-5" />
                    保存修改
                </button>
             </div>
        ) : (
            <button 
                onClick={onLogout}
                className="w-full bg-red-50 text-red-600 font-bold py-3.5 rounded-xl mt-4 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <Icons.LogOut className="w-5 h-5" />
                退出登录
            </button>
        )}
      </div>
    </div>
  );
};