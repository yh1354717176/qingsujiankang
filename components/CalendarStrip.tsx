import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { formatDate, parseSafeDate, getBeijingDate } from '../utils/dateHelper';

interface CalendarStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  userPhoneNumber?: string; // 用于检查数据
  isPickerOpen: boolean;
  setIsPickerOpen: (open: boolean) => void;
}

/**
 * @description 日历条组件 - 显示最近7天的日期选择器并支持左右滑动切换周
 */
export const CalendarStrip: React.FC<CalendarStripProps> = ({ selectedDate, onSelectDate, userPhoneNumber, isPickerOpen, setIsPickerOpen }) => {
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());

  // 检查哪些日期有数据
  useEffect(() => {
    const dates = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nutriplan_analysis_')) {
        const date = key.split('_').pop();
        if (date) dates.add(date);
      }
      if (key && key.startsWith('nutriplan_log_')) {
        const parts = key.split('_');
        const date = parts[parts.length - 1];
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const hasRecords = Object.values(data).some((arr: any) => Array.isArray(arr) && arr.length > 0);
            if (hasRecords) dates.add(date);
          } catch (e) {
            // ignore
          }
        }
      }
    }
    setDatesWithData(dates);
  }, [userPhoneNumber, selectedDate]);

  const today = getBeijingDate();

  const generateDays = () => {
    const dates = [];
    const baseDate = parseSafeDate(selectedDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((todayDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    const referenceDate = (diffDays >= 0 && diffDays <= 6) ? new Date() : new Date(baseDate);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  // formatDate 已从 utils 导入

  const getDayName = (date: Date) => ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];

  // 手势处理
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 40) { // 降低阈值提高灵敏度
      const current = parseSafeDate(selectedDate);
      if (diff > 0) {
        // 向左划 -> 下一周
        const next = new Date(current);
        next.setDate(current.getDate() + 7);
        if (next <= new Date()) onSelectDate(formatDate(next));
        else if (selectedDate !== today) onSelectDate(today);
      } else {
        // 向右划 -> 上一周
        const prev = new Date(current);
        prev.setDate(current.getDate() - 7);
        onSelectDate(formatDate(prev));
      }
    }
    setTouchStart(null);
  };

  const displayDate = parseSafeDate(selectedDate);
  const days = generateDays();

  return (
    <div className="bg-white px-4 pt-4 pb-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-gray-900">{displayDate.getMonth() + 1}月</span>
          <span className="text-sm text-gray-400 font-medium">{displayDate.getFullYear()}</span>
        </div>
        <button
          onClick={() => setIsPickerOpen(true)}
          className="text-blue-600 text-sm font-bold flex items-center gap-1 active:opacity-60 p-1"
        >
          <Icons.Calendar className="w-4 h-4" />
          <span>选择日期</span>
        </button>
      </div>

      <div
        className="grid grid-cols-7 gap-1 touch-none active:cursor-grabbing"
        onTouchStart={(e) => {
          e.stopPropagation(); // 阻止冒泡到 PullToRefresh
          handleTouchStart(e);
        }}
        onTouchEnd={handleTouchEnd}
      >
        {days.map(date => {
          const dStr = formatDate(date);
          const isSelected = dStr === selectedDate;
          const isToday = dStr === today;
          const hasData = datesWithData.has(dStr);

          return (
            <button
              key={dStr}
              onClick={() => onSelectDate(dStr)}
              className="flex flex-col items-center py-2 relative outline-none"
            >
              <span className={`text-[10px] mb-2 font-medium ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                {getDayName(date)}
              </span>
              <div className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md' : isToday ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 active:bg-gray-100'
                }`}>
                <span className="text-sm font-bold">{isToday && !isSelected ? '今' : date.getDate()}</span>
              </div>
              {hasData && (
                <div className={`absolute bottom-0 w-1 h-1 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-green-500'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};