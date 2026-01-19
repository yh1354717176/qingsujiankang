import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { UserProfile } from '../types';

interface AuthProps {
  onLogin: (profile: UserProfile) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatar, setAvatar] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phoneNumber.trim()) {
      onLogin({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        gender,
        avatar
      });
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-500 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">欢迎加入</h1>
          <p className="text-gray-500 text-sm mt-1">登录以开启您的轻塑之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex justify-center mb-2">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden group"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Icons.Camera className="w-8 h-8 text-gray-400 mb-1 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[10px] text-gray-400">上传头像</span>
                  <span className="text-[9px] text-gray-300">(可选)</span>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">昵称</label>
            <div className="relative">
              <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="怎么称呼您?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">手机号码</label>
            <div className="relative">
              <Icons.Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="用于找回记录"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">性别</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${gender === 'male' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-500'}`}
              >
                <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                    {gender === 'male' && <div className="w-2 h-2 bg-current rounded-full" />}
                </div>
                男
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${gender === 'female' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-gray-200 text-gray-500'}`}
              >
                 <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                    {gender === 'female' && <div className="w-2 h-2 bg-current rounded-full" />}
                </div>
                女
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-4"
          >
            开启健康之旅
            <Icons.ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};