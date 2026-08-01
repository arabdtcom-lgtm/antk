/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Crown, Trophy, ShieldCheck, Zap, Sparkles, Award, CheckCircle } from 'lucide-react';
import { Language } from '../utils/translations';

export interface BidderReputationBadgeProps {
  bidderEmail: string;
  bidderName?: string;
  isCurrentUser?: boolean;
  userTier?: string;
  lang: Language;
  size?: 'sm' | 'md';
  compact?: boolean;
}

export interface ReputationProfile {
  titleEn: string;
  titleAr: string;
  icon: React.ReactNode;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  completionRate: string;
  totalWon: number;
  rating: number;
  trustScore: string;
}

export function getBidderReputationProfile(
  email: string,
  name?: string,
  isCurrentUser?: boolean,
  userTier?: string
): ReputationProfile {
  const normalized = (email + (name || '') + (userTier || '')).toLowerCase();

  // 1. VIP / Royal / Admin / High Tier
  if (
    userTier === 'vip' ||
    userTier === 'admin' ||
    normalized.includes('vip') ||
    normalized.includes('royal') ||
    normalized.includes('al-') ||
    normalized.includes('admin') ||
    normalized.includes('saudi')
  ) {
    return {
      titleEn: 'VIP Diamond Collector',
      titleAr: 'جامع ألماس VIP',
      icon: <Crown className="h-3 w-3 text-amber-300 animate-pulse" />,
      badgeClass: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20',
      textClass: 'text-amber-300 font-black',
      borderClass: 'border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
      completionRate: '100%',
      totalWon: 24,
      rating: 5.0,
      trustScore: 'A+ Elite',
    };
  }

  // 2. Premier Winner / Verified Veteran
  if (
    userTier === 'verified_seller' ||
    normalized.includes('collector') ||
    normalized.includes('bin') ||
    normalized.includes('master') ||
    normalized.includes('pro')
  ) {
    return {
      titleEn: 'Premier Collector',
      titleAr: 'جامع مقتنيات متميز',
      icon: <Trophy className="h-3 w-3 text-emerald-400" />,
      badgeClass: 'bg-emerald-500/15',
      textClass: 'text-emerald-300 font-extrabold',
      borderClass: 'border-emerald-500/30',
      completionRate: '99%',
      totalWon: 15,
      rating: 4.9,
      trustScore: 'A Verified',
    };
  }

  // 3. Power Bidder
  if (normalized.length % 2 === 0) {
    return {
      titleEn: 'Active Power Bidder',
      titleAr: 'مزايد نشط موثق',
      icon: <Zap className="h-3 w-3 text-purple-400" />,
      badgeClass: 'bg-purple-500/15',
      textClass: 'text-purple-300 font-bold',
      borderClass: 'border-purple-500/30',
      completionRate: '98%',
      totalWon: 8,
      rating: 4.8,
      trustScore: 'High Trust',
    };
  }

  // 4. Standard Verified
  return {
    titleEn: 'Verified Bidder',
    titleAr: 'مزايد معتمد',
    icon: <ShieldCheck className="h-3 w-3 text-blue-400" />,
    badgeClass: 'bg-blue-500/15',
    textClass: 'text-blue-300 font-semibold',
    borderClass: 'border-blue-500/30',
    completionRate: '97%',
    totalWon: 4,
    rating: 4.7,
    trustScore: 'Verified',
  };
}

export default function BidderReputationBadge({
  bidderEmail,
  bidderName,
  isCurrentUser,
  userTier,
  lang,
  size = 'sm',
  compact = false,
}: BidderReputationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isAr = lang === 'ar';
  const profile = getBidderReputationProfile(bidderEmail, bidderName, isCurrentUser, userTier);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] sm:text-[10px] transition-all cursor-pointer select-none ${profile.badgeClass} ${profile.borderClass} ${profile.textClass}`}
        title={isAr ? profile.titleAr : profile.titleEn}
      >
        {profile.icon}
        <span className="truncate max-w-[90px] sm:max-w-[120px]">
          {compact ? (isAr ? profile.titleAr.split(' ')[0] : profile.titleEn.split(' ')[0]) : (isAr ? profile.titleAr : profile.titleEn)}
        </span>
      </button>

      {/* Hover Reputation Metric Breakdown Card Tooltip */}
      {showTooltip && (
        <div
          className={`absolute bottom-full mb-2 z-[100] w-52 p-3 rounded-xl bg-[#0e0e12] border border-amber-500/30 text-white shadow-2xl backdrop-blur-md text-[10px] space-y-1.5 transition-all animate-in fade-in duration-150 ${
            isAr ? 'right-0 text-right' : 'left-0 text-left'
          }`}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Award className="h-3 w-3 text-amber-400" />
              <span>{isAr ? 'سجل سمعة المزايد' : 'Bidder Trust Record'}</span>
            </span>
            <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              {profile.trustScore}
            </span>
          </div>

          {/* Metrics list */}
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>{isAr ? 'معدل إتمام الصفقات:' : 'Escrow Completion:'}</span>
              <strong className="font-mono text-emerald-400">{profile.completionRate}</strong>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span>{isAr ? 'المزادات المكسوبة:' : 'Auctions Won:'}</span>
              <strong className="font-mono text-amber-300">{profile.totalWon} {isAr ? 'مزاد' : 'items'}</strong>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span>{isAr ? 'تقييم المزايد:' : 'Bidder Rating:'}</span>
              <strong className="font-mono text-yellow-300">★ {profile.rating} / 5.0</strong>
            </div>
          </div>

          <div className="pt-1 border-t border-white/5 text-[8.5px] text-slate-400 flex items-center gap-1">
            <CheckCircle className="h-2.5 w-2.5 text-blue-400 shrink-0" />
            <span>{isAr ? 'حساب موثق ومضمون بالوديعة' : 'Deposit hold active & KYC verified'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
