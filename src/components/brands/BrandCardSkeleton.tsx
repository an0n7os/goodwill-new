import React from "react";

export default function BrandCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between animate-pulse">
      <div>
        {/* Top Status Row Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
        </div>

        {/* Logo Area Skeleton */}
        <div className="h-14 flex items-center justify-start my-2">
          <div className="h-8 w-28 bg-slate-200 rounded" />
        </div>

        {/* Tagline Skeleton */}
        <div className="h-4 w-3/4 bg-slate-200 rounded mb-4 mt-2" />
      </div>

      {/* Divider & Footer Link Skeleton */}
      <div>
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-4 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function BrandShowcaseSkeleton() {
  return (
    <section className="bg-slate-50 py-16 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-12">
          <div className="h-6 w-36 bg-slate-200 rounded-full mb-3 animate-pulse" />
          <div className="h-8 w-64 bg-slate-200 rounded mb-2 animate-pulse" />
          <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <BrandCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
