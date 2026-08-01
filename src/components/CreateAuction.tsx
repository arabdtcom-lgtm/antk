/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { translations, Language, Currency } from '../utils/translations';
import { Sparkles, Gavel, FileText, Image as ImageIcon, Calendar, AlertCircle } from 'lucide-react';
import { ItemCondition } from '../types';

interface CreateAuctionProps {
  lang: Language;
  onSuccess: () => void;
  initialDraft?: {
    title?: string;
    category?: string;
    startingBid?: number;
    buyoutPrice?: number;
    description?: string;
  } | null;
}

export default function CreateAuction({ lang, onSuccess, initialDraft }: CreateAuctionProps) {
  const t = translations[lang];

  // Form states
  const [titleAr, setTitleAr] = useState(initialDraft?.title || '');
  const [titleEn, setTitleEn] = useState(initialDraft?.title || '');
  const [descAr, setDescAr] = useState(initialDraft?.description || '');
  const [descEn, setDescEn] = useState(initialDraft?.description || '');
  const [category, setCategory] = useState(initialDraft?.category || 'وثائق ومستندات تاريخية');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800');
  const [startPrice, setStartPrice] = useState(initialDraft?.startingBid ? initialDraft.startingBid.toString() : '2500');
  const [minIncrement, setMinIncrement] = useState('100');
  const [buyoutPrice, setBuyoutPrice] = useState(initialDraft?.buyoutPrice ? initialDraft.buyoutPrice.toString() : '');
  const [durationDays, setDurationDays] = useState('3');
  const [softCloseMinutes, setSoftCloseMinutes] = useState('2');
  const [itemCondition, setItemCondition] = useState<ItemCondition>('used_good');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Stock Unsplash Image Presets for premium look
  const imagePresets = [
    {
      nameAr: '⌚ ساعة فاخرة',
      nameEn: '⌚ Watch Luxury',
      url: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800'
    },
    {
      nameAr: '🚗 سيارة رياضية',
      nameEn: '🚗 Sports Car',
      url: 'https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?w=800'
    },
    {
      nameAr: '🏡 عقار ملوكي',
      nameEn: '🏡 Royal Mansion',
      url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800'
    },
    {
      nameAr: '📦 طرد إلكترونات',
      nameEn: '📦 Electronics bundle',
      url: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=800'
    },
    {
      nameAr: '🏺 أعمال عتيقة',
      nameEn: '🏺 Fine Antique',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleAr,
          titleEn,
          descAr,
          descEn,
          category,
          image,
          startPrice: Number(startPrice),
          minIncrement: Number(minIncrement),
          buyoutPrice: buyoutPrice ? Number(buyoutPrice) : undefined,
          durationDays: Number(durationDays),
          softCloseMinutes: Number(softCloseMinutes),
          itemCondition
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.auction?.status === 'pending_approval') {
          setSuccessMsg(t.listingPendingNotice || (lang === 'ar' ? 'تم تقديم المزاد وهو قيد المراجعة من قِبل الإدارة قبل النشر.' : 'Your listing has been submitted and is currently under review by moderation before going live.'));
        } else {
          setSuccessMsg(lang === 'ar' ? 'تهانينا! تم إدراج مزادك الجديد بنجاح وبدء المزايدة الفورية!' : 'Auction published successfully!');
        }
        // Reset
        setTitleAr('');
        setTitleEn('');
        setDescAr('');
        setDescEn('');
        setBuyoutPrice('');
        
        setTimeout(() => {
          onSuccess();
        }, 2200);
      } else {
        setErrorMsg(data.messageAr || 'فشل إدراج السلعة');
      }
    } catch (e) {
      setErrorMsg(lang === 'ar' ? 'فشل إدراج السلعة بالخادم.' : 'Failed to publish details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      
      {/* Title */}
      <div className="border-b border-white/10 pb-5">
        <h2 className="text-xl sm:text-2xl font-serif font-black text-white flex items-center gap-2">
          <Gavel className="h-6 w-6 text-amber-500" />
          <span>{t.createAuction}</span>
        </h2>
        <p className="text-xs font-bold text-slate-400">
          {lang === 'ar' ? 'املأ التفاصيل الفنية لأصولك وابدأ في بيع الممتلكات لأعلى السعر بالضمان الآمن' : 'Fill details to submit your assets and trigger dynamic high auction bidding cycles'}
        </p>
      </div>

      {successMsg && (
        <div className="rounded bg-[#0d0d0f] p-3 border border-amber-500/30 text-amber-500 text-xs font-bold text-right shadow-sm">
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded bg-[#0d0d0f] p-3 border border-rose-500/30 text-rose-400 text-xs font-bold text-right shadow-sm">
          {errorMsg}
        </div>
      )}

      {/* Main creative Form Container */}
      <div className="rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
        
        <form onSubmit={handleSubmit} className="space-y-6 text-slate-200">
          
          {/* Titles row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">اسم السلعة باللغة العربية (الإجباري)</label>
              <input
                type="text"
                required
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: ساعة رولكس دايتونا ذهب عيار 18"
                className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-xs text-white outline-none font-bold focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">اسم السلعة باللغة الإنجليزية</label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Example: Rolex Daytona 18k Yellow Gold"
                className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-xs text-white outline-none font-bold font-mono focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Descriptions row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">وصف تفصيلي للسلعة وشروط الفحص (بالعربية)</label>
              <textarea
                rows={4}
                required
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                placeholder="اكتب هنا كافة تفاصيل الحالة، الضمان، تاريخ الشراء، ومقاييس عيوب الاستعمال إن وجدت..."
                className="w-full bg-[#161618] border border-white/10 rounded p-3 text-xs text-white outline-none leading-relaxed font-semibold focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">Detailed Description (English)</label>
              <textarea
                rows={4}
                required
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Enter complete technical specifications, certification credentials, shipping weights..."
                className="w-full bg-[#161618] border border-white/10 rounded p-3 text-xs text-white outline-none leading-relaxed font-mono focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Category, Condition, Duration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
            
            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">{t.category}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-slate-200 cursor-pointer outline-none focus:border-amber-500/50"
              >
                <option value="ساعات ومجوهرات فاخرة">ساعات ومجوهرات فاخرة</option>
                <option value="سيارات ومحركات">سيارات ومحركات</option>
                <option value="عقارات وأراضي">عقارات وأراضي</option>
                <option value="فنون وأنتيك ملوكي">فنون وأنتيك ملوكي</option>
                <option value="جولات وهواتف ذكية">جولات وهواتف ذكية</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">{t.condition}</label>
              <select
                value={itemCondition}
                onChange={(e) => setItemCondition(e.target.value as ItemCondition)}
                className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-slate-200 cursor-pointer outline-none focus:border-amber-500/50"
              >
                <option value="new">جديد (وكالة)</option>
                <option value="used_excellent">مستعمل ك الجديد الممتاز</option>
                <option value="used_good">مستعمل بحالة جيدة جداً</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">فترة المزاد (بالأيام)</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-slate-200 cursor-pointer outline-none focus:border-amber-500/50"
              >
                <option value="1">يوم واحد (مزاد عاجل)</option>
                <option value="3">3 أيام (سرعة تنافسية)</option>
                <option value="5">5 أيام (تغطية كاملة)</option>
                <option value="7">أسبوع كامل (عقارات وتحف)</option>
              </select>
            </div>

          </div>

          {/* Pricing, increments, buyout row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
            
            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">السعر الافتتاحي المبدئي (SAR)</label>
              <input
                type="number"
                required
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                placeholder="1000"
                className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-xs font-bold text-white outline-none font-mono focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">أقل قفزة مزايدة (الزيادة الكلية)</label>
              <input
                type="number"
                required
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                placeholder="100"
                className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-xs font-bold text-white outline-none font-mono focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">سعر الشراء الفوري الصافي (اختياري)</label>
              <input
                type="number"
                value={buyoutPrice}
                onChange={(e) => setBuyoutPrice(e.target.value)}
                placeholder="خالي لإيقافه"
                className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-xs font-bold text-white outline-none font-mono focus:border-amber-500/50"
              />
            </div>

          </div>

          {/* Imaging Presets Selector */}
          <div className="space-y-3">
            <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block">
              📸 خلفيات وعينات الصور الفاخرة للسلعة
            </label>

            <div className="flex flex-wrap gap-2">
              {imagePresets.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setImage(preset.url)}
                  className={`px-3 py-1.5 cursor-pointer text-xs font-bold rounded border transition-all ${
                    image === preset.url 
                      ? 'bg-amber-500 text-black border-amber-500 shadow-lg' 
                      : 'bg-[#161618] border-white/10 hover:border-amber-500/20 text-slate-300'
                  }`}
                >
                  {lang === 'ar' ? preset.nameAr : preset.nameEn}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">أو أدخل رابط صورتك المخصصة مباشرة</label>
              <input
                type="url"
                required
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-xs font-bold text-white outline-none font-mono focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Soft close configuration details */}
          <div className="flex gap-2.5 p-3 rounded bg-amber-500/5 border border-amber-500/10 text-xs text-slate-300 leading-normal">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold uppercase tracking-wider text-amber-500">🛡️ سياسة الإغلاق المرن ومكافحة قنص المزايدات مفعله تلقائياً!</p>
              <p className="mt-1 font-light text-slate-400">
                في حال وجود أي مزايدات جديدة في آخر دقيقتين للمزاد، يقوم نظام الخادم والاتصال بتمديد وقت الإغلاق بدقيقتين إضافيتين تلقائياً لإتاحة تكافؤ الفرص ومنع قناصي العاصفة.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer py-3 text-sm font-extrabold uppercase tracking-widest text-[#0a0a0b] bg-amber-500 hover:bg-amber-400 rounded transition-colors shadow-lg shadow-amber-500/20"
          >
            {loading ? '...' : t.createAuction}
          </button>

        </form>

      </div>

    </div>
  );
}
