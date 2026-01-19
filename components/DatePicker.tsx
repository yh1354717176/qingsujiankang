import React, { useState, useEffect } from 'react';
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

    const [viewDate, setViewDate] = useState(() => parseSafeDate(selectedDate));
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

    const handleMonthChange = (offset: number) => {
        setViewDate(new Date(year, month + offset, 1));
    };

    // 手势支持
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchYStart, setTouchYStart] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
        setTouchYStart(e.touches[0].clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null || touchYStart === null) return;
        const diffX = touchStart - e.changedTouches[0].clientX;
        const diffY = touchYStart - e.changedTouches[0].clientY;

        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
            handleMonthChange(diffX > 0 ? 1 : -1);
        }
        setTouchStart(null);
        setTouchYStart(null);
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
                onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e); }}
                onTouchEnd={handleTouchEnd}
            >
                {/* 顶部控制 */}
                <div style={{ padding: '20px 24px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleMonthChange(-1)} style={{ padding: '8px', color: '#9ca3af' }}>
                            <Icons.ChevronLeft className="w-6 h-6" />
                        </button>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                        {year}年 {month + 1}月
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleMonthChange(1)} style={{ padding: '8px', color: '#9ca3af' }}>
                            <Icons.ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* 星期表头 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 16px' }}>
                    {['日', '一', '二', '三', '四', '五', '六'].map(w => (
                        <div key={w} style={{ textAlign: 'center', fontSize: '12px', color: '#d1d5db', padding: '10px 0', fontWeight: 'bold' }}>{w}</div>
                    ))}
                </div>

                {/* 日历网格 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 16px 16px' }}>
                    {generateCalendar().map((d, i) => {
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
