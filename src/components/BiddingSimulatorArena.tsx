/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { translations, Language, Currency, formatPrice } from '../utils/translations';
import { audioSynth } from '../utils/audio';
import { Gavel, Bot, User, Sparkles, RefreshCw, Trophy, AlertCircle } from 'lucide-react';

interface BiddingSimulatorArenaProps {
  lang: Language;
  currency: Currency;
}

export default function BiddingSimulatorArena({
  lang,
  currency
}: BiddingSimulatorArenaProps) {
  const isAr = lang === 'ar';

  const [currentPrice, setCurrentPrice] = useState(1500);
  const [bidsLog, setBidsLog] = useState<Array<{ id: string; bidder: string; amount: number; isUser?: boolean; isBot?: boolean; timestamp: string }>>([
    { id: '1', bidder: isAr ? 'الجامع المحافظ' : 'Conservative Collector Bot', amount: 1500, isBot: true, timestamp: '12:00:00' }
  ]);
  const [userBidInput, setUserBidInput] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [status, setStatus] = useState<'active' | 'user_winning' | 'bot_winning' | 'expired'>('active');

  // Timer Countdown loop
  useEffect(() => {
    let interval: any = null;
    if (status === 'active' || status === 'user_winning' || status === 'bot_winning') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // AI Bot Autobid Reaction simulator
  const triggerBotCounterBid = (userAmount: number) => {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        const botIncrement = 100;
        const botNewBid = userAmount + botIncrement;
        setCurrentPrice(botNewBid);
        setStatus('bot_winning');
        setTimerSeconds((prev) => Math.min(prev + 5, 25)); // Anti-snipe extension

        audioSynth.playOutbidSound();

        setBidsLog((prev) => [
          {
            id: Math.random().toString(),
            bidder: isAr ? 'المزايد الملكي (AI)' : 'Royal Investor (AI Bot)',
            amount: botNewBid,
            isBot: true,
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
      }
    }, 1200);
  };

  const handlePlaceUserBid = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(userBidInput);
    if (isNaN(val) || val <= currentPrice) return;

    setCurrentPrice(val);
    setStatus('user_winning');
    setUserBidInput('');
    audioSynth.playBidPlacedSound();

    setBidsLog((prev) => [
      {
        id: Math.random().toString(),
        bidder: isAr ? 'أنت (المزايد التجريبي)' : 'You (Simulator User)',
        amount: val,
        isUser: true,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);

    triggerBotCounterBid(val);
  };

  const resetArena = () => {
    setCurrentPrice(1500);
    setTimerSeconds(30);
    setStatus('active');
    setBidsLog([
      { id: '1', bidder: isAr ? 'الجامع المحافظ' : 'Conservative Collector Bot', amount: 1500, isBot: true, timestamp: '12:00:00' }
    ]);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 mb-3">
          <Bot className="h-3.5 w-3.5" />
          <span>{isAr ? 'ساحة التدريب والمزايدة التجريبية' : 'Bidding Practice Simulator Arena'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isAr ? 'تجربة المزادات والمزايدة التكتيكية' : 'Interactive Tactical Bidding Simulator'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          {isAr 
            ? 'جرب التنافس والمزايدة ضد روبوتات الذكاء الاصطناعي في الثواني الأخيرة لتعلم مهارات المزايدة الملكية بدون مخاصرة رصيدك الحقيقي.' 
            : 'Practice late-second bidding tactics against simulated AI collectors with zero financial risk.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Arena Simulator Box */}
        <div className="lg:col-span-7 bg-[#121218] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
          
          {/* Price & Timer Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'سعر المزاد التجريبي:' : 'Simulator Price:'}</span>
              <div className="text-3xl font-black font-mono text-amber-400">
                {formatPrice(currentPrice, currency, lang)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'الوقت المتبقي:' : 'Timer Remaining:'}</span>
              <div className={`text-2xl font-black font-mono ${timerSeconds < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-200'}`}>
                00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
              </div>
            </div>
          </div>

          {/* User Status Banner */}
          <div className={`p-3 rounded-xl text-xs font-bold text-center border ${
            status === 'user_winning' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' :
            status === 'bot_winning' ? 'bg-rose-500/15 border-rose-500 text-rose-400' :
            status === 'expired' ? 'bg-amber-500/15 border-amber-500 text-amber-400' : 'bg-white/5 border-white/5 text-slate-300'
          }`}>
            {status === 'user_winning' && (isAr ? '🎉 أنت أعلى مزايد حالياً في الحلبة!' : '🎉 You are currently the highest bidder!')}
            {status === 'bot_winning' && (isAr ? '⚠️ مزايد الذكاء الاصطناعي قام بتقديم مزايدة أعلى منك!' : '⚠️ AI Bot placed a higher bid!')}
            {status === 'expired' && (isAr ? '🏁 انتهى الوقت التجريبي للمزاد!' : '🏁 Simulator timer expired!')}
            {status === 'active' && (isAr ? 'المزاد مستمر - أدخل مزايدتك للتجربة' : 'Auction live - Submit a bid')}
          </div>

          {/* Bid Form Input */}
          <form onSubmit={handlePlaceUserBid} className="flex gap-2">
            <input
              type="number"
              value={userBidInput}
              onChange={(e) => setUserBidInput(e.target.value)}
              placeholder={`${currentPrice + 100}`}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={status === 'expired'}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase cursor-pointer disabled:opacity-50 transition-all"
            >
              {isAr ? 'مزايدة تجريبية' : 'Test Bid'}
            </button>
          </form>

          {/* Reset Button */}
          <button
            onClick={resetArena}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{isAr ? 'إعادة ضبط الحلبة' : 'Reset Arena'}</span>
          </button>

        </div>

        {/* Live Bids Feed Stream */}
        <div className="lg:col-span-5 bg-[#101015] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="text-xs font-extrabold text-amber-500 uppercase tracking-wider border-b border-white/10 pb-2">
            {isAr ? 'سجل المزايدات الحية (Simulator Stream)' : 'Live Bids Stream'}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {bidsLog.map((b) => (
              <div 
                key={b.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  b.isUser 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-white/5 border-white/5 text-slate-300'
                }`}
              >
                <div>
                  <span className="font-bold block">{b.bidder}</span>
                  <span className="text-[9px] font-mono text-slate-500">{b.timestamp}</span>
                </div>

                <span className="font-mono font-extrabold text-amber-400">
                  {formatPrice(b.amount, currency, lang)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
