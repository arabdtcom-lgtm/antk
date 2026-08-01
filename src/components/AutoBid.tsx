import React, { useState, useEffect } from 'react';
import { Bot, Zap, Check, AlertCircle, Settings } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface AutoBidProps {
  auctionId: string;
  currentPrice: number;
  lang: 'ar' | 'en';
  user: User | null;
  highBidder?: string;
  onAutoBid?: (amount: number) => void;
}

interface AutoBidState {
  maxBid: number;
  enabled: boolean;
}

export default function AutoBid({ auctionId, currentPrice, lang, user, highBidder, onAutoBid }: AutoBidProps) {
  const [maxBid, setMaxBid] = useState<number | ''>('');
  const [enabled, setEnabled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const STORAGE_KEY = 'antkawy_autobids';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[auctionId]) {
          setMaxBid(parsed[auctionId].maxBid);
          setEnabled(parsed[auctionId].enabled);
        }
      }
    } catch (e) {
      console.error('Failed to load auto-bid settings', e);
    }
  }, [auctionId]);

  useEffect(() => {
    if (!enabled || typeof maxBid !== 'number') return;
    
    // Auto-bid logic: only trigger if the CURRENT HIGHEST BIDDER is NOT the user
    const timer = setInterval(() => {
      const isUserAlreadyHighBidder = user?.email && highBidder && highBidder.trim().toLowerCase() === user.email.trim().toLowerCase();
      if (enabled && currentPrice < maxBid && !isUserAlreadyHighBidder) {
        const nextBid = currentPrice + 100;
        if (nextBid <= maxBid) {
          if (onAutoBid) {
            onAutoBid(nextBid);
          }
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(timer);
  }, [enabled, maxBid, currentPrice, highBidder, user?.email, onAutoBid]);

  const handleSave = () => {
    if (!user) {
      alert(lang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must log in first');
      return;
    }
    if (typeof maxBid !== 'number' || maxBid <= currentPrice) {
      alert(lang === 'ar' ? 'يجب أن يكون الحد الأقصى أعلى من السعر الحالي' : 'Max bid must be higher than current price');
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      
      parsed[auctionId] = { maxBid, enabled };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save auto-bid', e);
    }
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} className="bg-[#161618] border border-white/10 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/20 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-white font-bold text-lg">
            {lang === 'ar' ? 'المزايدة الآلية (Auto-Bid)' : 'Auto-Bid System'}
          </h3>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-white transition-colors p-2"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {(isOpen || enabled) && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-sm text-slate-400">
            {lang === 'ar' 
              ? 'قم بتعيين الحد الأقصى للمزايدة وسيقوم النظام بالمزايدة نيابة عنك تلقائياً.' 
              : 'Set your maximum bid and the system will automatically bid on your behalf.'}
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm text-slate-400 mb-2">
                {lang === 'ar' ? 'الحد الأقصى (ر.س)' : 'Maximum Bid (SAR)'}
              </label>
              <input
                type="number"
                value={maxBid}
                onChange={(e) => setMaxBid(e.target.value ? Number(e.target.value) : '')}
                placeholder={lang === 'ar' ? 'مثال: 50000' : 'e.g. 50000'}
                className="w-full bg-[#0d0d0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 bg-[#0d0d0f] border border-white/10 rounded-xl px-4 py-3 h-[50px]">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ms-3 text-sm font-medium text-white">
                  {enabled 
                    ? (lang === 'ar' ? 'مفعل' : 'Enabled') 
                    : (lang === 'ar' ? 'معطل' : 'Disabled')}
                </span>
              </label>
            </div>

            <button
              onClick={handleSave}
              className="h-[50px] px-6 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors w-full md:w-auto"
            >
              {isSaved ? <Check className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              <span>{lang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</span>
            </button>
          </div>

          {enabled && typeof maxBid === 'number' && (
            <div className="flex items-start gap-3 mt-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-500/90 leading-relaxed">
                {lang === 'ar' 
                  ? `النظام نشط. سيتم المزايدة تلقائياً حتى ${maxBid.toLocaleString()} ر.س.`
                  : `System active. Will automatically bid up to ${maxBid.toLocaleString()} SAR.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
