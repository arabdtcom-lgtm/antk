/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AuctionSkeletonCardProps {
  count?: number;
  className?: string;
}

export default function AuctionSkeletonCard({ count = 1, className = '' }: AuctionSkeletonCardProps) {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={`auction-skeleton-${idx}`}
          className={`group rounded-2xl border border-white/10 bg-[#0d0d0f] overflow-hidden shadow-xl animate-pulse space-y-0 ${className}`}
        >
          {/* Image Skeleton Box */}
          <div className="relative h-52 w-full bg-slate-800/60 flex flex-col justify-between p-3">
            <div className="flex items-center justify-between w-full">
              <div className="h-6 w-24 bg-slate-700/60 rounded-full border border-white/5" />
              <div className="flex items-center gap-1.5">
                <div className="h-8 w-8 rounded-full bg-slate-700/60 border border-white/5" />
                <div className="h-8 w-8 rounded-full bg-slate-700/60 border border-white/5" />
              </div>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="h-5 w-20 bg-amber-500/20 rounded-md border border-amber-500/10" />
              <div className="h-5 w-16 bg-slate-700/60 rounded-full" />
            </div>
          </div>

          {/* Body Content Skeleton */}
          <div className="p-4 space-y-4">
            {/* Title & Category lines */}
            <div className="space-y-2">
              <div className="h-5 w-4/5 bg-slate-700/70 rounded-md" />
              <div className="h-3.5 w-1/2 bg-slate-800/60 rounded-md" />
            </div>

            {/* Price & Timer Grid Box */}
            <div className="grid grid-cols-2 gap-2 bg-[#131316] p-3 rounded-xl border border-white/5">
              <div className="space-y-1.5">
                <div className="h-3 w-16 bg-slate-800/60 rounded" />
                <div className="h-6 w-28 bg-amber-500/20 rounded-md" />
              </div>
              <div className="space-y-1.5 flex flex-col items-end justify-center">
                <div className="h-3 w-14 bg-slate-800/60 rounded" />
                <div className="h-5 w-20 bg-slate-700/70 rounded-md" />
              </div>
            </div>

            {/* Action Button Skeleton */}
            <div className="h-11 w-full bg-slate-800/80 rounded-xl border border-white/5" />
          </div>
        </div>
      ))}
    </>
  );
}
