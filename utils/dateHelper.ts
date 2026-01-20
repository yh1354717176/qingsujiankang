/**
 * @description 日期工具函数
 */

/**
 * 获取北京时间 (Asia/Shanghai) 的当前日期字符串 (YYYY-MM-DD)
 * @returns {string} 格式为 YYYY-MM-DD 的日期字符串
 */
export const getBeijingDate = (): string => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
};

/**
 * 将 Date 对象格式化为 YYYY-MM-DD
 * @param {Date} date - 要格式化的日期对象
 * @returns {string} 格式为 YYYY-MM-DD 的日期字符串
 */
export const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * 安全解析日期字符串
 * @param {string} dateStr - YYYY-MM-DD 格式的字符串
 * @returns {Date} 解析后的 Date 对象
 */
export const parseSafeDate = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date();
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return isNaN(d.getTime()) ? new Date() : d;
};
