import React, { useState, useRef, useCallback, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only start pull-to-refresh if we're at the top of the container
    if (container.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);

    // Apply resistance to the pull
    const resistance = 0.5;
    const adjustedDistance = distance * resistance;

    setPullDistance(Math.min(adjustedDistance, threshold * 1.5));

    // Prevent default scrolling when pulling down
    if (distance > 0) {
      e.preventDefault();
    }
  }, [isPulling, startY, threshold, disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, onRefresh, disabled, isRefreshing]);

  const getRefreshIndicatorStyle = () => {
    const progress = Math.min(pullDistance / threshold, 1);
    const opacity = Math.min(progress, 1);
    const scale = Math.min(0.5 + (progress * 0.5), 1);
    const rotation = progress * 180;

    return {
      opacity,
      transform: `scale(${scale}) rotate(${rotation}deg)`,
      transition: isPulling ? 'none' : 'all 0.3s ease-out',
    };
  };

  const getContainerStyle = () => {
    return {
      transform: `translateY(${pullDistance}px)`,
      transition: isPulling ? 'none' : 'transform 0.3s ease-out',
    };
  };

  const pullIndicatorStyle = {
    height: `${Math.max(pullDistance, 0)}px`,
    background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent)',
  };

  return (
    <div className="relative overflow-hidden">
      {/* Pull-to-refresh indicator */}
      {/* eslint-disable-next-line react/forbid-dom-props */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 bg-gradient-to-b from-blue-500/10 to-transparent"
        style={pullIndicatorStyle}
      >
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <div
          className="flex flex-col items-center text-blue-600 dark:text-blue-400"
          style={getRefreshIndicatorStyle()}
        >
          <RefreshCw
            className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span className="text-xs mt-1 font-medium">
            {(() => {
              if (isRefreshing) return 'Refreshing...';
              if (pullDistance >= threshold) return 'Release to refresh';
              return 'Pull to refresh';
            })()}
          </span>
        </div>
      </div>

      {/* Content container */}
      {/* eslint-disable-next-line react/forbid-dom-props */}
      <div
        ref={containerRef}
        className="h-full overflow-auto"
        style={getContainerStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
