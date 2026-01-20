import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Icons } from './Icons';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
    isPullable?: boolean;
    pullingContent?: React.ReactNode;
    refreshingContent?: React.ReactNode;
}

/**
 * @description 自定义下拉刷新组件，解决 react-simple-pull-to-refresh 第一次滑动无效的问题
 * @param {PullToRefreshProps} props - 组件属性
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    className = '',
    isPullable = true,
    pullingContent,
    refreshingContent,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showIndicator, setShowIndicator] = useState(false);

    const startYRef = useRef(0);
    const isDraggingRef = useRef(false);
    const canPullRef = useRef(false);

    const THRESHOLD = 60; // 触发刷新的阈值
    const MAX_DISTANCE = 100; // 最大下拉距离

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!isPullable || isRefreshing) return;

        const container = containerRef.current;
        if (!container) return;

        // 只有在滚动到顶部时才允许下拉刷新
        if (container.scrollTop <= 0) {
            canPullRef.current = true;
            startYRef.current = e.touches[0].pageY;
            isDraggingRef.current = false;
        } else {
            canPullRef.current = false;
        }
    }, [isPullable, isRefreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPullable || isRefreshing || !canPullRef.current) return;

        const container = containerRef.current;
        if (!container) return;

        const currentY = e.touches[0].pageY;
        const deltaY = currentY - startYRef.current;

        // 只有向下拉才处理
        if (deltaY > 0 && container.scrollTop <= 0) {
            isDraggingRef.current = true;

            // 使用阻尼效果
            const distance = Math.min(deltaY * 0.5, MAX_DISTANCE);
            setPullDistance(distance);
            setShowIndicator(true);

            // 阻止默认滚动行为
            if (e.cancelable) {
                e.preventDefault();
            }
        } else if (deltaY < 0 && isDraggingRef.current) {
            // 向上滑动时重置
            setPullDistance(0);
            isDraggingRef.current = false;
        }
    }, [isPullable, isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!isDraggingRef.current) return;

        isDraggingRef.current = false;
        canPullRef.current = false;

        if (pullDistance >= THRESHOLD) {
            // 触发刷新
            setIsRefreshing(true);
            setPullDistance(THRESHOLD);

            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
                setShowIndicator(false);
            }
        } else {
            // 没有达到阈值，恢复
            setPullDistance(0);
            setShowIndicator(false);
        }
    }, [pullDistance, onRefresh]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 使用 passive: false 以便可以 preventDefault
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    const defaultPullingContent = (
        <div className="text-gray-400 text-sm py-3 text-center w-full flex items-center justify-center gap-2">
            <Icons.ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${pullDistance >= THRESHOLD ? 'rotate-180' : ''}`}
            />
            <span>{pullDistance >= THRESHOLD ? '松开刷新' : '下拉刷新'}</span>
        </div>
    );

    const defaultRefreshingContent = (
        <div className="text-blue-500 text-sm py-3 flex items-center justify-center gap-2 w-full">
            <Icons.Loader className="w-4 h-4 animate-spin" />
            <span>刷新中...</span>
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={`overflow-y-auto overflow-x-hidden ${className}`}
            style={{
                position: 'relative',
                WebkitOverflowScrolling: 'touch',
            }}
        >
            {/* 下拉指示器 */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${pullDistance - 50}px)`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease-out',
                    zIndex: 10,
                    pointerEvents: 'none',
                    opacity: showIndicator ? 1 : 0,
                }}
            >
                {isRefreshing
                    ? (refreshingContent || defaultRefreshingContent)
                    : (pullingContent || defaultPullingContent)
                }
            </div>

            {/* 内容区域 */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease-out',
                    minHeight: '100%',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
