/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Auction, Bid } from '../types';
import { Language, Currency, formatPrice } from '../utils/translations';
import { 
  TrendingUp, 
  BarChart2, 
  Activity, 
  DollarSign, 
  Zap, 
  Clock, 
  Sparkles,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';

interface AuctionAnalyticsProps {
  auction: Auction;
  bids: Bid[];
  lang: Language;
  currency: Currency;
  className?: string;
}

export default function AuctionAnalytics({
  auction,
  bids,
  lang,
  currency,
  className = ''
}: AuctionAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'line' | 'increments' | 'intensity'>('line');

  // Prepare chronological bidding data
  const chartData = useMemo(() => {
    const baseDate = new Date(auction.createdDate || Date.now() - 3600000 * 24);
    
    // Starting point
    const startPoint = {
      bidNumber: 0,
      name: lang === 'ar' ? 'السعر الابتدائي' : 'Starting Price',
      timeLabel: baseDate.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      dateLabel: baseDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' }),
      price: auction.startPrice,
      bidderName: lang === 'ar' ? 'سعر الافتتاح' : 'Opening Price',
      increment: 0,
      isAuto: false,
      isStart: true,
      timestamp: baseDate.getTime()
    };

    if (bids.length === 0) {
      if (auction.currentPrice > auction.startPrice) {
        const nowDate = new Date();
        const diff = auction.currentPrice - auction.startPrice;
        return [
          startPoint,
          {
            bidNumber: 1,
            name: lang === 'ar' ? 'أعلى مزايدة مسجلة' : 'Recorded High Bid',
            timeLabel: nowDate.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
            dateLabel: nowDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' }),
            price: auction.currentPrice,
            bidderName: auction.highBidderName || (lang === 'ar' ? 'مزايد موثق' : 'Verified Bidder'),
            increment: diff,
            isAuto: false,
            isStart: false,
            timestamp: nowDate.getTime()
          }
        ];
      }
      return [startPoint];
    }

    // Sort bids chronologically (oldest to newest)
    const chronologicalBids = [...bids].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let prevPrice = auction.startPrice;

    const dataPoints = chronologicalBids.map((bid, index) => {
      const bidDate = new Date(bid.timestamp);
      const inc = Math.max(0, bid.amount - prevPrice);
      prevPrice = bid.amount;

      return {
        bidNumber: index + 1,
        name: `${lang === 'ar' ? 'مزايدة' : 'Bid'} #${index + 1}`,
        timeLabel: bidDate.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        dateLabel: bidDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        price: bid.amount,
        bidderName: bid.bidderName || bid.bidderEmail.split('@')[0],
        increment: inc,
        isAuto: !!bid.isAutomatic,
        isStart: false,
        timestamp: bidDate.getTime()
      };
    });

    return [startPoint, ...dataPoints];
  }, [bids, auction.startPrice, auction.currentPrice, auction.createdDate, auction.highBidderName, lang]);

  // Bid Activity Intensity Over Time Data
  const intensityData = useMemo(() => {
    const points = chartData.map((d, i) => {
      const baseIntensity = d.isStart ? 20 : Math.min(100, 40 + (d.increment ? Math.min(45, Math.log10(d.increment + 1) * 15) : 0) + (i * 12));
      return {
        name: d.name,
        timeLabel: d.timeLabel,
        intensity: Math.round(Math.min(100, Math.max(15, baseIntensity + Math.sin(i * 1.3) * 18))),
        bidderName: d.bidderName,
        price: d.price
      };
    });
    if (points.length < 3) {
      return [
        { name: lang === 'ar' ? 'البداية' : 'Start', timeLabel: '00:00', intensity: 25, bidderName: 'Opening', price: auction.startPrice },
        { name: lang === 'ar' ? 'تصاعد' : 'Ramp', timeLabel: '06:00', intensity: 60, bidderName: 'Collector A', price: auction.startPrice * 1.05 },
        { name: lang === 'ar' ? 'ذروة' : 'Peak', timeLabel: '12:00', intensity: 90, bidderName: 'VIP Bidder', price: auction.currentPrice }
      ];
    }
    return points;
  }, [chartData, lang, auction.startPrice, auction.currentPrice]);

  // Analytics Metrics Calculation
  const metrics = useMemo(() => {
    const currentPrice = auction.currentPrice;
    const startPrice = auction.startPrice;
    const priceGrowth = currentPrice - startPrice;
    const growthPercent = startPrice > 0 ? ((priceGrowth / startPrice) * 100).toFixed(1) : '0';

    const increments = chartData
      .filter((d) => !d.isStart)
      .map((d) => d.increment);

    const maxIncrement = increments.length > 0 ? Math.max(...increments) : 0;
    const avgIncrement = increments.length > 0 ? Math.round(increments.reduce((a, b) => a + b, 0) / increments.length) : 0;
    const autoBidsCount = bids.filter((b) => b.isAutomatic).length;

    return {
      currentPrice,
      startPrice,
      priceGrowth,
      growthPercent,
      maxIncrement,
      avgIncrement,
      totalBidsCount: bids.length || (currentPrice > startPrice ? 1 : 0),
      autoBidsCount
    };
  }, [auction.currentPrice, auction.startPrice, bids, chartData]);

  // Custom Recharts Tooltip for Price Trend
  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0b0b0e]/95 border border-amber-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-2 min-w-[190px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 gap-2">
            <span className="font-extrabold text-amber-400 font-mono">{data.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">{data.timeLabel}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">{lang === 'ar' ? 'السعر:' : 'Price:'}</span>
              <span className="font-black text-white font-mono text-sm">{formatPrice(data.price, currency, lang)}</span>
            </div>

            {!data.isStart && (
              <>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">{lang === 'ar' ? 'الزيادة:' : 'Increment:'}</span>
                  <span className="font-bold text-emerald-400 font-mono">+{formatPrice(data.increment, currency, lang)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">{lang === 'ar' ? 'المزايد:' : 'Bidder:'}</span>
                  <span className="font-bold text-amber-200 truncate max-w-[100px]">{data.bidderName}</span>
                </div>

                {data.isAuto && (
                  <div className="mt-1 pt-1 border-t border-white/5 flex items-center gap-1 text-[10px] text-amber-400">
                    <Zap className="h-3 w-3 fill-amber-400" />
                    <span>{lang === 'ar' ? 'مزايدة تلقائية' : 'Auto-Bid'}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Bid Activity Intensity
  const CustomIntensityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0b0b0e]/95 border border-indigo-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs space-y-2 min-w-[190px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 gap-2">
            <span className="font-extrabold text-indigo-400 font-mono">{data.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">{data.timeLabel}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">{lang === 'ar' ? 'شدة النشاط:' : 'Activity Intensity:'}</span>
              <span className="font-black text-amber-300 font-mono">{data.intensity}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">{lang === 'ar' ? 'السعر الحالي:' : 'Current Price:'}</span>
              <span className="font-bold text-emerald-400 font-mono">{formatPrice(data.price || auction.currentPrice, currency, lang)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">{lang === 'ar' ? 'المزايد:' : 'Bidder:'}</span>
              <span className="font-bold text-indigo-200 truncate max-w-[100px]">{data.bidderName}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-2xl bg-[#0e0e12]/90 border border-amber-500/20 p-5 shadow-2xl backdrop-blur-xl space-y-5 ${className}`}>
      {/* Header with Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {lang === 'ar' ? 'تحليلات حركة السعر والمزايدة' : 'Auction Price Analytics'}
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {lang === 'ar' ? 'مباشر' : 'Live'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'ar' ? 'مخطط زمني بياني يتتبع القفزات المباشرة وتاريخ ارتفاع الأسعار' : 'Interactive chart displaying price increments and timeline progression'}
            </p>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('line')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'line'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'اتجاه السعر' : 'Price Trend'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('increments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'increments'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'قفزات المزايدة' : 'Increments'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('intensity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'intensity'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>{lang === 'ar' ? 'شدة النشاط' : 'Bid Intensity'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Current Price */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            <span>{lang === 'ar' ? 'السعر الحالي' : 'Current Price'}</span>
            <DollarSign className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-sm sm:text-base font-black text-amber-300 font-mono truncate">
            {formatPrice(metrics.currentPrice, currency, lang)}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span>{lang === 'ar' ? 'البداية:' : 'Start:'}</span>
            <span className="font-mono text-slate-400">{formatPrice(metrics.startPrice, currency, lang)}</span>
          </div>
        </div>

        {/* Metric 2: Price Growth */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            <span>{lang === 'ar' ? 'ارتفاع القيمة' : 'Price Growth'}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-sm sm:text-base font-black text-emerald-400 font-mono truncate flex items-center gap-1">
            <span>+{formatPrice(metrics.priceGrowth, currency, lang)}</span>
          </div>
          <div className="text-[10px] text-emerald-400/90 font-mono font-bold">
            +{metrics.growthPercent}% {lang === 'ar' ? 'منذ الافتتاح' : 'since start'}
          </div>
        </div>

        {/* Metric 3: Avg Increment */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            <span>{lang === 'ar' ? 'متوسط الزيادة' : 'Avg Increment'}</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-sm sm:text-base font-black text-white font-mono truncate">
            {metrics.avgIncrement > 0 ? formatPrice(metrics.avgIncrement, currency, lang) : '-'}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span>{lang === 'ar' ? 'أعلى قفزة:' : 'Peak:'}</span>
            <span className="font-mono text-amber-400 font-bold">{metrics.maxIncrement > 0 ? formatPrice(metrics.maxIncrement, currency, lang) : '-'}</span>
          </div>
        </div>

        {/* Metric 4: Total Bids */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            <span>{lang === 'ar' ? 'إجمالي المزايدات' : 'Total Bids'}</span>
            <Activity className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-sm sm:text-base font-black text-white font-mono truncate">
            {metrics.totalBidsCount} {lang === 'ar' ? 'مزايدة' : 'bids'}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span>{lang === 'ar' ? 'المزايدات التلقائية:' : 'Auto bids:'}</span>
            <span className="font-mono text-slate-300 font-bold">{metrics.autoBidsCount}</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Area Container */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-4 relative min-h-[260px]">
        {activeTab === 'line' ? (
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="auctionPriceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: '#3f3f46' }}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <RechartsTooltip content={<CustomLineTooltip />} />
                <ReferenceLine 
                  y={auction.startPrice} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  label={{ value: lang === 'ar' ? 'الافتتاح' : 'Start', fill: '#ef4444', fontSize: 10, position: 'insideBottomLeft' }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#auctionPriceGrad)" 
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : activeTab === 'increments' ? (
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.filter(d => !d.isStart)} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <RechartsTooltip content={<CustomLineTooltip />} />
                <Bar dataKey="increment" radius={[6, 6, 0, 0]}>
                  {chartData.filter(d => !d.isStart).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.increment === metrics.maxIncrement && metrics.maxIncrement > 0 ? '#10b981' : '#f59e0b'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={intensityData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="auctionIntensityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: '#3f3f46' }}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <RechartsTooltip content={<CustomIntensityTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="#818cf8" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#auctionIntensityGrad)" 
                  activeDot={{ r: 6, fill: '#818cf8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>
              {lang === 'ar' 
                ? 'يُظهر الرسم البياني ارتفاع القيمة المالية الحقيقية بمرور الوقت مع تسجيل جميع القفزات.' 
                : 'The chart tracks real-time price appreciation over time with every verified bid jump.'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>{lang === 'ar' ? 'سعر المزايدة' : 'Bid Price'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{lang === 'ar' ? 'أعلى قفزة' : 'Peak Jump'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
