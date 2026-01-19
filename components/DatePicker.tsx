import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

interface DatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string; // YYYY-MM-DD
    onSelect: (date: string) => void;
}

// 农历数据 (仅基础日期，用于真机显示测试)
const LUNAR_HOLIDAYS: Record<string, string> = {
    '2026-02-16': '除夕', '2026-02-17': '春节', '2026-04-05': '清明', '2026-06-19': '端午', '2026-09-25': '中秋',
};

const FIXED_HOLIDAYS: Record<string, string> = {
    '01-01': '元旦', '05-01': '劳动节', '10-01': '国庆',
};

/**
 * @description 生成指定年月的日历数据
 */
const generateCalendarForMonth = (year: number, month: number, selectedDate: string) => {
    const days = [];
    const firstDay = new Date(year, month, 1);
    const startDay = new Date(firstDay);
    startDay.setDate(1 - firstDay.getDay());

    for (let i = 0; i < 42; i++) {
        const current = new Date(startDay);
        current.setDate(startDay.getDate() + i);
        const dStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const mmdd = dStr.substring(5);
        days.push({
            day: current.getDate(),
            month: current.getMonth(),
            year: current.getFullYear(),
            isCurrentMonth: current.getMonth() === month,
            dateStr: dStr,
            holiday: LUNAR_HOLIDAYS[dStr] || FIXED_HOLIDAYS[mmdd] || null
        });
    }
    return days;
};

export const DatePicker: React.FC<DatePickerProps> = ({ isOpen, onClose, selectedDate, onSelect }) => {
    const parseSafeDate = (dateStr: string) => {
        try {
            const parts = dateStr.split('-');
            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return isNaN(d.getTime()) ? new Date() : d;
        } catch (e) {
            return new Date();
        }
    };

    // ⚠️ 所有 Hooks 必须在 early return 之前调用
    const [viewDate, setViewDate] = useState(() => parseSafeDate(selectedDate));
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0); // 拖动偏移量（像素）
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (isOpen) {
            setViewDate(parseSafeDate(selectedDate));
            setDragOffset(0);
            setIsAnimating(false);
        }
    }, [isOpen, selectedDate]);

    // Early return 必须在所有 Hooks 之后
    if (!isOpen) return null;

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // 获取容器宽度
    const getContainerWidth = () => containerRef.current?.offsetWidth || 350;

    // 当前月、上个月、下个月
    const prevMonth = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month + 1, 1);

    const currentMonthDays = generateCalendarForMonth(year, month, selectedDate);
    const prevMonthDays = generateCalendarForMonth(prevMonth.getFullYear(), prevMonth.getMonth(), selectedDate);
    const nextMonthDays = generateCalendarForMonth(nextMonth.getFullYear(), nextMonth.getMonth(), selectedDate);

    // 触摸开始
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isAnimating) return;
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
        setIsDragging(true);
    };

    // 触摸移动 - 跟随手指
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || touchStartX === null || touchStartY === null || isAnimating) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - touchStartX;
        const diffY = currentY - touchStartY;

        // 判断是水平滑动还是垂直滑动
        if (Math.abs(diffX) > Math.abs(diffY)) {
            e.preventDefault(); // 阻止垂直滚动
            setDragOffset(diffX);
        }
    };

    // 触摸结束 - 判断是否切换月份
    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const containerWidth = getContainerWidth();
        const threshold = containerWidth * 0.2; // 滑动超过 20% 就切换

        if (dragOffset < -threshold) {
            // 左滑 -> 下个月
            animateToMonth(1);
        } else if (dragOffset > threshold) {
            // 右滑 -> 上个月
            animateToMonth(-1);
        } else {
            // 回弹到原位
            animateToMonth(0);
        }

        setTouchStartX(null);
        setTouchStartY(null);
    };

    // 动画切换月份
    const animateToMonth = (direction: number) => {
        setIsAnimating(true);
        const containerWidth = getContainerWidth();

        if (direction === 0) {
            // 回弹到原位
            setDragOffset(0);
            setTimeout(() => setIsAnimating(false), 300);
        } else {
            // 滑动到目标位置
            setDragOffset(direction > 0 ? -containerWidth : containerWidth);

            setTimeout(() => {
                // 动画完成后更新月份
                setViewDate(new Date(year, month + direction, 1));
                setDragOffset(0);
                setIsAnimating(false);
            }, 300);
        }
    };

    // 按钮点击切换月份
    const handleMonthChange = (offset: number) => {
        if (isAnimating) return;
        animateToMonth(offset);
    };

    // 渲染月份网格
    const renderMonthGrid = (days: Array<any>, monthDate: Date) => {
        const m = monthDate.getMonth();
        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    minWidth: '100%',
                    flexShrink: 0,
                }}
            >
                {days.map((d, i) => {
                    const isSelected = d.dateStr === selectedDate;
                    const isToday = d.dateStr === todayStr;
                    return (
                        <div
                            key={i}
                            onClick={() => { onSelect(d.dateStr); onClose(); }}
                            style={{
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '2px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? '#2563eb' : (isToday ? '#eff6ff' : 'transparent'),
                                color: isSelected ? '#ffffff' : (d.isCurrentMonth ? '#374151' : '#d1d5db'),
                                fontWeight: (isSelected || isToday) ? 'bold' : 'normal',
                                position: 'relative'
                            }}
                        >
                            <span style={{ fontSize: '14px' }}>{d.day}</span>
                            {d.holiday && (
                                <span style={{
                                    fontSize: '8px',
                                    position: 'absolute',
                                    bottom: '4px',
                                    color: isSelected ? '#bfdbfe' : '#ef4444',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {d.holiday}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // 计算滑动容器的 transform
    const getSliderTransform = () => {
        const containerWidth = getContainerWidth();
        // 初始位置在中间（显示当前月）
        const baseOffset = -containerWidth;
        const totalOffset = baseOffset + dragOffset;
        return `translateX(${totalOffset}px)`;
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                backgroundColor: 'rgba(0,0,0,0.6)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '450px',
                    margin: '0 auto',
                    backgroundColor: '#ffffff',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    paddingBottom: 'env(safe-area-inset-bottom, 20px)',
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 顶部控制 */}
                <div style={{ padding: '20px 24px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => handleMonthChange(-1)}
                        style={{
                            padding: '10px',
                            color: '#6b7280',
                            borderRadius: '12px',
                            backgroundColor: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#111827',
                        transition: 'opacity 0.2s',
                        opacity: isDragging ? 0.5 : 1
                    }}>
                        {year}年 {month + 1}月
                    </div>
                    <button
                        onClick={() => handleMonthChange(1)}
                        style={{
                            padding: '10px',
                            color: '#6b7280',
                            borderRadius: '12px',
                            backgroundColor: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Icons.ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* 星期表头 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 16px' }}>
                    {['日', '一', '二', '三', '四', '五', '六'].map(w => (
                        <div key={w} style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', padding: '10px 0', fontWeight: '600' }}>{w}</div>
                    ))}
                </div>

                {/* 日历滑动容器 */}
                <div
                    ref={containerRef}
                    style={{
                        overflow: 'hidden',
                        padding: '0 16px 16px',
                        touchAction: 'pan-y'
                    }}
                    onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e); }}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div
                        style={{
                            display: 'flex',
                            transform: getSliderTransform(),
                            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            willChange: 'transform'
                        }}
                    >
                        {/* 上个月 */}
                        {renderMonthGrid(prevMonthDays, prevMonth)}
                        {/* 当前月 */}
                        {renderMonthGrid(currentMonthDays, viewDate)}
                        {/* 下个月 */}
                        {renderMonthGrid(nextMonthDays, nextMonth)}
                    </div>
                </div>

                {/* 底部按钮 */}
                <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => { onSelect(todayStr); onClose(); }}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 'bold', fontSize: '14px' }}
                    >
                        今天
                    </button>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};
