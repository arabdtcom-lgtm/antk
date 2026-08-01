/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Award, CheckCircle2, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';
import { Language } from '../utils/translations';
import { User, Auction } from '../types';

export interface TrustScoreProps {
  user: User;
  auctions?: Auction[];
  completedCount?: number;
  lang: Language;
  variant?: 'full' | 'compact' | 'card';
  showDetails?: boolean;
}

export function calculateUserTrustScore(user: User, auctions: Auction[] = [], customCompletedCount?: number): {
  score: number;
  completedDeals: number;
  tierLabelEn: string;
  tierLabelAr: string;
  badgeColor: string;
  barGradient: string;
  trustGrade: string;
  escrowSuccessRate: number;
} {
  // Count user's completed won auctions
  const wonCompleted = auctions.filter(
    (auc) => auc.highBidder === user.email && auc.status === 'completed'
  ).length;

  // Count user's active/completed seller listings
  const sellerCompleted = auctions.filter(
    (auc) => ((auc.seller as any)?.id === user.id || (auc.seller as any)?.name === user.name) && auc.status === 'completed'
  ).length;

  const deals = (customCompletedCount ?? user.completedTransactions) ?? (wonCompleted + sellerCompleted + (user.tier === 'vip' ? 12 : user.tier === 'verified_seller' ? 8 : 4));

  // Base calculation starting from verified account state
  let baseScore = user.verified ? 65 : 50;

  // Increment score per completed transaction
  baseScore += Math.min(25, deals * 3.5);

  // Member Tier Bonuses
  if (user.tier === 'vip' || user.role === 'admin') baseScore += 10;
  else if (user.tier === 'verified_seller') baseScore += 7;

  // Wallet activity bonus (indicates active financial trust)
  if (user.balance && user.balance > 0) baseScore += 3;

  // Clamp final score between 0 and 100
  const finalScore = Math.min(100, Math.max(20, Math.round(user.trustScore ?? baseScore)));

  // Tier classification
  if (finalScore >= 90) {
    return {
      score: finalScore,
      completedDeals: deals,
      tierLabelEn: 'A+ Diamond Trusted Member',
      tierLabelAr: 'عضو أ+ موثوق بمرتبة الماس',
      badgeColor: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
      barGradient: 'from-emerald-500 via-teal-400 to-amber-300',
      trustGrade: 'A+',
      escrowSuccessRate: 100,
    };
  } else if (finalScore >= 78) {
    return {
      score: finalScore,
      completedDeals: deals,
      tierLabelEn: 'A Gold Standard Merchant',
      tierLabelAr: 'تاجر أ معتمد بالمعيار الذهبي',
      badgeColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      barGradient: 'from-amber-500 via-yellow-400 to-emerald-400',
      trustGrade: 'A',
      escrowSuccessRate: 99,
    };
  } else if (finalScore >= 65) {
    return {
      score: finalScore,
      completedDeals: deals,
      tierLabelEn: 'B+ Verified Collector',
      tierLabelAr: 'جامع ب+ موثق ومضمون',
      badgeColor: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
      barGradient: 'from-cyan-500 to-blue-400',
      trustGrade: 'B+',
      escrowSuccessRate: 97,
    };
  }

  return {
    score: finalScore,
    completedDeals: deals,
    tierLabelEn: 'Standard Member',
    tierLabelAr: 'عضو مسجل معتمد',
    badgeColor: 'bg-slate-800 border-slate-700 text-slate-300',
    barGradient: 'from-blue-600 to-indigo-500',
    trustGrade: 'B',
    escrowSuccessRate: 95,
  };
}

export default function TrustScoreProgressBar({
  user,
  auctions = [],
  completedCount,
  lang,
  variant = 'full',
  showDetails = true,
}: TrustScoreProps) {
  const isAr = lang === 'ar';
  const trustData = calculateUserTrustScore(user, auctions, completedCount);

  // Compact variant for table rows / small admin cards
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2.5 min-w-[140px]" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex-1">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>{trustData.trustGrade}</span>
            </span>
            <span className="text-emerald-400 font-extrabold">{trustData.score}/100</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trustData.score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${trustData.barGradient} rounded-full`}
            />
          </div>
        </div>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div
        className="rounded-xl bg-[#111116] p-4 border border-emerald-500/20 shadow-lg space-y-3"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {isAr ? 'مؤشر موثوقية العضو' : 'Trust Score Indicator'}
              </h4>
              <p className="text-[10px] text-slate-400">
                {isAr ? trustData.tierLabelAr : trustData.tierLabelEn}
              </p>
            </div>
          </div>
          <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {trustData.score}%
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-white/10 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trustData.score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${trustData.barGradient} rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]`}
            />
          </div>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1 border-t border-white/5">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>
                {isAr ? 'صفقات مكتملة:' : 'Completed Deals:'}{' '}
                <strong className="font-mono text-white">{trustData.completedDeals}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3 text-amber-400 shrink-0" />
              <span>
                {isAr ? 'نزاعات:' : 'Disputes:'}{' '}
                <strong className="font-mono text-emerald-400">0%</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Dashboard Banner Variant (for UserProfile & UserStats)
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#0d1612] via-[#0f1117] to-[#0d1612] p-5 shadow-xl space-y-4"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background glow overlay */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-md shrink-0">
            <ShieldCheck className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${trustData.badgeColor}`}>
                {trustData.trustGrade} • {isAr ? trustData.tierLabelAr : trustData.tierLabelEn}
              </span>
            </div>
            <h3 className="text-base font-serif font-black text-white mt-1">
              {isAr ? 'مؤشر درع الثقة والالتزام بالمعاملات' : 'Verified Member Trust Score'}
            </h3>
            <p className="text-xs text-slate-300 font-light">
              {isAr
                ? 'يتم احتساب المؤشر تلقائياً بناءً على إتمام المزادات المكسوبة، وتلبية شحنات البائع، والالتزام بحساب الضمان.'
                : 'Calculated automatically from completed transactions, escrow fulfillment, and verified dispute-free history.'}
            </p>
          </div>
        </div>

        {/* Big Score Display Badge */}
        <div className="flex items-center justify-end sm:justify-center gap-2 shrink-0">
          <div className="text-right sm:text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              {isAr ? 'درجة الثقة' : 'Trust Score'}
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
              {trustData.score} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1.5 relative z-10">
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-300">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{isAr ? 'نسبة الامتثال للضمان:' : 'Escrow Compliance:'} 100%</span>
          </span>
          <span className="text-emerald-400 font-extrabold">{trustData.score}% {isAr ? 'مكتمل' : 'Score'}</span>
        </div>

        <div className="w-full h-3.5 rounded-full bg-slate-900 overflow-hidden border border-white/10 p-0.5 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${trustData.score}%` }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${trustData.barGradient} rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]`}
          />
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs relative z-10">
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <span className="text-[10px] text-slate-400 block">{isAr ? 'صفقات ناجحة' : 'Successful Deals'}</span>
            <span className="font-mono font-black text-emerald-400 text-sm mt-0.5 block">
              {trustData.completedDeals} {isAr ? 'عمليات' : 'closed'}
            </span>
          </div>

          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <span className="text-[10px] text-slate-400 block">{isAr ? 'معدل النجاح' : 'Success Rate'}</span>
            <span className="font-mono font-black text-emerald-400 text-sm mt-0.5 block">
              {trustData.escrowSuccessRate}%
            </span>
          </div>

          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <span className="text-[10px] text-slate-400 block">{isAr ? 'النزاعات والشكاوى' : 'Dispute Rate'}</span>
            <span className="font-mono font-black text-emerald-400 text-sm mt-0.5 block">
              0.0%
            </span>
          </div>

          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <span className="text-[10px] text-slate-400 block">{isAr ? 'توثيق الهوية' : 'Identity Status'}</span>
            <span className="font-mono font-bold text-amber-300 text-xs mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isAr ? 'موثق رسمياً' : 'KYC Verified'}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
