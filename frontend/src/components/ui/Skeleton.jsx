import React from 'react';

// Generic glowing pulse skeleton bone
export const SkeletonBone = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-brand-800 rounded-xl ${className}`} />
  );
};

// 1. Dashboard skeleton loading state
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBone className="h-8 w-64" />
          <SkeletonBone className="h-4 w-96" />
        </div>
        <SkeletonBone className="h-14 w-40" />
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 min-h-[140px] flex flex-col justify-between">
            <SkeletonBone className="h-3 w-24" />
            <SkeletonBone className="h-10 w-16 mt-2" />
            <SkeletonBone className="h-3 w-32 mt-2" />
          </div>
        ))}
      </div>

      {/* Main double column graphs & widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card min-h-[300px] flex flex-col justify-between">
          <div className="space-y-2">
            <SkeletonBone className="h-4 w-36" />
            <SkeletonBone className="h-3 w-48" />
          </div>
          <SkeletonBone className="h-48 w-full mt-6" />
        </div>
        <div className="glass-card min-h-[300px] flex flex-col justify-between">
          <div className="space-y-2 pb-4 border-b border-slate-200/50 dark:border-brand-800/40">
            <SkeletonBone className="h-4 w-32" />
            <SkeletonBone className="h-3 w-20" />
          </div>
          <div className="flex-1 space-y-3 py-6">
            <SkeletonBone className="h-8 w-[80%] rounded-bl-none" />
            <SkeletonBone className="h-8 w-[60%] rounded-bl-none" />
            <SkeletonBone className="h-8 w-[75%] ml-auto bg-blue-500/10 rounded-br-none" />
          </div>
          <SkeletonBone className="h-10 w-full mt-4" />
        </div>
      </div>
    </div>
  );
};

// 2. Tasks Backlog skeleton loader
export const TasksSkeleton = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="space-y-2">
        <SkeletonBone className="h-8 w-48" />
        <SkeletonBone className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-5 space-y-4">
            <SkeletonBone className="h-12 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <SkeletonBone className="h-10 w-full" />
              <SkeletonBone className="h-10 w-full" />
            </div>
          </div>
          
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <SkeletonBone className="h-5 w-5 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <SkeletonBone className="h-4 w-[60%]" />
                    <SkeletonBone className="h-3 w-[30%]" />
                  </div>
                </div>
                <SkeletonBone className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[220px]">
            <SkeletonBone className="h-6 w-24 mb-4" />
            <SkeletonBone className="h-12 w-32 mb-4" />
            <SkeletonBone className="h-10 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Weekly Planner skeleton loader
export const PlannerSkeleton = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBone className="h-8 w-40" />
          <SkeletonBone className="h-4 w-72" />
        </div>
        <SkeletonBone className="h-10 w-36" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-card p-5 space-y-3">
            <SkeletonBone className="h-4 w-24" />
            <SkeletonBone className="h-20 w-full" />
          </div>
          <div className="glass-card p-5 space-y-3">
            <SkeletonBone className="h-4 w-28" />
            <SkeletonBone className="h-10 w-full" />
            <SkeletonBone className="h-10 w-full" />
          </div>
        </div>

        <div className="lg:col-span-3 glass-card p-6 space-y-6">
          <SkeletonBone className="h-5 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-200/50 dark:border-brand-800/40 min-h-[220px] flex flex-col justify-between">
                <div className="space-y-3">
                  <SkeletonBone className="h-4 w-20" />
                  <SkeletonBone className="h-3 w-full" />
                  <SkeletonBone className="h-3 w-[70%]" />
                </div>
                <SkeletonBone className="h-8 w-full mt-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Heatmap Tracker skeleton loader
export const TrackerSkeleton = () => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="space-y-2">
        <SkeletonBone className="h-8 w-56" />
        <SkeletonBone className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-5 min-h-[90px]">
            <SkeletonBone className="h-3 w-20" />
            <SkeletonBone className="h-8 w-16 mt-2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 space-y-6">
          <SkeletonBone className="h-5 w-36" />
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {Array.from({ length: 30 }).map((_, i) => (
              <SkeletonBone key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
        <div className="glass-card p-5 space-y-4">
          <SkeletonBone className="h-4 w-28" />
          <SkeletonBone className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonBone;
