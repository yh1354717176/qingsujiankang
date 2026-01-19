import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface DatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string; // YYYY-MM-DD
    onSelect: (date: string) => void;
}

// 农历/变动节假日数据 (2025-2030)
const LUNAR_HOLIDAYS: Record<string, string> = {
    '2025-01-28': '除夕', '2025-01-29': '春节', '2025-04-04': '清明', '2025-05-31': '端午', '2025-10-06': '中秋',
    '2026-02-16': '除夕', '2026-02-17': '春节', '2026-04-05': '清明', '2026-06-19': '端午', '2026-09-25': '中秋',
    '2027-02-05': '除夕', '2027-02-06': '春节', '2027-04-05': '清明', '2027-06-09': '端午', '2027-09-15': '中秋',
    '2028-01-25': '除夕', '2028-01-26': '春节', '2028-04-04': '清明', '2028-05-28': '端午', '2028-10-03': '中秋',
    '2029-02-12': '除夕', '2029-02-13': '春节', '2029-04-04': '清明', '2029-06-16': '端午', '2029-09-22': '中秋',
    '2030-02-02': '除夕', '2030-02-03': '春节', '2030-04-05': '清明', '2030-06-05': '端午', '2030-09-12': '中秋',
};

// 固定日期公历节日
const FIXED_HOLIDAYS: Record<string, string> = {
    '01-01': '元旦',
    '05-01': '劳动节',
    '10-01': '国庆',
};

const getHoliday = (dateStr: string) => {
    if (LUNAR_HOLIDAYS[dateStr]) return LUNAR_HOLIDAYS[dateStr];
    const mmdd = dateStr.substring(5);
    return FIXED_HOLIDAYS[mmdd] || null;
};

/**
 * @description 日期选择器组件 - 重写版本：移除 Portal 提高在安卓 WebView 下的兼容性
 */
export const DatePicker: React.FC<DatePickerProps> = ({ isOpen, onClose, selectedDate, onSelect }) => {
    const parseSafeDate = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return new Date();
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const [viewDate, setViewDate] = useState(parseSafeDate(selectedDate));
    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (isOpen) {
            setViewDate(parseSafeDate(selectedDate));
        }
    }, [isOpen, selectedDate]);

    if (!isOpen) return null;

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const generateCalendar = () => {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const days = [];
        const startDate = new Date(year, month, 1);
        startDate.setDate(1 - firstDayOfMonth);

        for (let i = 0; i < 42; i++) {
            const current = new Date(startDate);
            current.setDate(startDate.getDate() + i);
            const dStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            days.push({
                day: current.getDate(),
                month: current.getMonth(),
                year: current.getFullYear(),
                isCurrentMonth: current.getMonth() === month,
                dateStr: dStr,
                holiday: getHoliday(dStr)
            });
        }
        return days;
    };

    const handleMonthChange = (offset: number) => setViewDate(new Date(year, month + offset, 1));
    const handleYearChange = (offset: number) => setViewDate(new Date(year + offset, month, 1));

    const handleDateClick = (d: { year: number, month: number, day: number }) => {
        const dateStr = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
        onSelect(dateStr);
        onClose();
    };

    // --- Swipe Month Support ---
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchYStart, setTouchYStart] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
        setTouchYStart(e.targetTouches[0].clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null || touchYStart === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const touchYEnd = e.changedTouches[0].clientY;
        const diffX = touchStart - touchEnd;
        const diffY = touchYStart - touchYEnd;

        // 只有在 X 轴位移大于 Y 轴位移（横向滑动）时才触发切换
        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) handleMonthChange(1); // 向左滑 -> 下一月
            else handleMonthChange(-1);           // 向右滑 -> 上一月
        }
        setTouchStart(null);
        setTouchYStart(null);
    };

    return (
        <div
            className="fixed inset-0 z-[999] flex flex-col justify-end"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
            {/* 遮罩背景：点击关闭 */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            {/* 选择器卡片 */}
            <div
                className="relative w-full max-w-md mx-auto bg-white rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden"
                style={{ maxHeight: '90vh' }}
                onTouchStart={(e) => {
                    e.stopPropagation();
                    handleTouchStart(e);
                }}
                onTouchEnd={handleTouchEnd}
            >
                {/* 顶部标题栏 */}
                <div className="px-6 pt-6 pb-2 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-0.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleYearChange(-1); }}
                                className="p-2 active:bg-gray-100 rounded-lg text-gray-400"
                            >
                                <Icons.ChevronsLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleMonthChange(-1); }}
                                className="p-2 active:bg-gray-100 rounded-lg text-gray-400"
                            >
                                <Icons.ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>
                        <span className="text-xl font-bold text-gray-900">{year}年{month + 1}月</span>
                        <div className="flex gap-0.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleMonthChange(1); }}
                                className="p-2 active:bg-gray-100 rounded-lg text-gray-400"
                            >
                                <Icons.ChevronRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleYearChange(1); }}
                                className="p-2 active:bg-gray-100 rounded-lg text-gray-400"
                            >
                                <Icons.ChevronsRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 星期表头 */}
                <div className="grid grid-cols-7 px-4 shrink-0">
                    {['日', '一', '二', '三', '四', '五', '六'].map(w => (
                        <div key={w} className="text-center text-[10px] font-bold text-gray-300 py-3">{w}</div>
                    ))}
                </div>

                {/* 日历网格 */}
                <div className="grid grid-cols-7 px-4 pb-4 flex-1 overflow-y-auto no-scrollbar select-none">
                    {generateCalendar().map((d, i) => {
                        const isSelected = d.dateStr === selectedDate;
                        const isToday = d.dateStr === todayStr;
                        return (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); handleDateClick(d); }}
                                className={`aspect-square flex flex-col items-center justify-center relative rounded-full m-0.5 transition-all
                                    ${isSelected ? 'bg-blue-600 text-white shadow-md' :
                                        isToday ? 'bg-blue-50 text-blue-600 font-bold' :
                                            d.isCurrentMonth ? 'text-gray-700 active:bg-gray-100' : 'text-gray-200'}
                                `}
                            >
                                <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>
                                    {isToday && !isSelected ? '今' : d.day}
                                </span>
                                {d.holiday && (
                                    <span className={`text-[8px] absolute bottom-1 truncate px-1 max-w-[90%] ${isSelected ? 'text-blue-100' : 'text-red-500'}`}>
                                        {d.holiday}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 底部操作栏 */}
                <div className="px-6 pb-8 pt-2 flex gap-3 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(todayStr); onClose(); }}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl text-sm active:bg-gray-200"
                    >
                        回到今天
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl text-sm active:bg-blue-700 shadow-lg shadow-blue-100"
                    >
                        确认
                    </button>
                </div>
            </div>
        </div>
    );
};
