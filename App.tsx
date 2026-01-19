import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { Icons } from './components/Icons';
import { MealCard } from './components/MealCard';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { Feed } from './components/Feed';
import { CalendarStrip } from './components/CalendarStrip';
import { ImageViewer } from './components/ImageViewer';
import { MealType, FoodItem, DayLog, Tab, AnalysisResult, UserProfile } from './types';
import { analyzeMeals } from './services/geminiService';
import { compressImage } from './utils/imageHelper';
import { Keyboard } from '@capacitor/keyboard';


// --- Helper for Mock ID ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Colors for Chart ---
const COLORS = ['#FF8042', '#00C49F', '#FFBB28'];

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('currentUserProfile');
    return stored ? JSON.parse(stored) : null;
  });

  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>('feed'); // Default to Feed
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer State (Global for tracker)
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Keyboard Listeners for Mobile
  useEffect(() => {
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
    if (user) {
      const dataKey = `nutriplan_data_${user.phoneNumber}_${currentDate}`;
      const analysisKey = `nutriplan_analysis_${user.phoneNumber}_${currentDate}`;
      const historyKey = `nutriplan_history_${user.phoneNumber}`;

      // Fallback for legacy data (without date suffix) - Migrate if needed or just load for today
      const legacyDataKey = `nutriplan_data_${user.phoneNumber}`;
      const today = new Date().toISOString().split('T')[0];

      let savedData = localStorage.getItem(dataKey);

      // Migration logic: If no data for today, check legacy data and if current date is today, use it.
      if (!savedData && currentDate === today) {
        const legacyData = localStorage.getItem(legacyDataKey);
        if (legacyData) {
          savedData = legacyData;
          // Save it to new format
          localStorage.setItem(dataKey, legacyData);
        }
      }

      if (savedData) {
        setDayLog(JSON.parse(savedData));
      } else {
        setDayLog({
          [MealType.BREAKFAST]: [],
          [MealType.LUNCH]: [],
          [MealType.DINNER]: [],
          [MealType.SNACK]: [],
        });
      }

      const savedAnalysis = localStorage.getItem(analysisKey);
      if (savedAnalysis) {
        setAnalysis(JSON.parse(savedAnalysis));
      } else {
        setAnalysis(null);
      }

      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        setFoodHistory(JSON.parse(savedHistory));
      } else {
        setFoodHistory([]);
      }
    }
  }, [user?.phoneNumber, currentDate]);

  // Save Data on Log Change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`nutriplan_data_${user.phoneNumber}_${currentDate}`, JSON.stringify(dayLog));
    }
  }, [dayLog, user, currentDate]);


  // --- Handlers ---

  const handleLogin = (profile: UserProfile) => {
    localStorage.setItem('currentUserProfile', JSON.stringify(profile));
    setUser(profile);
    if (activeTab === 'feed') {
      setActiveTab('tracker');
    }
  };

  const handleUpdateUser = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    localStorage.setItem('currentUserProfile', JSON.stringify(updatedProfile));
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUserProfile');
    setUser(null);
    setAnalysis(null);
    setActiveTab('feed');
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
      } catch (err) {
        console.error("Image processing failed", err);
        alert("图片处理失败，请重试");
      } finally {
        setIsCompressing(false);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchAdd = () => {
    if (!batchInput.trim()) return;

    const lines = batchInput.split('\n').map(l => l.trim()).filter(l => l);

    // Save to history
    if (lines.length > 0) {
      const newHistory = Array.from(new Set([...lines, ...foodHistory])).slice(0, 20);
      setFoodHistory(newHistory);
      if (user) {
        localStorage.setItem(`nutriplan_history_${user.phoneNumber}`, JSON.stringify(newHistory));
      }
    }

    // Logic: Create items from text. Attach ALL images to the first generated item.
    const newItems: FoodItem[] = lines.map((line, index) => ({
      id: generateId(),
      name: line,
      description: '',
      images: index === 0 ? selectedImages : undefined // Attach images to the first item
    }));

    setDayLog(prev => ({
      ...prev,
      [currentMealType]: [...prev[currentMealType], ...newItems]
    }));

    setIsModalOpen(false);
  };

  const handleHistoryClick = (item: string) => {
    setBatchInput(prev => {
      if (!prev) return item;
      // If the last character is not a newline, add one
      if (prev.endsWith('\n')) return prev + item;
      return prev + '\n' + item;
    });
  };

  const handleRemoveFoods = (type: MealType, ids: string[]) => {
    const idSet = new Set(ids);
    setDayLog(prev => ({
      ...prev,
      [type]: prev[type].filter(item => !idSet.has(item.id))
    }));
  };

  const handleAnalyze = async () => {
    setActiveTab('analysis');
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeMeals(dayLog);
      setAnalysis(result);
      if (user) {
        localStorage.setItem(`nutriplan_analysis_${user.phoneNumber}_${currentDate}`, JSON.stringify(result));
      }
    } catch (err: any) {
      setError(err.message || "分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Render Helpers ---

  const renderTracker = () => {
    if (!user) return <Auth onLogin={handleLogin} />;

    return (
      <div className="animate-in fade-in duration-500">
        <div className="bg-blue-600 text-white p-6 rounded-b-[2.5rem] shadow-lg mb-6 pt-12 flex justify-between items-center pb-10">
          <div>
            <h1 className="text-2xl font-bold mb-1">你好, {user.name}</h1>
            <p className="text-blue-100 opacity-80">
              {currentDate === new Date().toISOString().split('T')[0] ? '今天' : currentDate}吃了什么?
            </p>
          </div>
          <div
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden cursor-pointer flex items-center justify-center"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Icons.User className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        <CalendarStrip selectedDate={currentDate} onSelectDate={setCurrentDate} />

        <div className="px-4 space-y-2">
          {Object.values(MealType).map((type) => (
            <MealCard
              key={type}
              type={type}
              items={dayLog[type]}
              onAdd={() => openAddModal(type)}
              onRemove={(ids) => handleRemoveFoods(type, ids)}
              onViewImage={(images) => setViewerImages(images)}
            />
          ))}
        </div>

        <div className="px-4 mt-6 pb-6">
          <button
            onClick={handleAnalyze}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <Icons.Chef className="w-6 h-6" />
            生成减肥计划
          </button>
        </div>
      </div>
    );
  };

  const renderAnalysis = () => {
    if (!user) return <Auth onLogin={handleLogin} />;

    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <Icons.Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-gray-800">正在分析您的饮食...</h2>
          <p className="text-gray-500 mt-2">Gemini AI 正在计算热量并制定计划</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
            <Icons.Utensils className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">出错了</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button onClick={() => setActiveTab('tracker')} className="mt-6 text-blue-600 font-medium">返回记录</button>
        </div>
      );
    }

    if (!analysis) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Icons.Activity className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">暂无分析数据</h2>
          <p className="text-gray-500 mt-2">请先在"记录"页面添加食物并点击生成。</p>
          <button onClick={() => setActiveTab('tracker')} className="mt-6 bg-blue-100 text-blue-700 px-6 py-2 rounded-full font-medium">去记录</button>
        </div>
      );
    }

    const chartData = [
      { name: '蛋白质', value: analysis.macros.protein },
      { name: '碳水', value: analysis.macros.carbs },
      { name: '脂肪', value: analysis.macros.fat },
    ];

    const mealFeedbackMap = {
      [MealType.BREAKFAST]: analysis.mealFeedback.breakfast,
      [MealType.LUNCH]: analysis.mealFeedback.lunch,
      [MealType.DINNER]: analysis.mealFeedback.dinner,
      [MealType.SNACK]: analysis.mealFeedback.snack,
    };

    return (
      <div className="animate-in slide-in-from-right duration-500">
        <div className="bg-white sticky top-0 z-10 p-4 shadow-sm border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">AI 分析报告</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-normal">{currentDate}</span>
            <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {analysis.macros.calories} kcal
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6 pb-6">
          {/* Chart Section */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Icons.Activity className="w-5 h-5 text-blue-500" />
              营养摄入估算
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}g`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-2">
              <div className="bg-orange-50 p-2 rounded-lg">
                <div className="text-xs text-gray-500">蛋白质</div>
                <div className="font-bold text-orange-500">{analysis.macros.protein}g</div>
              </div>
              <div className="bg-green-50 p-2 rounded-lg">
                <div className="text-xs text-gray-500">碳水</div>
                <div className="font-bold text-green-500">{analysis.macros.carbs}g</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded-lg">
                <div className="text-xs text-gray-500">脂肪</div>
                <div className="font-bold text-yellow-500">{analysis.macros.fat}g</div>
              </div>
            </div>
          </div>

          {/* Overall Feedback Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl shadow-sm border border-indigo-100">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Icons.User className="w-5 h-5" />
              当日总结
            </h3>
            <p className="text-indigo-800 text-sm leading-relaxed">
              {analysis.feedback}
            </p>
          </div>

          {/* Per Meal Analysis */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 ml-1">分餐点评</h3>
            {Object.entries(mealFeedbackMap).map(([type, feedback]) => (
              <div key={type} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 mb-1">{type}</h4>
                <p className="text-xs text-gray-600">{feedback}</p>
              </div>
            ))}
          </div>

          {/* Plan Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2 flex items-center gap-2">
              <Icons.Chef className="w-5 h-5 text-green-600" />
              明日减肥计划
            </h3>
            <div className="prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-800 prose-headings:font-bold prose-strong:text-gray-800 prose-li:marker:text-blue-500">
              <ReactMarkdown>{analysis.plan}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 h-full w-full relative overflow-hidden flex flex-col safe-area-top safe-area-bottom">
      {/* Main Content Area (Scrollable) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative w-full"
      >
        {activeTab === 'feed' && <Feed />}
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
                setActiveTab('analysis'); // Go to analysis tab for that date
              }}
            />
          ) : (
            <Auth onLogin={handleLogin} />
          )
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 grid grid-cols-4 shrink-0 z-50">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${activeTab === 'feed' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Icons.Home className="w-6 h-6" />
          <span className="text-xs font-medium">社区</span>
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${activeTab === 'tracker' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Icons.Utensils className="w-6 h-6" />
          <span className="text-xs font-medium">记录</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${activeTab === 'analysis' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Icons.Activity className="w-6 h-6" />
          <span className="text-xs font-medium">分析</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Icons.User className="w-6 h-6" />
          <span className="text-xs font-medium">我的</span>
        </button>
      </div>

      {/* Add Food Modal (Batch + Images) */}
      {isModalOpen && (
        <div className={`fixed inset-0 bg-black/50 z-[60] flex items-end justify-center backdrop-blur-sm animate-in fade-in transition-all duration-300`}>
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
              disabled={!batchInput.trim() || isCompressing}
              className="w-full bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl mt-4 active:scale-95 transition-all shadow-lg shadow-blue-200 shrink-0"
            >
              {isCompressing ? '处理图片中...' : '确认添加'}
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

    </div>
  );
};

export default App;