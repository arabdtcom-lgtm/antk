import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Gavel, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Flame,
  Award
} from 'lucide-react';
import { Auction, User, Bid } from '../types';
import { formatPrice, Currency, Language } from '../utils/translations';
import BidConfirmationModal from './BidConfirmationModal';
import { placeBidInFirestore, db } from '../utils/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { audioSynth } from '../utils/audio';

interface LiveAuctionOverlayProps {
  initialAuction: Auction;
  allAuctions: Auction[];
  lang: Language;
  currency: Currency;
  user: User | null;
  onClose: () => void;
  onBidSuccess?: () => void;
}

export default function LiveAuctionOverlay({
  initialAuction,
  allAuctions,
  lang,
  currency,
  user,
  onClose,
  onBidSuccess
}: LiveAuctionOverlayProps) {
  const isAr = lang === 'ar';
  const [currentAuction, setCurrentAuction] = useState<Auction>(initialAuction);
  const [muted, setMuted] = useState(false);
  const [customBidAmount, setCustomBidAmount] = useState<string>('');
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccessPulse, setBidSuccessPulse] = useState(false);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioSynth.setMuted(nextMuted);
  };

  // Real-time Firestore sync for current auction
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'auctions', currentAuction.id), (docSnap) => {
      if (docSnap.exists()) {
        const updated = docSnap.data() as Auction;
        if (updated.currentPrice > currentAuction.currentPrice) {
          audioSynth.playBidPlacedSound();
          setBidSuccessPulse(true);
          setTimeout(() => setBidSuccessPulse(false), 1200);
        }
        setCurrentAuction(updated);
      }
    });

    return () => unsub();
  }, [currentAuction.id]);

  // Real-time Countdown calculation
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const updateCountdown = () => {
      const end = new Date(currentAuction.endTime).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentAuction.endTime]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBidValue, setPendingBidValue] = useState<number>(0);

  // Handle Quick Bidding (Triggers Confirmation Modal)
  const handlePlaceBid = (bidValue: number) => {
    if (!user) {
      setBidError(isAr ? 'برجاء تسجيل الدخول أولاً للمزايدة المباشرة' : 'Please sign in to place a bid');
      return;
    }

    if (bidValue <= currentAuction.currentPrice) {
      setBidError(isAr ? 'يجب أن تكون المزايدة أعلى من السعر الحالي' : 'Bid must be higher than current price');
      return;
    }

    setBidError('');
    setPendingBidValue(bidValue);
    setShowConfirmModal(true);
  };

  // Submit confirmed live bid
  const executeConfirmedLiveBid = async () => {
    setShowConfirmModal(false);
    setBidding(true);
    setBidError('');

    try {
      const success = await placeBidInFirestore(currentAuction.id, pendingBidValue, user);
      if (success) {
        audioSynth.playBidPlacedSound();
        setBidSuccessPulse(true);
        setTimeout(() => setBidSuccessPulse(false), 1500);
        setCustomBidAmount('');
        if (onBidSuccess) onBidSuccess();
      } else {
        setBidError(isAr ? 'تعذر تسجيل المزايدة، حاول مجدداً' : 'Failed to place bid, please retry');
      }
    } catch (err: any) {
      setBidError(err?.message || (isAr ? 'حدث خطأ غير متوقع' : 'Unexpected error'));
    } finally {
      setBidding(false);
    }
  };

  const activeAuctions = allAuctions.filter(a => a.status === 'active');
  const minNextBid = currentAuction.currentPrice + (currentAuction.minIncrement || 10);
  const quickBidIncrements = [
    currentAuction.minIncrement || 10,
    (currentAuction.minIncrement || 10) * 2,
    (currentAuction.minIncrement || 10) * 5,
    (currentAuction.minIncrement || 10) * 10
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-[100] bg-[#070709] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-transparent animate-pulse" />
      
      {bidSuccessPulse && (
        <motion.div 
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 border-8 border-amber-500/60 rounded-none pointer-events-none z-50 shadow-[inset_0_0_100px_rgba(245,158,11,0.5)]"
        />
      )}

      {/* ─── 1. TOP CONTROL BAR ────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-red-600/20 border border-red-500/40 px-3 py-1 rounded-full animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs font-black tracking-widest uppercase text-red-400">
              {isAr ? '🔴 بث حي مباشر' : '🔴 LIVE AUCTION'}
            </span>
          </div>
          <h2 className="hidden md:block text-sm font-bold text-slate-300 truncate max-w-md">
            {isAr ? currentAuction.titleAr : currentAuction.titleEn}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
            title={muted ? 'تشغيل أصوات المزاد' : 'كتم أصوات المزاد'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-600 text-red-400 hover:text-white transition-all cursor-pointer font-bold text-xs"
          >
            <X className="w-4 h-4" />
            <span>{isAr ? 'إنهاء البث' : 'Exit Live'}</span>
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN LIVE STAGE ────────────────────────────────────── */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full items-center">
        
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border-2 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] bg-black/60 group">
            <img 
              src={currentAuction.image} 
              alt={currentAuction.titleAr} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-4 left-4 right-4 text-right space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                {currentAuction.category}
              </span>
              <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
                {isAr ? currentAuction.titleAr : currentAuction.titleEn}
              </h3>
            </div>
          </div>
        </div>

        {/* Right Column: Giant Timer & Live Bidding Console */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          
          {/* GIANT COUNTDOWN DISPLAY */}
          <div className="bg-[#0d0d12] border border-amber-500/30 rounded-3xl p-6 text-center space-y-3 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase text-slate-400 tracking-wider">
              <Clock className="w-4 h-4 text-amber-500 animate-spin" />
              <span>{isAr ? 'الوقت المتبقي لإغلاق المزاد' : 'Time Remaining'}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto font-mono">
              <div className="bg-black/60 border border-white/10 rounded-2xl p-3">
                <span className="text-3xl lg:text-4xl font-black text-amber-400">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-slate-500 font-sans">{isAr ? 'يوم' : 'Days'}</span>
              </div>
              <div className="bg-black/60 border border-white/10 rounded-2xl p-3">
                <span className="text-3xl lg:text-4xl font-black text-amber-400">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-slate-500 font-sans">{isAr ? 'ساعة' : 'Hours'}</span>
              </div>
              <div className="bg-black/60 border border-white/10 rounded-2xl p-3">
                <span className="text-3xl lg:text-4xl font-black text-amber-400">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-slate-500 font-sans">{isAr ? 'دقيقة' : 'Mins'}</span>
              </div>
              <div className="bg-black/60 border border-amber-500/40 rounded-2xl p-3 bg-amber-500/5">
                <span className="text-3xl lg:text-4xl font-black text-red-500 animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="block text-[10px] text-red-400 font-sans">{isAr ? 'ثانية' : 'Secs'}</span>
              </div>
            </div>
          </div>

          {/* CURRENT PRICE & HIGH BIDDER */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/40 rounded-3xl p-6 text-center space-y-2">
            <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
              {isAr ? 'السعر الحالي المباشر' : 'CURRENT HIGHEST BID'}
            </span>
            <div className="text-4xl lg:text-5xl font-black text-white font-mono tracking-tight">
              {formatPrice(currentAuction.currentPrice, currency, lang)}
            </div>
            {currentAuction.highBidderName && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-bold pt-1">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{isAr ? `أعلى مزايد حالياً: ${currentAuction.highBidderName}` : `Highest Bidder: ${currentAuction.highBidderName}`}</span>
              </div>
            )}
          </div>

          {/* QUICK BIDDING ACTIONS */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-400 text-center">
              {isAr ? '⚡ مزايدة سريعة بنقرة واحدة' : '⚡ One-Tap Instant Bids'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickBidIncrements.map((inc, i) => {
                const targetPrice = currentAuction.currentPrice + inc;
                return (
                  <button
                    key={i}
                    onClick={() => handlePlaceBid(targetPrice)}
                    disabled={bidding || timeLeft.isExpired}
                    className="py-3 px-2 rounded-2xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-0.5"
                  >
                    <span className="text-[10px] opacity-80">+{inc} $</span>
                    <span className="text-sm">{formatPrice(targetPrice, currency, lang)}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Bid Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="number"
                value={customBidAmount}
                onChange={(e) => setCustomBidAmount(e.target.value)}
                placeholder={isAr ? `أدخل مبلغا أكبر من ${minNextBid} $` : `Min bid ${minNextBid} $`}
                className="flex-1 px-4 py-3 bg-black/60 border border-white/20 rounded-2xl text-white text-xs font-mono outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handlePlaceBid(Number(customBidAmount))}
                disabled={bidding || !customBidAmount || Number(customBidAmount) < minNextBid}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-2xl hover:brightness-110 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <Gavel className="w-4 h-4" />
                <span>{isAr ? 'مزايدة' : 'Bid'}</span>
              </button>
            </div>

            {bidError && (
              <p className="text-xs text-red-400 text-center font-bold animate-shake">
                ⚠️ {bidError}
              </p>
            )}
          </div>

        </div>
      </main>

      {/* ─── 3. BOTTOM ACTIVE AUCTION SWITCHER CAROUSEL ────────────── */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 p-3 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-[11px] font-bold text-amber-400 whitespace-nowrap hidden sm:inline">
            {isAr ? 'مزادات مباشرة أخرى:' : 'Other Live Auctions:'}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1">
            {activeAuctions.map((auc, idx) => {
              const isSelected = auc.id === currentAuction.id;
              return (
                <button
                  key={`live-auc-${auc.id}-${idx}`}
                  onClick={() => setCurrentAuction(auc)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <img src={auc.image} alt="" className="w-6 h-6 rounded-md object-cover" />
                  <span className="text-xs font-bold truncate max-w-[120px]">
                    {isAr ? auc.titleAr : auc.titleEn}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {formatPrice(auc.currentPrice, currency, lang)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </footer>

      {/* Bid Confirmation Modal */}
      <BidConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeConfirmedLiveBid}
        bidAmount={pendingBidValue}
        currentPrice={currentAuction.currentPrice}
        auctionTitle={isAr ? currentAuction.titleAr : currentAuction.titleEn}
        auctionImage={currentAuction.image}
        currency={currency}
        lang={lang}
        loading={bidding}
      />
    </motion.div>
  );
}
