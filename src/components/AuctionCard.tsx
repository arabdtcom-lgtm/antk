/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Auction } from '../types';
import { translations, Language, Currency, formatPrice } from '../utils/translations';
import { Calendar, Eye, Gavel, Sparkles, Flame, CheckCircle, Package, Share2, Check, Clock, Heart } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

interface AuctionCardProps {
  key?: any;
  auction: Auction;
  lang: Language;
  currency: Currency;
  currentUserEmail?: string;
  onSelect: (a: Auction) => void;
  onQuickCheckout?: (a: Auction) => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (auctionId: string) => void;
}

const AuctionCard = React.memo(function AuctionCard({
  auction,
  lang,
  currency,
  currentUserEmail,
  onSelect,
  onQuickCheckout,
  isWatchlisted = false,
  onToggleWatchlist
}: AuctionCardProps) {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/?auctionId=${auction.id}`;
    const title = lang === 'ar' ? auction.titleAr : auction.titleEn;
    const text = lang === 'ar' 
      ? `شاهد هذا المزاد الفاخر على منصة أنتيكاوي: ${auction.titleAr}`
      : `Check out this luxury auction on أنتيكاوي: ${auction.titleEn}`;

    if (typeof navigator !== 'undefined' && navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Fall back to copy link if Web Share API fails
        } else {
          return;
        }
      }
    }

    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy share link: ', err);
    });
  };

  const [timeLeft, setTimeLeft] = useState<{ totalSeconds: number; hours: number; minutes: number; seconds: number; isOver: boolean }>({
    totalSeconds: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  const [bidsInLastHour, setBidsInLastHour] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const fetchBids = async () => {
      try {
        const res = await fetch(`/api/auctions/${auction.id}/bids`);
        if (res.ok && active) {
          const data = await res.json();
          const bidsList = data.bids || [];
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const count = bidsList.filter((b: any) => new Date(b.timestamp) > oneHourAgo).length;
          setBidsInLastHour(count);
        }
      } catch (err) {
        console.warn('Bids query deferred:', err);
      }
    };
    fetchBids();
    return () => {
      active = false;
    };
  }, [auction.id, auction.bidsCount]);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const end = new Date(auction.endTime);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ totalSeconds: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ totalSeconds, hours, minutes, seconds, isOver: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  const isLessThan60Seconds = !timeLeft.isOver && timeLeft.totalSeconds <= 60 && timeLeft.totalSeconds > 0;
  const isEndingSoon = !timeLeft.isOver && !isLessThan60Seconds && timeLeft.hours === 0 && timeLeft.minutes < 60;
  const isUrgent = !timeLeft.isOver && !isLessThan60Seconds && timeLeft.hours === 0 && timeLeft.minutes < 5;
  const isWinner = timeLeft.isOver && auction.highBidder === currentUserEmail;

  // Formatting remaining text representation
  const formatTimeText = () => {
    if (timeLeft.isOver) {
      return lang === 'ar' ? 'منتهى ومغلق' : 'Ended';
    }
    const days = Math.floor((new Date(auction.endTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const h = (timeLeft.hours % 24).toString().padStart(2, '0');
    const m = timeLeft.minutes.toString().padStart(2, '0');
    const s = timeLeft.seconds.toString().padStart(2, '0');
    
    if (days > 0) {
      return lang === 'ar'
        ? `${days}ي ${h}:${m}:${s}`
        : `${days}d ${h}:${m}:${s}`;
    }
    return `${timeLeft.hours.toString().padStart(2, '0')}:${m}:${s}`;
  };

  const formattedEndDateTime = new Date(auction.endTime).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      onClick={() => onSelect(auction)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-[#0d0d0f] border transition-all duration-300 ease-out transform hover:-translate-y-1.5 hover:scale-[1.015] hover:shadow-2xl hover:shadow-amber-500/15 hover:border-amber-500/40 cursor-pointer ${
        isLessThan60Seconds
          ? 'border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.7)] ring-2 ring-red-600 bg-gradient-to-b from-red-950/30 via-[#0d0d0f] to-[#0d0d0f] animate-pulse'
          : isUrgent
            ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] ring-1 ring-red-500/50 animate-pulse'
            : isEndingSoon 
              ? 'border-rose-600/60 shadow-[0_0_15px_rgba(225,29,72,0.15)] ring-1 ring-rose-500/35' 
              : 'border-white/10'
      }`}
    >
      {/* Banner / Category Badge and Item condition overlays */}
      <div className="relative aspect-[18/9] sm:aspect-[16/10] w-full overflow-hidden bg-slate-900 border-b border-white/5">
        <img
          src={auction.image}
          alt={lang === 'ar' ? auction.titleAr : auction.titleEn}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
        
        {/* Badges Overlay */}
        <div className="absolute inset-x-2.5 top-2.5 sm:inset-x-3 sm:top-3 flex items-center justify-between">
          {/* Category Badge with custom descriptive tooltip */}
          <div className="relative group/cat-tooltip">
            <span 
              className="rounded bg-[#0a0a0b]/90 border border-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] tracking-widest font-bold text-white uppercase backdrop-blur-md select-none inline-block animate-fade-in"
              title={lang === 'ar' ? 'تصنيف السلعة المعروضة' : `Category: ${auction.category}`}
            >
              {t[auction.category as keyof typeof t] || auction.category}
            </span>
            <div className="absolute top-full mt-1.5 left-0 scale-0 group-hover/cat-tooltip:scale-100 transition-all duration-200 bg-zinc-950/95 text-[9px] text-slate-300 border border-white/10 rounded px-2.5 py-1 shadow-2xl z-50 pointer-events-none opacity-0 group-hover/cat-tooltip:opacity-100 whitespace-nowrap font-sans font-medium">
              {lang === 'ar' ? 'فئة السلعة وتصنيف الحراج للمزاد' : `Auction item classification category`}
            </div>
          </div>

          {/* Item Condition Badge & Watchlist Heart Button */}
          <div className="flex items-center gap-1.5">
            {onToggleWatchlist && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist(auction.id);
                }}
                className={`p-1.5 rounded-full border backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg z-20 ${
                  isWatchlisted
                    ? 'bg-rose-500/30 border-rose-500/60 text-rose-400 scale-110 shadow-rose-500/20'
                    : 'bg-[#0a0a0b]/80 border-white/15 text-slate-300 hover:text-rose-400 hover:border-rose-400/50 hover:scale-110'
                }`}
                title={isWatchlisted ? t.removeFromWatchlist : t.addToWatchlist}
              >
                <Heart className={`h-3.5 w-3.5 ${isWatchlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            )}

            <div className="relative group/con-tooltip">
              <span 
                className={`rounded border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-white uppercase backdrop-blur-md select-none inline-block ${
                  auction.itemCondition === 'new' 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
                title={lang === 'ar' ? 'حالة السلعة المعتمدة' : `Condition: ${auction.itemCondition}`}
              >
                {t[auction.itemCondition as keyof typeof t]}
              </span>
              <div className="absolute top-full mt-1.5 right-0 scale-0 group-hover/con-tooltip:scale-100 transition-all duration-200 bg-zinc-950/95 text-[9px] text-slate-300 border border-white/10 rounded px-2.5 py-1 shadow-2xl z-50 pointer-events-none opacity-0 group-hover/con-tooltip:opacity-100 whitespace-nowrap font-sans font-medium">
                {lang === 'ar' ? 'درجة جودة وحالة السلعة المعاينة في الحراج' : 'Verified quality and usage condition grade'}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Countdown Ribbon overlay with detailed tooltip */}
        <div className="relative group/time-tooltip w-full">
          <div className="absolute inset-x-0 bottom-0 z-20">
            <CountdownTimer endTime={auction.endTime} createdDate={auction.createdDate} lang={lang} variant="card-ribbon" />
          </div>
          {/* Floating countdown tooltip inside the bounds of the image overlay */}
          <div className="absolute bottom-full mb-1.5 left-3 scale-0 group-hover/time-tooltip:scale-100 transition-all duration-200 bg-zinc-950/95 text-[9px] text-slate-200 border border-white/10 rounded px-2.5 py-1 shadow-2xl z-55 pointer-events-none opacity-0 group-hover/time-tooltip:opacity-100 whitespace-nowrap font-sans font-medium">
            {isLessThan60Seconds
              ? (lang === 'ar' ? '🚨 تحذير حسم: أقل من 60 ثانية متبقية لإغلاق المزاد!' : '🚨 FINAL ALERT: Less than 60 seconds remaining!')
              : isUrgent 
                ? (lang === 'ar' ? '⚠️ حرج للغاية: أقل من 5 دقائق متبقية للمزايد النهائي!' : '⚠️ Critical status: Less than 5 minutes remain!')
                : isEndingSoon
                  ? (lang === 'ar' ? '⏳ اقترب الانتهاء: يغلق باب المزايدة في أقل من ساعة!' : '⏳ Ending soon: less than 1 hour remains!')
                  : (lang === 'ar' ? '⏳ حراج تفاعلي: فترة حسم وعطاءات نشطة حالياً' : '⏳ Active Bidding window: time remaining until settlement')
            }
          </div>
        </div>
      </div>

      {/* Description Metrics */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5 space-y-1.5 sm:space-y-2">
        
        {/* Title & Share Action */}
        <div className="flex items-center justify-between gap-2" id={`heading-share-${auction.id}`}>
          <h3 className="line-clamp-1 text-sm sm:text-base font-serif text-white group-hover:text-amber-500 transition-colors duration-200 flex-1">
            {lang === 'ar' ? auction.titleAr : auction.titleEn}
          </h3>
          <button
            type="button"
            onClick={handleShare}
            className="group/share relative cursor-pointer flex items-center justify-center p-1 sm:p-1.5 rounded-full border border-white/5 bg-white/5 hover:bg-amber-500 hover:text-[#0a0a0b] text-slate-400 hover:border-amber-500 transition-all duration-300 shrink-0"
            title={lang === 'ar' ? 'مشاركة المزاد' : 'Share Auction'}
            id={`share-action-${auction.id}`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 group-hover/share:text-[#0a0a0b] scale-110 transition-transform duration-200" />
                <span className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 whitespace-nowrap rounded bg-[#161618] border border-white/10 px-2.5 py-1 text-[9px] font-bold text-white shadow-2xl transition-all" style={{ zIndex: 50 }}>
                  {lang === 'ar' ? 'تم نسخ الرابط!' : 'Copied link!'}
                </span>
              </>
            ) : (
              <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
          </button>
        </div>

        {/* Shortened helper summary */}
        <p className="line-clamp-2 text-[11px] sm:text-xs text-slate-400 leading-relaxed font-light">
          {lang === 'ar' ? auction.descAr : auction.descEn}
        </p>

        {/* Live Metrics Row (Bids Count & Trend Index) */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 pt-0.5">
          {/* Interactive bidder tag indicator with a descriptive hover tooltip */}
          <div className="relative group/bid-tooltip flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold w-fit">
            <Gavel className="h-3.5 w-3.5 text-amber-500/60 shrink-0" />
            {auction.bidsCount > 0 ? (
              <span className="truncate max-w-[120px] sm:max-w-[180px] inline-block align-bottom">
                {auction.bidsCount} {t.bids} &bull; <span className="text-amber-500 truncate">{auction.highBidderName}</span>
              </span>
            ) : (
              <span className="italic">{t.noBids}</span>
            )}
            {/* Elegant bids counts and status tooltip */}
            <div className="absolute bottom-full mb-1.5 left-0 scale-0 group-hover/bid-tooltip:scale-100 transition-all duration-200 bg-zinc-950/95 text-[9px] text-slate-200 border border-white/10 rounded px-2.5 py-1 shadow-2xl z-55 pointer-events-none opacity-0 group-hover/bid-tooltip:opacity-100 whitespace-nowrap font-sans font-medium normal-case">
              {auction.bidsCount > 0 
                ? (lang === 'ar' 
                    ? `🔧 إجمالي العطاءات: تم تقديم ${auction.bidsCount} عرضاً. المزايد المتصدر: ${auction.highBidderName}` 
                    : `Total recorded activity: ${auction.bidsCount} proposals submitted. High bidder: ${auction.highBidderName}`)
                : (lang === 'ar' ? '💡 لا توجد مشاركات حتى الآن. اضغط لتشغيل المزايدة والحسم!' : '💡 Zero active listings. Click card to open the bidding stream!')
              }
            </div>
          </div>

          {/* Small trend indicator for bids placed in the last hour with customized tooltip */}
          {bidsInLastHour > 0 && (
            <div className="relative group/trend-tooltip">
              <div className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-400 uppercase tracking-wider animate-pulse" id={`trend-hour-${auction.id}`}>
                <Flame className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="hidden sm:inline">
                  {lang === 'ar' 
                    ? `${bidsInLastHour} مزايدات مؤخراً!` 
                    : `${bidsInLastHour} bids recently!`}
                </span>
                <span className="inline sm:hidden">
                  {lang === 'ar' 
                    ? `${bidsInLastHour} نشط!` 
                    : `${bidsInLastHour} active!`}
                </span>
              </div>
              {/* Live trend details tooltip */}
              <div className="absolute bottom-full mb-1.5 left-0 scale-0 group-hover/trend-tooltip:scale-100 transition-all duration-200 bg-zinc-950/95 text-[9px] text-amber-400 border border-amber-500/20 rounded px-2.5 py-1 shadow-2xl z-55 pointer-events-none opacity-0 group-hover/trend-tooltip:opacity-100 whitespace-nowrap font-sans font-medium normal-case">
                {lang === 'ar'
                  ? `🔥 تنافسية متسارعة: ${bidsInLastHour} مزايدات حية نشطة في الـ 60 دقيقة الأخيرة!`
                  : `🔥 Rapid competition: ${bidsInLastHour} live-bidding activities within the past 60 minutes!`
                }
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-px bg-white/5" />

        {/* Price grid and dynamic countdown timer alongside */}
        <div className="mt-auto pt-1 flex items-center justify-between gap-2 border-t border-white/5">
          {/* Current price & optional buyout */}
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">
              {t.currentPrice}
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-amber-500 flex items-baseline gap-0.5 mt-0.5">
              {formatPrice(auction.currentPrice, currency, lang)}
            </span>
            {auction.buyoutPrice && (
              <span className="text-[9px] font-mono text-slate-400 block line-through">
                {t.buyoutPrice}: {formatPrice(auction.buyoutPrice, currency, lang)}
              </span>
            )}
          </div>

          {/* Dynamic Countdown Timer & End Date/Time */}
          <div className="flex flex-col items-end text-right">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
              {lang === 'ar' ? 'انتهاء:' : 'Ends:'} {formattedEndDateTime}
            </span>
            <CountdownTimer endTime={auction.endTime} createdDate={auction.createdDate} lang={lang} variant="card-timer" />
          </div>
        </div>

        {/* If user won the auction but hasn't settled yet, show Checkout action with security escrow tooltip */}
        {isWinner && auction.status === 'completed' && !auction.trackingNumber && (
          <div className="pt-2 relative group/check-tooltip">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickCheckout) onQuickCheckout(auction);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs uppercase tracking-wider font-extrabold bg-amber-500 text-[#0a0a0b] hover:bg-amber-400 rounded transition-colors"
              title={lang === 'ar' ? 'اضغط للإيداع والتحويل الآمن بالضمان' : 'Checkout secured escrow payment'}
            >
              <CheckCircle className="h-3.5 w-3.5 animate-pulse" />
              <span>{t.paySecured}</span>
            </button>
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 scale-0 group-hover/check-tooltip:scale-100 transition-all duration-200 bg-zinc-950/95 text-[9px] text-slate-100 border border-[#eab308]/20 rounded px-2.5 py-1 shadow-2xl z-55 pointer-events-none opacity-0 group-hover/check-tooltip:opacity-100 whitespace-nowrap font-sans font-medium uppercase">
              {lang === 'ar'
                ? '🔒 مزاد محسوم: بادر بالدفع لإيداع الضمان وتوجيه الشحن للبائع!'
                : '🔒 Locked: Settle payments securely with verified multi-channel Escrow!'
              }
            </div>
          </div>
        )}

        {/* If won and shipped info is ready, include interactive logistics tooltip */}
        {isWinner && auction.trackingNumber && (
          <div className="pt-2 relative group/ship-tooltip">
            <div 
              className="flex items-center gap-1 text-[11px] text-amber-500 uppercase tracking-widest font-extrabold bg-amber-500/10 border border-amber-500/20 py-2 rounded justify-center"
              title={lang === 'ar' ? 'شحنة مفعلة وقيد التتبع' : 'Dispatched cargo under tracking log'}
            >
              <Package className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
              <span>{t.shipmentTracking}: {auction.trackingNumber}</span>
            </div>
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 scale-0 group-hover/ship-tooltip:scale-100 transition-all duration-200 bg-zinc-950/95 text-[9px] text-[#00ff88] border border-[#00ff88]/20 rounded px-2.5 py-1 shadow-2xl z-55 pointer-events-none opacity-0 group-hover/ship-tooltip:opacity-100 whitespace-nowrap font-sans font-medium uppercase">
              {lang === 'ar'
                ? '🚚 الشحنة مرسلة ومؤمنة: اضغط لمتابعة خطوات الناقل وتحرير الضمان!'
                : '🚚 Cargo en route: Track carrier updates and manage escrow values!'
              }
            </div>
          </div>
        )}
      </div>

      {/* Decorative pulse for ending soon / urgent / <60s */}
      {(isEndingSoon || isUrgent || isLessThan60Seconds) && (
        <span className="absolute right-3 top-16 flex h-3 w-3 z-30">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isLessThan60Seconds ? 'bg-red-500 duration-300' : isUrgent ? 'bg-red-500 duration-500' : 'bg-rose-400'
          }`}></span>
          <span className={`relative inline-flex rounded-full h-3 w-3 ${
            isLessThan60Seconds ? 'bg-red-600 animate-pulse scale-125 shadow-[0_0_10px_rgba(239,68,68,1)]' : isUrgent ? 'bg-red-600 animate-pulse scale-110' : 'bg-rose-600'
          }`}></span>
        </span>
      )}
    </div>
  );
});

export default AuctionCard;
