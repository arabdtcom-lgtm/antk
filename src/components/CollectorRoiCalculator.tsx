/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { translations, Language, Currency, formatPrice } from '../utils/translations';
import { 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  BarChart2, 
  ShieldCheck, 
  HelpCircle,
  Award,
  ArrowUpRight
} from 'lucide-react';

interface CollectorRoiCalculatorProps {
  lang: Language;
  currency: Currency;
}

export default function CollectorRoiCalculator({
  lang,
  currency
}: CollectorRoiCalculatorProps) {
  const isAr = lang === 'ar';

  const [initialInvestment, setInitialInvestment] = useState<number>(5000);
  const [holdingYears, setHoldingYears] = useState<number>(5);
  const [assetClass, setAssetClass] = useState<string>('khedivial_docs');

  const roiData = useMemo(() => {
    let annualRate = 0.142; // Default 14.2% YoY for historic documents

    if (assetClass === 'khedivial_docs') annualRate = 0.165; // 16.5% YoY
    if (assetClass === 'royal_medals') annualRate = 0.148;   // 14.8% YoY
    if (assetClass === 'vintage_watches') annualRate = 0.185; // 18.5% YoY
    if (assetClass === 'fine_art') annualRate = 0.125;        // 12.5% YoY

    const projectedValue = initialInvestment * Math.pow(1 + annualRate, holdingYears);
    const netProfit = projectedValue - initialInvestment;
    const percentageReturn = ((netProfit / initialInvestment) * 100).toFixed(1);

    return {
      annualRate: (annualRate * 100).toFixed(1),
      projectedValue: Math.round(projectedValue),
      netProfit: Math.round(netProfit),
      percentageReturn
    };
  }, [initialInvestment, holdingYears, assetClass]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 mb-3">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{isAr ? 'حاسبة العائد الاستثماري ومؤشر القيمة' : 'Collector Investment ROI Calculator'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isAr ? 'مؤشر النمو الاستثماري للتحف والوثائق الأثرية' : 'Antique Asset Appreciation & ROI Index'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          {isAr 
            ? 'احسب الأرباح ومعدل نمو القيمة السوقية المتوقع لمقتنياتك الملكية على مدى سنوات الحفظ.' 
            : 'Compute projected capital growth and annual appreciation yields for historical art and royal collection pieces.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Panel */}
        <div className="lg:col-span-7 bg-[#121218] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
          
          {/* Investment Amount Slider & Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">
                {isAr ? 'قيمة الاستثمار الأولية ($ USD)' : 'Initial Investment Amount ($ USD)'}
              </label>
              <span className="text-sm font-extrabold font-mono text-amber-400">
                {formatPrice(initialInvestment, currency, lang)}
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Holding Years Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">
                {isAr ? 'مدة الحفظ والأرشفة (بالسنوات)' : 'Holding Duration (Years)'}
              </label>
              <span className="text-sm font-extrabold font-mono text-amber-400">
                {holdingYears} {isAr ? 'سنوات' : 'Years'}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={holdingYears}
              onChange={(e) => setHoldingYears(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Asset Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              {isAr ? 'فئة المقتنى الأثري' : 'Asset Category'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'khedivial_docs', label: isAr ? '📜 الوثائق والسندات الخديوية (+16.5%)' : '📜 Khedivial Bonds (+16.5%)' },
                { id: 'vintage_watches', label: isAr ? '⌚ الساعات النادرة الملكية (+18.5%)' : '⌚ Rare Vintage Watches (+18.5%)' },
                { id: 'royal_medals', label: isAr ? '🎖️ الأوسمة والنياسين الملكية (+14.8%)' : '🎖️ Royal Medals (+14.8%)' },
                { id: 'fine_art', label: isAr ? '🖼️ اللوحات والأنتيك الملكي (+12.5%)' : '🖼️ Fine Antique Art (+12.5%)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setAssetClass(cat.id)}
                  className={`p-3 text-xs font-bold rounded-xl border text-right transition-all cursor-pointer ${
                    assetClass === cat.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-extrabold shadow-md'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Results Overview */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#181820] to-[#0d0d12] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />
              {isAr ? 'توقع الأرباح والقيمة المستقبليّة' : 'Projected Investment Return'}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              +{roiData.annualRate}% {isAr ? 'سنوياً' : 'YoY Growth'}
            </span>
          </div>

          <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'القيمة المتوقعة بعد' : 'Projected Value After'} {holdingYears} {isAr ? 'سنوات' : 'Years'}</span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 my-1">
              {formatPrice(roiData.projectedValue, currency, lang)}
            </div>
            <div className="flex items-center justify-center gap-1 text-xs font-mono font-bold text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
              <span>+{formatPrice(roiData.netProfit, currency, lang)} ({roiData.percentageReturn}%)</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-white/5 border border-white/5">
              <span className="text-slate-400">{isAr ? 'رأس المال الأصلي' : 'Initial Principal'}</span>
              <span className="font-mono font-bold text-white">{formatPrice(initialInvestment, currency, lang)}</span>
            </div>

            <div className="flex justify-between p-2.5 rounded bg-white/5 border border-white/5">
              <span className="text-slate-400">{isAr ? 'حماية من التضخم (Inflation Hedge)' : 'Inflation Protection Rating'}</span>
              <span className="font-bold text-amber-400">{isAr ? 'ممتاز 100%' : 'High Hedge (100%)'}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
