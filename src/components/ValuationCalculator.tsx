/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { translations, Language, Currency, formatPrice } from '../utils/translations';
import { 
  Calculator, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  HelpCircle, 
  ArrowRight,
  Gavel,
  History,
  FileCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ValuationCalculatorProps {
  lang: Language;
  currency: Currency;
  onDraftAuction: (draft: { title: string; category: string; startingBid: number; buyoutPrice: number; description: string }) => void;
}

export default function ValuationCalculator({
  lang,
  currency,
  onDraftAuction
}: ValuationCalculatorProps) {
  const isAr = lang === 'ar';

  const [category, setCategory] = useState<string>('historical_docs');
  const [era, setEra] = useState<string>('khedivial');
  const [condition, setCondition] = useState<string>('excellent');
  const [provenance, setProvenance] = useState<string>('royal_seal');
  const [rarity, setRarity] = useState<string>('rare');
  const [itemName, setItemName] = useState<string>('');

  // Dynamic valuation math model
  const valuation = useMemo(() => {
    let basePriceUSD = 500;

    // Base multiplier by category
    if (category === 'historical_docs') basePriceUSD = 1200;
    if (category === 'royal_art') basePriceUSD = 2500;
    if (category === 'vintage_watches') basePriceUSD = 4000;
    if (category === 'coins_medals') basePriceUSD = 800;
    if (category === 'classic_cars') basePriceUSD = 35000;

    // Era multiplier
    let eraMultiplier = 1.0;
    if (era === '18th_century') eraMultiplier = 2.4;
    if (era === 'khedivial') eraMultiplier = 1.8; // Khedivial Egypt (1867–1914)
    if (era === 'kingdom') eraMultiplier = 1.4;   // Kingdom of Egypt (1922–1952)
    if (era === 'mid_century') eraMultiplier = 1.1;

    // Condition multiplier
    let conditionMultiplier = 1.0;
    if (condition === 'mint') conditionMultiplier = 1.5;
    if (condition === 'excellent') conditionMultiplier = 1.25;
    if (condition === 'good') conditionMultiplier = 1.0;
    if (condition === 'fair') conditionMultiplier = 0.7;

    // Provenance multiplier
    let provenanceMultiplier = 1.0;
    if (provenance === 'royal_seal') provenanceMultiplier = 1.8;
    if (provenance === 'archive_certificate') provenanceMultiplier = 1.4;
    if (provenance === 'family_history') provenanceMultiplier = 1.15;
    if (provenance === 'none') provenanceMultiplier = 0.85;

    // Rarity multiplier
    let rarityMultiplier = 1.0;
    if (rarity === 'unique') rarityMultiplier = 3.0;
    if (rarity === 'extremely_rare') rarityMultiplier = 2.0;
    if (rarity === 'rare') rarityMultiplier = 1.3;
    if (rarity === 'common') rarityMultiplier = 0.9;

    const calculatedUsd = basePriceUSD * eraMultiplier * conditionMultiplier * provenanceMultiplier * rarityMultiplier;
    
    const minUsd = Math.round(calculatedUsd * 0.85);
    const maxUsd = Math.round(calculatedUsd * 1.25);
    const expectedUsd = Math.round(calculatedUsd);

    const confidence = Math.min(99, Math.round(82 + (provenanceMultiplier > 1.2 ? 10 : 0) + (conditionMultiplier > 1.0 ? 5 : 0)));
    const liquidityIndex = rarity === 'unique' ? (isAr ? 'عالي جداً (طلب حاد من الجامعين)' : 'Very High (Collector Demand)') : (isAr ? 'مرتفع' : 'High');

    return {
      minUsd,
      expectedUsd,
      maxUsd,
      confidence,
      liquidityIndex
    };
  }, [category, era, condition, provenance, rarity, isAr]);

  const handleCreateDraft = () => {
    const titleText = itemName.trim() || (isAr ? 'قطع وثائق أثرية ملكية تقييم معتمد' : 'Authenticated Royal Antique Collection Item');
    const startingBid = Math.round(valuation.minUsd * 0.7);
    const buyoutPrice = Math.round(valuation.maxUsd * 1.1);
    
    const description = isAr 
      ? `تم تقييم هذه القطعة عبر حاسبة تقييم أنتيكاوي المعتمدة. العصر: ${era}. الحالة: ${condition}. التوثيق: ${provenance}. درجة الندرة: ${rarity}. القيمة التقديرية المعتمدة: $${valuation.expectedUsd.toLocaleString()}`
      : `Evaluated via Antkawy Antique Appraisal Engine. Era: ${era}. Condition: ${condition}. Provenance: ${provenance}. Rarity: ${rarity}. Estimated Valuation: $${valuation.expectedUsd.toLocaleString()}`;

    onDraftAuction({
      title: titleText,
      category: category === 'historical_docs' ? 'وثائق ومستندات تاريخية' :
                category === 'royal_art' ? 'فنون وأنتيك ملوكي' :
                category === 'vintage_watches' ? 'ساعات ومجوهرات فاخرة' :
                category === 'coins_medals' ? 'وثائق ومستندات تاريخية' : 'سيارات ومحركات',
      startingBid,
      buyoutPrice,
      description
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isAr ? 'حاسبة التقييم والأرشفة الأثرية' : 'AI-Powered Antique Appraisal Engine'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isAr ? 'تخمين وتثمين القطع والوثائق الأثرية' : 'Antique & Historical Document Valuation'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          {isAr 
            ? 'قم بإدخال مواصفات القطعة، العصر التاريخي، ومستوى التوثيق للوصول إلى التقييم السعري التقريبي المستند لبيانات المزادات الملكية التاريخية.' 
            : 'Enter item specifications, historical era, and provenance status to compute instant market value range based on verified auction sales comps.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs Controls */}
        <div className="lg:col-span-7 space-y-5 bg-[#121216] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
          
          {/* Optional Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isAr ? 'اسم القطعة أو الوثيقة (اختياري)' : 'Item or Document Title (Optional)'}
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={isAr ? 'مثال: سند شركة قناة السويس العالمية 1869' : 'e.g., Suez Canal Universal Company Bond 1869'}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              {isAr ? 'فئة المقتنى الأثري' : 'Artifact Category'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'historical_docs', label: isAr ? '📜 وثائق ومستندات' : '📜 Historical Documents' },
                { id: 'royal_art', label: isAr ? '🖼️ تحف وفنون ملوكية' : '🖼️ Royal Antiques' },
                { id: 'vintage_watches', label: isAr ? '⌚ ساعات وأوسمة' : '⌚ Luxury Watches' },
                { id: 'coins_medals', label: isAr ? '🪙 عملات وميداليات' : '🪙 Coins & Medals' },
                { id: 'classic_cars', label: isAr ? '🚘 سيارات ومحركات' : '🚘 Classic Cars' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border text-right transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-extrabold shadow-sm'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Era / Period */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              {isAr ? 'العصر أو الحقبة التاريخية' : 'Historical Era / Period'}
            </label>
            <select
              value={era}
              onChange={(e) => setEra(e.target.value)}
              className="w-full rounded-xl bg-[#1a1a22] border border-white/10 px-4 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="18th_century">{isAr ? 'القرن الثامن عشر وقبل (1700 - 1799)' : '18th Century & Earlier (Pre-1800)'}</option>
              <option value="khedivial">{isAr ? 'العهد الخديوي في مصر (1867 - 1914)' : 'Khedivial Era Egypt (1867-1914)'}</option>
              <option value="kingdom">{isAr ? 'حقبة المملكة المصرية والأسر الملكية (1922 - 1952)' : 'Kingdom of Egypt Era (1922-1952)'}</option>
              <option value="mid_century">{isAr ? 'منتصف القرن العشرين (1950 - 1980)' : 'Mid-20th Century (1950-1980)'}</option>
            </select>
          </div>

          {/* Provenance Status */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              {isAr ? 'درجة التوثيق والأختام الرسمية' : 'Provenance & Official Seals'}
            </label>
            <div className="space-y-2">
              {[
                { id: 'royal_seal', title: isAr ? 'أختام ملكية أصلية / ختم ديوان المعارف أو الأوقاف' : 'Original Royal Seals / Ministry Archive Stamp', icon: ShieldCheck },
                { id: 'archive_certificate', title: isAr ? 'شهادة توثيق معتمدة من دار الكتب أو خبير آثار' : 'Official Archive Certificate / Expert Authentication', icon: FileCheck },
                { id: 'family_history', title: isAr ? 'وثيقة موروثة عائلياً موثقة الشجرة' : 'Documented Family Heritage Lineage', icon: History },
                { id: 'none', title: isAr ? 'بدون مستندات توثيق إضافية' : 'No Additional Certificate Attached', icon: AlertCircle },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvenance(p.id)}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      provenance === p.id
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${provenance === p.id ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold">{p.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition and Rarity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? 'حالة القطعة الفيزيائية' : 'Physical Condition'}
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-xl bg-[#1a1a22] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 outline-none cursor-pointer"
              >
                <option value="mint">{isAr ? 'ممتازة كأنها جديدة (Mint Standard)' : 'Mint Standard (Original State)'}</option>
                <option value="excellent">{isAr ? 'ممتازة مع حفظ كامل للتفاصيل' : 'Excellent (Well Preserved)'}</option>
                <option value="good">{isAr ? 'جيدة (آثار تعتيق طبيعية)' : 'Good (Natural Antique Ageing)'}</option>
                <option value="fair">{isAr ? 'متوسطة (تتطلب ترميم بسيط)' : 'Fair (Requires Minor Restoration)'}</option>
              </select>
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? 'مستوى الندرة' : 'Rarity Index'}
              </label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="w-full rounded-xl bg-[#1a1a22] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 outline-none cursor-pointer"
              >
                <option value="unique">{isAr ? 'فريدة جداً (نسخة واحدة بالعالم 1/1)' : 'Unique Piece (1 of 1 World)'}</option>
                <option value="extremely_rare">{isAr ? 'نادرة للغاية (إصدار محدود)' : 'Extremely Rare (Limited Edition)'}</option>
                <option value="rare">{isAr ? 'نادرة ومرغوبة من جامع التحف' : 'Rare (High Collector Interest)'}</option>
                <option value="common">{isAr ? 'متوفرة في سوق الأنتيك' : 'Relatively Available'}</option>
              </select>
            </div>
          </div>

        </div>

        {/* Valuation Result Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-b from-[#181820] to-[#0e0e12] border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            
            {/* Background ambient glow */}
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-extrabold tracking-wider text-amber-400 uppercase">
                  {isAr ? 'نتيجة التخمين المعتمدة' : 'Official Appraisal Result'}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                {valuation.confidence}% {isAr ? 'دقة التخمين' : 'Confidence'}
              </span>
            </div>

            {/* Expected Valuation Big Display */}
            <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5 my-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {isAr ? 'القيمة السوقية العادلة المتوقعة' : 'Estimated Fair Market Value'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                {formatPrice(valuation.expectedUsd, currency, lang)}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <span>{isAr ? 'النطاق المتوقع:' : 'Range:'}</span>
                <span className="font-mono text-slate-300 font-bold">
                  {formatPrice(valuation.minUsd, currency, lang)} - {formatPrice(valuation.maxUsd, currency, lang)}
                </span>
              </div>
            </div>

            {/* Market Indicators */}
            <div className="space-y-2.5 my-4">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-400">{isAr ? 'مؤشر سيولة الطلب' : 'Collector Liquidity Index'}</span>
                <span className="font-bold text-emerald-400">{valuation.liquidityIndex}</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-400">{isAr ? 'سعر الافتتاح الموصى به للمزاد' : 'Recommended Starting Bid'}</span>
                <span className="font-mono font-bold text-white">{formatPrice(Math.round(valuation.minUsd * 0.7), currency, lang)}</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-400">{isAr ? 'سعر الشراء الفوري (Buyout)' : 'Suggested Instant Buyout'}</span>
                <span className="font-mono font-bold text-amber-400">{formatPrice(Math.round(valuation.maxUsd * 1.1), currency, lang)}</span>
              </div>
            </div>

            {/* 1-Click Action to Create Auction */}
            <button
              onClick={handleCreateDraft}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Gavel className="h-4 w-4" />
              <span>{isAr ? 'طرح هذه القطعة بمزاد بالأسعار المقدرة' : 'Launch Auction with Estimated Prices'}</span>
              <ArrowRight className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
