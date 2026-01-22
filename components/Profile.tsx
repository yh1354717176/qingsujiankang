import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Icons } from './Icons';
import { fetchHistory, fetchWeights, syncWeight, analyzeWeightTrend } from '../services/geminiService';
import { compressImage, uploadToImgBB } from '../utils/imageHelper';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { PullToRefresh as CustomPullToRefresh } from './PullToRefresh';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (updatedProfile: UserProfile) => Promise<void>;
  onLogout: () => void;
  onNavigateToDate: (date: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

interface HistoryItem {
  date: string;
  calories: number;
}

/**
 * @description 个人中心页面组件
 * @param {ProfileProps} props - 组件属性
 */
export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onLogout, onNavigateToDate, showToast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editGender, setEditGender] = useState(user.gender);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // 体重相关
  const [weightList, setWeightList] = useState<{ date: string, weight: number }[]>([]);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [inputWeight, setInputWeight] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightAnalysis, setWeightAnalysis] = useState<{ summary: string, status: string, advice: string } | null>(null);
  const [isAnalyzingWeight, setIsAnalyzingWeight] = useState(false);
  const [showWeightPanel, setShowWeightPanel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const loadWeights = async () => {
    try {
      const data = await fetchWeights(user.phoneNumber);
      if (Array.isArray(data)) {
        setWeightList(data);
      }
    } catch (err) {
      console.error("Failed to fetch weights", err);
    }
  };

  // 初始加载
  useEffect(() => {
    loadCloudHistory();
    loadWeights();
  }, [user.phoneNumber]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressed = await compressImage(file, 0.6, 400);
        setEditAvatar(compressed);
        showToast("头像已处理", 'success');
      } catch (err) {
        showToast("图片处理失败");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      let finalAvatarUrl = editAvatar;

      // 检测是否为新选的 Base64 图片
      if (editAvatar && editAvatar.startsWith('data:image')) {
        try {
          console.log("正在通过 ImgBB 上传图片...");
          finalAvatarUrl = await uploadToImgBB(editAvatar);
          console.log("上传成功，得到 URL:", finalAvatarUrl);
        } catch (uploadErr: any) {
          showToast(`云端图片上传失败: ${uploadErr.message}`);
          throw uploadErr;
        }
      }

      await onUpdateUser({
        ...user,
        name: editName,
        gender: editGender,
        avatar: finalAvatarUrl
      });
      setIsEditing(false);
      showToast("个人资料已更新", "success");
    } catch (err: any) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(user.name);
    setEditGender(user.gender);
    setEditAvatar(user.avatar);
    setIsEditing(false);
  };

  const handleSaveWeight = async () => {
    if (!inputWeight || isNaN(Number(inputWeight))) {
      showToast("请输入有效数字", 'error');
      return;
    }
    try {
      setIsSavingWeight(true);
      const today = new Date().toISOString().split('T')[0];
      await syncWeight(user.phoneNumber, today, Number(inputWeight));
      await loadWeights();
      setIsWeightModalOpen(false);
      setInputWeight('');
      showToast("体重记录已更新", 'success');
    } catch (err: any) {
      showToast(`保存失败: ${err.message}`);
    } finally {
      setIsSavingWeight(false);
    }
  };

  const handleAnalyzeWeight = async () => {
    if (weightList.length < 2) {
      showToast("需至少两条记录才能分析趋势", 'error');
      return;
    }
    try {
      setIsAnalyzingWeight(true);
      const result = await analyzeWeightTrend(user.phoneNumber, weightList);
      setWeightAnalysis(result);
      showToast("AI 分析完成", 'success');
    } catch (err: any) {
      showToast(`分析失败: ${err.message}`);
    } finally {
      setIsAnalyzingWeight(false);
    }
  };

  // 计算逻辑
  const totalDays = historyList.length;
  const avgCalories = totalDays > 0
    ? Math.round(historyList.reduce((sum, item) => sum + item.calories, 0) / totalDays)
    : 0;

  // --- 历史记录子视图 ---
  if (showHistory) {
    return (
      <div className="bg-white min-h-full animate-in slide-in-from-right duration-300 h-full flex flex-col relative z-[70]">
        <div
          className="bg-white border-b border-gray-100 sticky top-0 left-0 right-0 z-10 px-5 pb-4 flex items-center gap-4 shadow-sm"
          style={{ paddingTop: 'max(16px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 16px))' }}
        >
          <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1 -ml-1">
            <Icons.ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">历史分析记录</h1>
        </div>

        <CustomPullToRefresh
          className="h-full no-scrollbar"
          onRefresh={loadCloudHistory}
          isPullable={true}
          pullingContent={<div className="text-gray-600 py-4 text-center font-medium text-xs">下拉刷新历史</div>}
          refreshingContent={
            <div className="py-4 flex flex-col items-center gap-2">
              <Icons.Loader className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-xs text-gray-500 font-medium">正在获取历史数据...</span>
            </div>
          }
        >
          <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-[85vh]">
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
                  key={index}
                  onClick={() => onNavigateToDate(item.date)}
                  className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] transition-all hover:border-blue-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Icons.Calendar className="w-5 h-5" />
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
        </CustomPullToRefresh>
      </div>
    );
  }

  // --- 主视图 ---
  return (
    <CustomPullToRefresh
      className="h-full no-scrollbar"
      onRefresh={loadCloudHistory}
      isPullable={!isEditing}
      pullingContent={<div className="text-gray-600 py-4 text-center font-medium text-xs">下拉刷新</div>}
      refreshingContent={
        <div className="py-4 flex flex-col items-center gap-2">
          <Icons.Loader className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-xs text-gray-500 font-medium">正在同步云端数据...</span>
        </div>
      }
    >
      <div className="animate-in fade-in duration-500 h-full flex flex-col min-h-screen pb-10">
        {/* Header Section */}
        <div
          className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white px-6 pb-16 text-center relative overflow-hidden shrink-0"
          style={{ paddingTop: 'max(32px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 32px))' }}
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />

          <h1 className="text-lg font-medium opacity-90 mb-8 relative z-10">个人中心</h1>

          <div className="relative w-28 h-28 mx-auto mb-4">
            <div className="w-full h-full rounded-full border-4 border-white/30 overflow-hidden bg-white shadow-2xl ring-4 ring-white/10 flex items-center justify-center">
              {isCompressing ? (
                <Icons.Loader className="w-10 h-10 text-blue-500 animate-spin" />
              ) : isEditing && editAvatar ? (
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
                className="absolute bottom-0 right-0 w-9 h-9 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
              >
                <Icons.Camera className="w-4 h-4" />
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2 opacity-80">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                {user.gender === 'male' ? '男' : '女'}
              </span>
              <span className="text-sm font-medium">{user.phoneNumber}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 space-y-4 -mt-8 relative z-20 flex-1 overflow-y-visible">
          {/* Stats Cards */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-50 transition-all active:scale-95">
                <div className="text-gray-400 text-xs mb-1">活跃天数</div>
                <div className="text-2xl font-bold text-gray-800">{totalDays} <span className="text-xs font-normal text-gray-400 ml-1">天</span></div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-50 transition-all active:scale-95">
                <div className="text-gray-400 text-xs mb-1">平均热量</div>
                <div className="text-2xl font-bold text-gray-800">{avgCalories} <span className="text-xs font-normal text-gray-400 ml-1">kcal</span></div>
              </div>
            </div>
          )}

          {/* 体重管理板块 - 沉浸式图表设计 */}
          {!isEditing && (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-50 overflow-hidden transition-all duration-300">
              <div className="p-5 flex items-center justify-between border-b border-gray-50 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <Icons.Weight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">体重趋势分析</h3>
                    <p className="text-[10px] text-gray-400 font-medium">最近的身体变化</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWeightModalOpen(true)}
                  className="bg-white text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100 shadow-sm active:scale-95 transition-all flex items-center gap-1"
                >
                  <Icons.Plus className="w-3 h-3" />
                  记录体重
                </button>
              </div>

              {weightList.length > 1 ? (
                <div className="px-2 py-4">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={(str: string) => str.split('-').slice(1).join('/')}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-2.5 rounded-xl shadow-xl">
                                  <p className="text-[10px] text-gray-400 mb-1 font-bold">{(payload[0].payload as any).date}</p>
                                  <p className="text-sm font-black text-blue-600">{payload[0].value} <span className="text-[10px] font-normal">kg</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* AI 分析触发按钮 */}
                  <div className="px-4 pb-2">
                    <button
                      onClick={handleAnalyzeWeight}
                      disabled={isAnalyzingWeight}
                      className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 py-3 rounded-2xl flex items-center justify-center gap-2 group active:scale-[0.98] transition-all"
                    >
                      {isAnalyzingWeight ? (
                        <Icons.Loader className="w-4 h-4 animate-spin text-blue-600" />
                      ) : (
                        <Icons.Trending className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                      )}
                      <span className="text-xs font-bold text-blue-700">
                        {isAnalyzingWeight ? "正在解读趋势..." : "点击 AI 分析我的减肥状态"}
                      </span>
                    </button>
                  </div>

                  {/* AI 分析结果展示 */}
                  {weightAnalysis && (
                    <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">AI Coach</span>
                        <div className="h-px flex-1 bg-white/20" />
                        <span className="text-xs font-bold">{weightAnalysis.status}</span>
                      </div>
                      <p className="text-sm leading-relaxed mb-3 font-medium text-blue-50">
                        {weightAnalysis.summary}
                      </p>
                      <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">专业建议</div>
                        <p className="text-xs leading-relaxed opacity-90">{weightAnalysis.advice}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icons.Weight className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-sm text-gray-400">还没有足够的体重记录</p>
                  <p className="text-[10px] text-gray-300 mt-1">至少记录两次体重以生成趋势分析</p>
                </div>
              )}
            </div>
          )}

          {/* Menu Items */}
          {!isEditing && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Icons.User className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-700">编辑资料</span>
                </div>
                <Icons.ChevronRight className="w-5 h-5 text-gray-300" />
              </button>

              <button
                onClick={() => setShowHistory(true)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Icons.History className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-700">历史分析记录</span>
                </div>
                <div className="flex items-center gap-2">
                  {historyList.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {historyList.length}
                    </span>
                  )}
                  <Icons.ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </button>
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-50 p-5 space-y-4 animate-in slide-in-from-bottom duration-300">
              <h3 className="font-bold text-gray-800 border-b pb-3">修改个人资料</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">昵称</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    placeholder="请输入昵称"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">性别</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditGender('male')}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${editGender === 'male' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-400'}`}
                    >
                      男
                    </button>
                    <button
                      onClick={() => setEditGender('female')}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${editGender === 'female' ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' : 'bg-gray-50 text-gray-400'}`}
                    >
                      女
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3.5 rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isCompressing}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Icons.Loader className="w-5 h-5 animate-spin" /> : <Icons.Save className="w-5 h-5" />}
                  {isSaving ? "保存中..." : "保存修改"}
                </button>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {!isEditing && (
            <button
              onClick={onLogout}
              className="w-full bg-white hover:bg-red-50 text-red-500 font-bold py-4 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 mb-6"
            >
              <Icons.LogOut className="w-5 h-5" />
              退出登录
            </button>
          )}

          {!isEditing && (
            <p className="text-center text-[10px] text-gray-300 pt-2 tracking-widest uppercase">
              Qingshu Health v1.0.0
            </p>
          )}
        </div>

        {/* Weight Input Modal */}
        {isWeightModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-800">记录今日体重</h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">保持记录，见证改变</p>
                </div>
                <button onClick={() => setIsWeightModalOpen(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                  <Icons.Close className="w-6 h-6" />
                </button>
              </div>

              <div className="relative mb-8">
                <input
                  type="number"
                  step="0.1"
                  autoFocus
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-6 py-5 text-4xl font-black text-center focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-blue-600 placeholder:text-gray-200"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsWeightModalOpen(false)}
                  className="py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold active:scale-95 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveWeight}
                  disabled={isSavingWeight || !inputWeight}
                  className="py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingWeight ? <Icons.Loader className="w-5 h-5 animate-spin" /> : <Icons.Check className="w-5 h-5" />}
                  保存记录
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomPullToRefresh>
  );
};