import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { getBeijingDate, parseSafeDate as parseDate } from '../utils/dateHelper';

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
const generateCalendarForMonth = (year: number, month: number) => {
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
    const parseSafeDate = (dateStr: string) => parseDate(dateStr);

    // ⚠️ 所有 Hooks 必须在 early return 之前调用
    const [viewDate, setViewDate] = useState(() => parseSafeDate(selectedDate));
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const slideContainerRef = useRef<HTMLDivElement>(null);

    const todayStr = getBeijingDate();

    useEffect(() => {
        if (isOpen) {
            setViewDate(parseSafeDate(selectedDate));
            setSlideDirection(null);
            setIsAnimating(false);
        }
    }, [isOpen, selectedDate]);

    // 动画完成后重置
    useEffect(() => {
        if (slideDirection) {
            const timer = setTimeout(() => {
                setSlideDirection(null);
                setIsAnimating(false);
            }, 280);
            return () => clearTimeout(timer);
        }
    }, [slideDirection]);

    // Early return 必须在所有 Hooks 之后
    if (!isOpen) return null;

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const currentMonthDays = generateCalendarForMonth(year, month);

    // 触摸开始
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isAnimating) return;
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
    };

    // 触摸结束 - 判断滑动方向
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null || touchStartY === null || isAnimating) return;

        const diffX = touchStartX - e.changedTouches[0].clientX;
        const diffY = touchStartY - e.changedTouches[0].clientY;

        // 只有水平滑动距离大于阈值且大于垂直滑动时才触发
        if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
            if (diffX > 0) {
                // 左滑 -> 下个月
                handleMonthChange(1);
            } else {
                // 右滑 -> 上个月
                handleMonthChange(-1);
            }
        }

        setTouchStartX(null);
        setTouchStartY(null);
    };

    // 切换月份（带动画）
    const handleMonthChange = (offset: number) => {
        if (isAnimating) return;

        setIsAnimating(true);
        setSlideDirection(offset > 0 ? 'left' : 'right');

        // 延迟更新日期，让动画先播放
        setTimeout(() => {
            setViewDate(new Date(year, month + offset, 1));
        }, 140);
    };

    // 渲染日期单元格
    const renderDayCell = (d: any, i: number) => {
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
                    borderRadius: '50%',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#2563eb' : (isToday ? '#eff6ff' : 'transparent'),
                    color: isSelected ? '#ffffff' : (d.isCurrentMonth ? '#374151' : '#d1d5db'),
                    fontWeight: (isSelected || isToday) ? 'bold' : 'normal',
                    position: 'relative',
                    transition: 'background-color 0.15s, transform 0.15s',
                }}
            >
                <span style={{ fontSize: '15px' }}>{d.day}</span>
                {d.holiday && (
                    <span style={{
                        fontSize: '9px',
                        position: 'absolute',
                        bottom: '2px',
                        color: isSelected ? '#bfdbfe' : '#ef4444',
                        whiteSpace: 'nowrap'
                    }}>
                        {d.holiday}
                    </span>
                )}
            </div>
        );
    };

    // 计算滑动动画样式
    const getSlideStyle = (): React.CSSProperties => {
        if (slideDirection === 'left') {
            return {
                animation: 'slideOutLeft 0.28s ease-out forwards',
            };
        } else if (slideDirection === 'right') {
            return {
                animation: 'slideOutRight 0.28s ease-out forwards',
            };
        }
        return {
            animation: 'slideIn 0.28s ease-out forwards',
        };
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
            {/* 内联动画样式 */}
            <style>{`
                @keyframes slideOutLeft {
                    0% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(-100%); opacity: 0; }
                }
                @keyframes slideOutRight {
                    0% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(100%); opacity: 0; }
                }
                @keyframes slideIn {
                    0% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>

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
                {/* 顶部控制栏 */}
                <div style={{
                    padding: '20px 20px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <button
                        onClick={() => handleMonthChange(-1)}
                        disabled={isAnimating}
                        style={{
                            width: '40px',
                            height: '40px',
                            color: '#6b7280',
                            borderRadius: '12px',
                            backgroundColor: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>

                    <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#111827'
                    }}>
                        {year}年 {month + 1}月
                    </div>

                    <button
                        onClick={() => handleMonthChange(1)}
                        disabled={isAnimating}
                        style={{
                            width: '40px',
                            height: '40px',
                            color: '#6b7280',
                            borderRadius: '12px',
                            backgroundColor: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <Icons.ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* 星期表头 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    padding: '0 20px',
                    gap: '4px'
                }}>
                    {['日', '一', '二', '三', '四', '五', '六'].map(w => (
                        <div key={w} style={{
                            textAlign: 'center',
                            fontSize: '13px',
                            color: '#9ca3af',
                            padding: '8px 0',
                            fontWeight: '600'
                        }}>
                            {w}
                        </div>
                    ))}
                </div>

                {/* 日历网格 */}
                <div
                    ref={slideContainerRef}
                    style={{
                        overflow: 'hidden',
                        padding: '4px 20px 16px',
                    }}
                    onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e); }}
                    onTouchEnd={handleTouchEnd}
                >
                    <div
                        key={`${year}-${month}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '4px',
                            ...getSlideStyle()
                        }}
                    >
                        {currentMonthDays.map((d, i) => renderDayCell(d, i))}
                    </div>
                </div>

                {/* 底部按钮 */}
                <div style={{ padding: '0 20px 24px', display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => { onSelect(todayStr); onClose(); }}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '12px',
                            backgroundColor: '#f3f4f6',
                            color: '#4b5563',
                            fontWeight: 'bold',
                            fontSize: '15px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        今天
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '12px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '15px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};
