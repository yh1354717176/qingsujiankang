import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { Icons } from './components/Icons';
import { MealCard } from './components/MealCard';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { Feed } from './components/Feed';
import { CalendarStrip } from './components/CalendarStrip';
import { DatePicker } from './components/DatePicker';
import { ImageViewer } from './components/ImageViewer';
import { MealType, FoodItem, DayLog, Tab, AnalysisResult, UserProfile } from './types';
import { analyzeMeals, syncUser, syncMeal, fetchDayData, fetchUser } from './services/geminiService';
import { compressImage } from './utils/imageHelper';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import PullToRefresh from 'react-simple-pull-to-refresh';


// --- Helper for Mock ID ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Colors for Chart ---
const COLORS = ['#FF8042', '#00C49F', '#FFBB28'];

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 初次加载时尝试恢复会话 (仍然保留账号的基础 Phone 存储以便自动登录)
  useEffect(() => {
    const stored = localStorage.getItem('currentUserProfile');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsInitialLoading(false);
  }, []);

  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>('feed'); // Default to Feed
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [dayLog, setDayLog] = useState<DayLog>({
    [MealType.BREAKFAST]: [],
    [MealType.LUNCH]: [],
    [MealType.DINNER]: [],
    [MealType.SNACK]: [],
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMealType, setCurrentMealType] = useState<MealType>(MealType.BREAKFAST);
  const [batchInput, setBatchInput] = useState('');
  const [foodHistory, setFoodHistory] = useState<string[]>([]); // History State
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer State (Global for tracker)
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Keyboard & Status Bar Listeners
  useEffect(() => {
    // 设置状态栏样式：沉浸式模式 - 透明状态栏 + 白色文字，让 WebView 延伸到状态栏区域
    const configureStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true }); // WebView 延伸到状态栏区域
        await StatusBar.setStyle({ style: Style.Dark }); // 白色文字/图标
        await StatusBar.setBackgroundColor({ color: '#00000000' }); // 透明背景
      } catch (e) {
        console.log('Status Bar plugin not available');
      }
    };
    configureStatusBar();

    let showHandle: any;
    let hideHandle: any;

    const setupListeners = async () => {
      try {
        showHandle = await Keyboard.addListener('keyboardWillShow', () => {
          setIsKeyboardVisible(true);
        });
        hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
        });
      } catch (e) {
        // Fallback for web browser
        const handleResize = () => {
          if (window.visualViewport) {
            setIsKeyboardVisible(window.visualViewport.height < window.innerHeight * 0.8);
          }
        };
        window.visualViewport?.addEventListener('resize', handleResize);
        return () => window.visualViewport?.removeEventListener('resize', handleResize);
      }
    };

    setupListeners();

    return () => {
      if (showHandle) showHandle.remove();
      if (hideHandle) hideHandle.remove();
    };
  }, []);

  // Scroll to top on tab change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [activeTab]);

  // Load Data on User Change or Date Change
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          // 1. 同步最新的用户信息（如头像、昵称）
          fetchUser(user.phoneNumber).then(latest => {
            if (latest && !latest.error) {
              setUser(latest);
              localStorage.setItem('currentUserProfile', JSON.stringify(latest));
            }
          }).catch(e => console.error("Update profile failed", e));

          // 2. 从云端拉取全天数据
          setIsAnalyzing(true);
          const cloudData = await fetchDayData(user.phoneNumber, currentDate);

          if (cloudData.segments) {
            const newLog: DayLog = {
              [MealType.BREAKFAST]: [],
              [MealType.LUNCH]: [],
              [MealType.DINNER]: [],
              [MealType.SNACK]: [],
            };
            cloudData.segments.forEach((seg: any) => {
              newLog[seg.meal_type as MealType] = seg.food_items;
            });
            setDayLog(newLog);
          } else {
            setDayLog({
              [MealType.BREAKFAST]: [],
              [MealType.LUNCH]: [],
              [MealType.DINNER]: [],
              [MealType.SNACK]: [],
            });
          }

          if (cloudData.analysis) {
            setAnalysis({
              macros: cloudData.analysis.macros,
              feedback: cloudData.analysis.feedback,
              mealFeedback: cloudData.analysis.mealFeedback,
              plan: cloudData.analysis.plan
            });
          } else {
            setAnalysis(null);
          }
        } catch (err) {
          console.error("Failed to fetch cloud data", err);
          showToast("加载数据失败，请检查网络或重试。");
          setDayLog({
            [MealType.BREAKFAST]: [],
            [MealType.LUNCH]: [],
            [MealType.DINNER]: [],
            [MealType.SNACK]: [],
          });
          setAnalysis(null);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    loadData();
  }, [user?.phoneNumber, currentDate]);

  // 本地存储仅用于极小量的非敏感 UI 记录 (如历史输入补全)
  useEffect(() => {
    if (foodHistory.length > 0 && user) {
      localStorage.setItem(`nutriplan_history_${user.phoneNumber}`, JSON.stringify(foodHistory));
    }
  }, [foodHistory, user]);


  // --- Handlers ---

  const handleLogin = async (profile: UserProfile) => {
    try {
      await syncUser(profile);
      localStorage.setItem('currentUserProfile', JSON.stringify(profile));
      setUser(profile);
      if (activeTab === 'feed') {
        setActiveTab('tracker');
      }
      showToast("登录成功", 'success');
    } catch (err: any) {
      showToast(`登录/同步失败: ${err.message}`);
    }
  };

  const handleUpdateUser = async (updatedProfile: UserProfile) => {
    try {
      await syncUser(updatedProfile);
      setUser(updatedProfile);
      localStorage.setItem('currentUserProfile', JSON.stringify(updatedProfile));
      showToast("资料已同步", 'success');
    } catch (err: any) {
      showToast(`同步失败: ${err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUserProfile');
    setUser(null);
    setAnalysis(null);
    setActiveTab('feed');
    showToast("已退出登录", 'success');
  };

  const openAddModal = (type: MealType) => {
    setCurrentMealType(type);
    setBatchInput('');
    setSelectedImages([]);
    setIsModalOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCompressing(true);
      const files = Array.from(e.target.files) as File[];
      try {
        const compressedPromises = files.map(file => compressImage(file));
        const newImages = await Promise.all(compressedPromises);
        setSelectedImages(prev => [...prev, ...newImages]);
        showToast("图片已添加", 'success');
      } catch (err) {
        console.error("Image processing failed", err);
        showToast("图片处理失败，请重试");
      } finally {
        setIsCompressing(false);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    showToast("图片已移除", 'success');
  };

  const handleBatchAdd = async () => {
    if (!batchInput.trim() || isSavingMeal) {
      if (!batchInput.trim()) showToast("请输入食物名称");
      return;
    }

    setIsSavingMeal(true);

    const lines = batchInput.split('\n').map(l => l.trim()).filter(l => l);

    // Save to history (Local UI helper)
    if (lines.length > 0) {
      const newHistory = Array.from(new Set([...lines, ...foodHistory])).slice(0, 20);
      setFoodHistory(newHistory);
    }

    // Logic: Create items from text. Attach ALL images to the first generated item.
    const newItems: FoodItem[] = lines.map((line, index) => ({
      id: generateId(),
      name: line,
      description: '',
      images: index === 0 ? selectedImages : undefined // Attach images to the first item
    }));

    const updatedMeals = [...dayLog[currentMealType], ...newItems];

    // 同步到云端
    if (user) {
      try {
        await syncMeal(user.phoneNumber, currentDate, currentMealType, updatedMeals);
        const updatedLog = {
          ...dayLog,
          [currentMealType]: updatedMeals
        };
        setDayLog(updatedLog);
        setIsModalOpen(false);
        showToast("记录已保存", 'success');
      } catch (err: any) {
        showToast(`保存失败: ${err.message}`);
      } finally {
        setIsSavingMeal(false);
      }
    } else {
      showToast("请先登录以保存记录。");
      setIsSavingMeal(false);
    }
  };

  const handleHistoryClick = (item: string) => {
    setBatchInput(prev => {
      if (!prev) return item;
      // If the last character is not a newline, add one
      if (prev.endsWith('\n')) return prev + item;
      return prev + '\n' + item;
    });
  };

  const handleRemoveFoods = async (type: MealType, ids: string[]) => {
    const idSet = new Set(ids);
    const updatedMeals = dayLog[type].filter(item => !idSet.has(item.id));

    // 同步到云端
    if (user) {
      try {
        await syncMeal(user.phoneNumber, currentDate, type, updatedMeals);
        const updatedLog = {
          ...dayLog,
          [type]: updatedMeals
        };
        setDayLog(updatedLog);
        showToast("已删除", 'success');
      } catch (err: any) {
        showToast(`删除失败: ${err.message}`);
      }
    } else {
      showToast("请先登录以删除记录。");
    }
  };

  const handleAnalyze = async () => {
    setActiveTab('analysis');
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeMeals(dayLog, user, currentDate);
      setAnalysis(result);

      // 检查是否有数据库保存错误
      if ((result as any)._dbError) {
        showToast(`分析完成，但保存失败: ${(result as any)._dbError}`);
        console.warn("DB Save Error:", (result as any)._dbError);
      } else {
        showToast("分析完成！", 'success');
      }
    } catch (err: any) {
      setError(err.message || "分析失败，请稍后重试。");
      showToast("分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Render Helpers ---

  const renderTracker = () => {
    if (isInitialLoading) return null;
    if (!user) return <Auth onLogin={handleLogin} />;

    // 计算今日总热量 - 优先使用 AI 分析结果，如果没有则使用估算值
    const todayCalories = analysis?.macros?.calories || Object.values(dayLog).flat().reduce((sum, item) => {
      // 如果食物名包含数字可能是热量，否则估算100kcal
      return sum + 100;
    }, 0);
    const totalItems = Object.values(dayLog).flat().length;

    return (
      <PullToRefresh
        className="flex-1 bg-gray-50"
        isPullable={!isModalOpen && !isDatePickerOpen}
        onRefresh={async () => {
          try {
            const cloudData = await fetchDayData(user.phoneNumber, currentDate);
            if (cloudData.segments) {
              const newLog: DayLog = {
                [MealType.BREAKFAST]: [],
                [MealType.LUNCH]: [],
                [MealType.DINNER]: [],
                [MealType.SNACK]: [],
              };
              cloudData.segments.forEach((seg: any) => {
                newLog[seg.meal_type as MealType] = seg.food_items;
              });
              setDayLog(newLog);
            }
            showToast("已刷新", 'success');
          } catch (err: any) {
            showToast(`刷新失败: ${err.message}`);
          }
        }}
        pullingContent={<div className="text-gray-500 py-4 text-center font-medium text-sm">下拉刷新</div>}
        refreshingContent={
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Icons.Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-500 font-medium font-['Inter']">正在获取今日记录...</span>
          </div>
        }
      >
        <div className="flex flex-col bg-gray-50">
          {/* Fixed Header - 延伸到状态栏区域 */}
          <div
            className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white z-10 px-6 pb-8 rounded-b-[2.5rem] shadow-xl overflow-hidden relative"
            style={{ paddingTop: 'max(24px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 24px))' }}
          >
            {/* 装饰性背景元素 */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-12 w-40 h-40 rounded-full bg-white/5" />

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-blue-200 text-sm mb-1">👋 你好</p>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-blue-100/80 text-sm mt-1">
                  {currentDate === new Date().toISOString().split('T')[0]
                    ? '今天想吃点什么？'
                    : `${currentDate} 的记录`
                  }
                </p>
              </div>
              <div
                onClick={() => setActiveTab('profile')}
                className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden cursor-pointer flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Icons.User className="w-6 h-6 text-white" />
                )}
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
              <div className="bg-white/15 rounded-2xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <Icons.Utensils className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/70 text-xs">已记录</span>
                </div>
                <div className="text-white font-bold text-xl">{totalItems} <span className="text-sm font-normal text-white/60">项</span></div>
              </div>
              <div className="bg-white/15 rounded-2xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <Icons.Activity className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/70 text-xs">估算热量</span>
                </div>
                <div className="text-white font-bold text-xl">{todayCalories} <span className="text-sm font-normal text-white/60">kcal</span></div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            {/* 日历 */}
            <CalendarStrip
              selectedDate={currentDate}
              onSelectDate={setCurrentDate}
              isPickerOpen={isDatePickerOpen}
              setIsPickerOpen={setIsDatePickerOpen}
            />

            {/* 细分隔线 */}
            <div className="mx-4 border-t border-gray-100" />

            {/* 餐食卡片 */}
            <div className="px-4 pt-4 pb-4 space-y-3">
              {Object.values(MealType).map((type, index) => (
                <div
                  key={type}
                  className="animate-in fade-in slide-in-from-bottom duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <MealCard
                    type={type}
                    items={dayLog[type]}
                    onAdd={() => openAddModal(type)}
                    onRemove={(ids) => handleRemoveFoods(type, ids)}
                    onViewImage={(images) => setViewerImages(images)}
                  />
                </div>
              ))}
            </div>

            <div className="px-4 pt-6 pb-12">
              <button
                onClick={analysis ? () => setActiveTab('analysis') : handleAnalyze}
                disabled={totalItems === 0 || isAnalyzing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-3"
              >
                {isAnalyzing ? <Icons.Loader className="w-6 h-6 animate-spin" /> : <Icons.Chef className="w-6 h-6" />}
                <span>{isAnalyzing ? '分析中...' : analysis ? '查看 AI 减肥计划' : totalItems > 0 ? '生成 AI 减肥计划' : '请先记录今日饮食'}</span>
              </button>
            </div>
          </div>
        </div>
      </PullToRefresh>
    );
  };

  const renderAnalysis = () => {
    if (isInitialLoading) return null;
    if (!user) return <Auth onLogin={handleLogin} />;

    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-b from-gray-50 to-gray-100 px-6 py-12">
          {/* 装饰背景 */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-10 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl" />

          {/* 主要内容卡片 */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 max-w-sm w-full">
            {/* 动态 loading 图标 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Icons.Chef className="w-10 h-10 text-white" />
                </div>
                {/* 脉冲动画圈 */}
                <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">AI 正在分析中</h2>
            <p className="text-gray-500 text-center text-sm mb-6">Gemini 正在分析您的饮食并生成个性化建议...</p>

            {/* 进度指示器 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Icons.Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">读取饮食记录</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icons.Loader className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
                <span className="text-sm text-gray-600">计算营养成分<span className="text-gray-400">...</span></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icons.Activity className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-400">生成减肥建议</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
            <Icons.AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">出错了</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button onClick={() => setActiveTab('tracker')} className="mt-6 text-blue-600 font-medium">返回记录</button>
        </div>
      );
    }

    if (!analysis) {
      return (
        <PullToRefresh
          isPullable={!isModalOpen && !isDatePickerOpen}
          onRefresh={async () => {
            if (user) {
              const cloudData = await fetchDayData(user.phoneNumber, currentDate);
              if (cloudData.analysis) {
                setAnalysis(cloudData.analysis);
              }
              showToast("已刷新", 'success');
            }
          }}
          pullingContent={<div className="text-gray-500 py-4 text-center font-medium text-sm">下拉刷新</div>}
          refreshingContent={
            <div className="flex flex-col items-center justify-center py-4 gap-2">
              <Icons.Loader className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-sm text-gray-500 font-medium font-['Inter']">刷新中...</span>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Icons.Activity className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">暂无分析数据</h2>
            <p className="text-gray-500 mt-2">请先在"记录"页面添加食物并点击生成。</p>
            <button onClick={() => setActiveTab('tracker')} className="mt-6 bg-blue-100 text-blue-700 px-6 py-2 rounded-full font-medium">去记录</button>
          </div>
        </PullToRefresh>
      );
    }

    const chartData = [
      { name: '蛋白质', value: analysis.macros.protein },
      { name: '碳水', value: analysis.macros.carbs },
      { name: '脂肪', value: analysis.macros.fat },
    ];

    const mealFeedbackMap = {
      [MealType.BREAKFAST]: analysis?.mealFeedback?.breakfast || '',
      [MealType.LUNCH]: analysis?.mealFeedback?.lunch || '',
      [MealType.DINNER]: analysis?.mealFeedback?.dinner || '',
      [MealType.SNACK]: analysis?.mealFeedback?.snack || '',
    };

    return (
      <PullToRefresh
        isPullable={!isModalOpen && !isDatePickerOpen}
        onRefresh={async () => {
          if (user) {
            try {
              const cloudData = await fetchDayData(user.phoneNumber, currentDate);
              if (cloudData.analysis) {
                setAnalysis(cloudData.analysis);
              }
              showToast("已刷新", 'success');
            } catch (e) {
              showToast("刷新失败");
            }
          }
        }}
        pullingContent={<div className="text-gray-500 py-4 text-center font-medium text-sm">下拉刷新</div>}
        refreshingContent={
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Icons.Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-500 font-medium font-['Inter']">更新分析中...</span>
          </div>
        }
      >
        <div className="flex flex-col bg-gray-50">
          {/* Header */}
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 z-20 px-5 pb-6 shadow-lg flex items-center justify-between rounded-b-[2rem]"
            style={{ paddingTop: 'max(24px, calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 24px))' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('tracker')}
                className="p-1.5 -ml-1 text-white/80 hover:text-white transition-colors"
              >
                <Icons.ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white leading-tight">AI 分析报告</h2>
                <span className="text-[10px] text-blue-100 font-medium tracking-wide uppercase">{currentDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Icons.History className="w-3.5 h-3.5" />
                重新生成
              </button>
              <div className="text-sm font-bold text-blue-600 bg-white px-4 py-1.5 rounded-full shadow-sm">
                {analysis.macros.calories} <span className="text-[10px] opacity-60">kcal</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-6 pb-12 flex-1">
            {/* Chart Section */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Icons.Activity className="w-5 h-5 text-blue-500" />
                营养摄入估算
              </h3>
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#FF6B6B', '#00C49F', '#FFBB28'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="rect"
                      formatter={(value) => <span className="text-xs font-bold text-gray-500">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-orange-50/50 p-3 rounded-2xl text-center">
                  <div className="text-[11px] text-gray-400 font-bold mb-1">蛋白质</div>
                  <div className="text-lg font-black text-orange-500">{analysis.macros.protein}<span className="text-[10px] ml-0.5">g</span></div>
                </div>
                <div className="bg-green-50/50 p-3 rounded-2xl text-center">
                  <div className="text-[11px] text-gray-400 font-bold mb-1">碳水</div>
                  <div className="text-lg font-black text-green-500">{analysis.macros.carbs}<span className="text-[10px] ml-0.5">g</span></div>
                </div>
                <div className="bg-yellow-50/50 p-3 rounded-2xl text-center">
                  <div className="text-[11px] text-gray-400 font-bold mb-1">脂肪</div>
                  <div className="text-lg font-black text-yellow-500">{analysis.macros.fat}<span className="text-[10px] ml-0.5">g</span></div>
                </div>
              </div>
            </div>

            {/* Overall Feedback Section */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-[1.5px] rounded-[2.5rem] shadow-xl shadow-indigo-100 overflow-hidden group">
              <div className="bg-white rounded-[2.4rem] p-6 relative h-full">
                {/* 装饰性背景 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-50 rounded-full" />

                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-3 relative z-10 text-lg">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                    <Icons.User className="w-5 h-5 text-white" />
                  </div>
                  当日健康总结
                </h3>
                <div className="relative z-10 space-y-3">
                  <div className="h-0.5 w-12 bg-indigo-100 rounded-full" />
                  <p className="text-gray-700 text-[15px] leading-relaxed font-bold">
                    {analysis.feedback}
                  </p>
                </div>
              </div>
            </div>

            {/* Per Meal Analysis */}
            <div className="space-y-5">
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex flex-col">
                  <h3 className="font-black text-gray-900 text-xl tracking-tight">分餐营养点评</h3>
                  <div className="h-1 w-8 bg-blue-500 rounded-full mt-1" />
                </div>
                <span className="text-[10px] text-gray-300 font-black tracking-[0.2em] uppercase">Detailed Review</span>
              </div>

              <div className="grid gap-4">
                {Object.entries(mealFeedbackMap).map(([type, feedback]) => {
                  if (!feedback) return null;

                  const config: any = {
                    [MealType.BREAKFAST]: { icon: Icons.Breakfast, color: 'orange', label: '精致早餐', bg: 'from-orange-400 to-amber-500', text: 'text-orange-600' },
                    [MealType.LUNCH]: { icon: Icons.Lunch, color: 'green', label: '能量午餐', bg: 'from-emerald-400 to-teal-500', text: 'text-emerald-600' },
                    [MealType.DINNER]: { icon: Icons.Dinner, color: 'indigo', label: '轻盈晚餐', bg: 'from-indigo-400 to-blue-500', text: 'text-indigo-600' },
                    [MealType.SNACK]: { icon: Icons.Snack, color: 'purple', label: '健康加餐', bg: 'from-purple-400 to-fuchsia-500', text: 'text-purple-600' },
                  };
                  const theme = config[type] || config[MealType.BREAKFAST];

                  return (
                    <div key={type} className="bg-white p-5 rounded-[2.2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/50 flex gap-5 transition-all active:scale-[0.98] hover:shadow-lg">
                      <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${theme.bg} shrink-0 flex items-center justify-center shadow-lg shadow-${theme.color}-100 ring-4 ring-white`}>
                        <theme.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[13px] font-black uppercase tracking-wider ${theme.text}`}>{theme.label}</span>
                          <div className="h-1 w-1 rounded-full bg-gray-200" />
                        </div>
                        <p className="text-[14px] text-gray-600 leading-snug font-bold line-clamp-3">
                          {feedback}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </PullToRefresh>
    );
  };

  return (
    <div className="bg-gray-50 h-full w-full relative overflow-hidden flex flex-col">
      {/* Main Content Area (Scrollable) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative w-full"
      >
        {activeTab === 'feed' && (
          <Feed
            showToast={showToast}
            onNavigateToProfile={() => setActiveTab('profile')}
            onNavigateToDate={(date) => {
              setCurrentDate(date);
              setActiveTab('analysis');
            }}
          />
        )}
        {activeTab === 'tracker' && renderTracker()}
        {activeTab === 'analysis' && renderAnalysis()}
        {activeTab === 'profile' && (
          user ? (
            <Profile
              user={user}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              onNavigateToDate={(date) => {
                setCurrentDate(date);
                setActiveTab('analysis');
              }}
              showToast={showToast}
            />
          ) : (
            <Auth onLogin={handleLogin} />
          )
        )}
      </div>

      {/* Bottom Navigation - Premium Integrated Design */}
      <div
        className="bg-white border-t border-gray-100 flex justify-around items-stretch shrink-0 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]"
        style={{ height: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {[
          { id: 'feed', icon: Icons.Home, label: '社区' },
          { id: 'tracker', icon: Icons.Utensils, label: '记录' },
          { id: 'profile', icon: Icons.User, label: '我的' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className="relative flex-1 flex flex-col items-center justify-center transition-all duration-300 active:scale-90"
            >
              {/* Active Background Glow - Very Subtle */}
              {isActive && (
                <div className="absolute top-1 w-12 h-12 bg-blue-500/5 rounded-full animate-pulse" />
              )}

              {/* Icon Container */}
              <div className={`transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                <tab.icon
                  className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[11px] mt-1 transition-all duration-300 font-semibold ${isActive ? 'text-blue-600 scale-100 opacity-100' : 'text-gray-400 scale-95 opacity-80'
                  }`}
              >
                {tab.label}
              </span>

              {/* Minimal Line Indicator */}
              <div
                className={`absolute bottom-2 w-1.5 h-1.5 rounded-full bg-blue-600 transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`}
              />
            </button>
          );
        })}
      </div>

      {/* Add Food Modal (Batch + Images) */}
      {isModalOpen && (
        <div className={`fixed inset-0 bg-black/60 z-[60] flex items-end justify-center animate-in fade-in transition-all duration-300`}>
          <div
            className={`bg-white w-full max-w-md rounded-t-[2rem] p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col transition-transform`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">记录{currentMealType}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.Close className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto no-scrollbar flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  吃了什么? <span className="text-xs font-normal text-gray-400">(一行一项)</span>
                </label>

                {/* History Chips */}
                {foodHistory.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto no-scrollbar">
                    {foodHistory.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleHistoryClick(item)}
                        className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-100"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  autoFocus
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder={'例如：\n一碗牛肉面\n一个荷包蛋'}
                  className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加照片 <span className="text-xs font-normal text-gray-400">(可选)</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="w-20 h-20 relative rounded-lg overflow-hidden border border-gray-200">
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                      >
                        <Icons.Close className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {isCompressing ? (
                      <Icons.Loader className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Icons.Camera className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">上传</span>
                      </>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
            </div>

            <button
              onClick={handleBatchAdd}
              disabled={!batchInput.trim() || isCompressing || isSavingMeal}
              className="w-full bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl mt-4 active:scale-95 transition-all shadow-lg shadow-blue-200 shrink-0 flex items-center justify-center gap-2"
            >
              {isSavingMeal ? (
                <>
                  <Icons.Loader className="w-5 h-5 animate-spin" />
                  <span>正在保存...</span>
                </>
              ) : isCompressing ? (
                '处理图片中...'
              ) : (
                '确认添加'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Global Image Viewer for Tracker */}
      {viewerImages && (
        <ImageViewer
          images={viewerImages}
          initialIndex={0}
          onClose={() => setViewerImages(null)}
        />
      )}
      {/* Global Date Picker */}
      <DatePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={currentDate}
        onSelect={setCurrentDate}
      />

    </div>
  );
};

export default App;