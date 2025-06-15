import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Stats cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

// Post list skeleton
export const PostListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="flex space-x-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Message list skeleton
export const MessageListSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-start space-x-3 p-4 border rounded-lg">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    ))}
  </div>
);

// Analytics skeleton
export const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Date range picker */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Main chart */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>

    {/* Secondary charts */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Team activity skeleton
export const TeamActivitySkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-start space-x-3 p-4 border-l-4 border-gray-200 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    ))}
  </div>
);

// Task board skeleton
export const TaskBoardSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, columnIndex) => (
      <Card key={columnIndex}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-6" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, taskIndex) => (
            <div key={taskIndex} className="p-3 border rounded-lg">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    ))}
  </div>
);

// Content library skeleton
export const ContentLibrarySkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>

    <div className="flex gap-4">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-48" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex justify-between text-xs">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-8" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex space-x-1">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-6" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Chat skeleton
export const ChatSkeleton: React.FC = () => (
  <div className="h-[calc(100vh-200px)] flex bg-white dark:bg-gray-900 rounded-lg border">
    {/* Sidebar skeleton */}
    <div className="w-80 border-r bg-gray-50 dark:bg-gray-800 flex flex-col">
      <div className="p-4 border-b">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-5" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2 p-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-20" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2 p-1">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-2 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Chat area skeleton */}
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex space-x-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  </div>
);

// Generic card skeleton
export const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </CardContent>
  </Card>
);

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => {
  const gridCols = `grid-cols-${Math.min(columns, 12)}`; // Tailwind supports up to grid-cols-12

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={`grid gap-4 ${gridCols}`}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={`grid gap-4 ${gridCols}`}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
};
