/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Sparkles, CheckCircle2, ShieldCheck, Volume2, X, PartyPopper } from 'lucide-react';
import { Language, Currency, formatPrice } from '../utils/translations';
import { audioSynth } from '../utils/audio';

export interface VictoryCelebrationEffectProps {
  isWinner: boolean;
  auctionTitle: string;
  winningBidAmount: number;
  currency: Currency;
  lang: Language;
  onProceedToCheckout?: () => void;
  showTopBidConfetti?: boolean;
  onConfettiClose?: () => void;
}

// Generate deterministic confetti particle positions for framer-motion
interface ConfettiParticle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  shape: 'rect' | 'circle' | 'ribbon';
}

const CONFETTI_COLORS = [
  '#F59E0B', // Amber
  '#EAB308', // Gold
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#F43F5E', // Rose
];

export default function VictoryCelebrationEffect({
  isWinner,
  auctionTitle,
  winningBidAmount,
  currency,
  lang,
  onProceedToCheckout,
  showTopBidConfetti = false,
  onConfettiClose,
}: VictoryCelebrationEffectProps) {
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const [activeTopBidConfetti, setActiveTopBidConfetti] = useState(false);

  const isAr = lang === 'ar';

  // Trigger celebration on initial win state
  useEffect(() => {
    if (isWinner) {
      setShowCelebrationModal(true);
      if (!hasPlayedSound) {
        audioSynth.playWinSound();
        setHasPlayedSound(true);
      }
    }
  }, [isWinner]);

  // Trigger confetti when placing a top bid
  useEffect(() => {
    if (showTopBidConfetti) {
      setActiveTopBidConfetti(true);
      setConfettiKey((prev) => prev + 1);
      audioSynth.playWinSound();

      const timer = setTimeout(() => {
        setActiveTopBidConfetti(false);
        if (onConfettiClose) onConfettiClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [showTopBidConfetti]);

  const handleReplayCelebration = () => {
    setConfettiKey((prev) => prev + 1);
    audioSynth.playWinSound();
    if (isWinner) {
      setShowCelebrationModal(true);
    } else {
      setActiveTopBidConfetti(true);
      setTimeout(() => setActiveTopBidConfetti(false), 4500);
    }
  };

  if (!isWinner && !showCelebrationModal && !activeTopBidConfetti && !showTopBidConfetti) {
    return null;
  }

  // Generate 45 confetti particles for motion animation
  const confettiParticles: ConfettiParticle[] = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    x: (i * 2.2) % 100 - 50, // -50vw to +50vw offset
    delay: (i % 10) * 0.1,
    duration: 2.5 + (i % 5) * 0.4,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 8 + (i % 7) * 2,
    rotate: (i * 37) % 360,
    shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'ribbon' : 'rect',
  }));

  return (
    <div className="w-full my-6">
      {/* 1. Confetti Raining Particle Overlay (Rendered when modal or top bid celebration is active) */}
      <AnimatePresence>
        {(showCelebrationModal || activeTopBidConfetti || showTopBidConfetti) && (
          <div
            key={`confetti-overlay-${confettiKey}`}
            className="fixed inset-0 pointer-events-none z-[200] overflow-hidden flex justify-center items-start"
          >
            {confettiParticles.map((particle) => (
              <motion.div
                key={`p-${particle.id}-${confettiKey}`}
                initial={{
                  y: -50,
                  x: `${particle.x}vw`,
                  opacity: 1,
                  rotate: particle.rotate,
                  scale: 0.8,
                }}
                animate={{
                  y: '105vh',
                  x: `${particle.x + ((particle.id % 2 === 0 ? 1 : -1) * 12)}vw`,
                  opacity: [1, 1, 0.8, 0],
                  rotate: particle.rotate + 720,
                  scale: [0.8, 1.2, 0.9],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: [0.25, 0.1, 0.25, 1],
                  repeat: 0,
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  backgroundColor: particle.color,
                  width: particle.shape === 'ribbon' ? particle.size * 0.4 : particle.size,
                  height: particle.shape === 'ribbon' ? particle.size * 2.5 : particle.size,
                  borderRadius: particle.shape === 'circle' ? '50%' : '2px',
                  boxShadow: `0 0 10px ${particle.color}aa`,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 1.5 Top Bid Celebratory Toast Banner Overlay */}
      <AnimatePresence>
        {(activeTopBidConfetti || showTopBidConfetti) && !isWinner && (
          <motion.div
            initial={{ y: -80, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[210] pointer-events-auto shadow-2xl"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-[#0c0c10]/95 border-2 border-amber-500/80 text-white shadow-[0_0_50px_rgba(245,158,11,0.6)] backdrop-blur-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 shrink-0">
                <PartyPopper className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    {isAr ? 'مزايدة أعلى جديدة' : 'TOP BIDDER'}
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-spin" />
                </div>
                <h4 className="text-sm font-serif font-black text-white mt-0.5">
                  {isAr ? '🎉 تهانينا! أنت الآن صاحب أعلى مزايدة!' : '🎉 Congratulations! You are now the High Bidder!'}
                </h4>
                <p className="text-[11px] text-amber-200/90 font-mono mt-0.5">
                  {isAr ? 'أعلى مزايدة حالية:' : 'Current Highest Bid:'}{' '}
                  <strong className="text-amber-400 font-extrabold">{formatPrice(winningBidAmount, currency, lang)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTopBidConfetti(false);
                  if (onConfettiClose) onConfettiClose();
                }}
                className="ml-2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Interactive Full Victory Celebration Popup Modal */}
      <AnimatePresence>
        {showCelebrationModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Dark Backdrop with Golden Radial Burst */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCelebrationModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent animate-pulse" />
            </motion.div>

            {/* Victory Modal Box */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-[#0c0c10] p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.3)] text-white"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Close Modal Button */}
              <button
                type="button"
                onClick={() => setShowCelebrationModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Animated Floating Crown & Trophy Icon */}
              <div className="relative mx-auto my-2 w-24 h-24 flex items-center justify-center">
                {/* Rotating Glowing Golden Rays */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-amber-600/30 blur-md"
                />

                {/* Pulsing Back Ring */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                />

                {/* Crown & Trophy Group */}
                <motion.div
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: [ -5, 5, -5 ], scale: [ 1, 1.08, 1 ] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative flex items-center justify-center text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                >
                  <Trophy className="h-12 w-12 text-amber-400" />
                  <Crown className="absolute -top-3 -right-2 h-7 w-7 text-yellow-300 animate-bounce" />
                </motion.div>
              </div>

              {/* Victory Badge */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest my-2"
              >
                <PartyPopper className="h-3.5 w-3.5 animate-bounce" />
                <span>{isAr ? 'انتصار تاريخي في المزاد' : 'VICTORY! AUCTION WON'}</span>
                <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-spin" />
              </motion.div>

              {/* Title & Congratulations */}
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 mt-2"
              >
                {isAr ? 'مُبارك! لقد فزت بهذا المزاد بنجاح 🎉' : 'Congratulations! You Won The Auction 🎉'}
              </motion.h2>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-xs sm:text-sm text-slate-300 mt-2 font-light line-clamp-2 px-4"
              >
                {auctionTitle}
              </motion.p>

              {/* Winning Amount Showcase Card */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-5 rounded-2xl bg-gradient-to-b from-amber-500/15 to-amber-950/30 p-4 border border-amber-500/30 shadow-inner"
              >
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300/80 block">
                  {isAr ? 'قيمة المزايدة الرابحة النهائية' : 'Winning Hammer Price'}
                </span>
                <span className="font-mono text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] mt-1 block">
                  {formatPrice(winningBidAmount, currency, lang)}
                </span>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 mt-2 border-t border-amber-500/20 pt-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{isAr ? 'تم قفل ملكية التحفة بحسابك بنجاح' : 'Ownership secured and locked in your profile'}</span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                {/* Replay Sound & Celebration Button */}
                <button
                  type="button"
                  onClick={handleReplayCelebration}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Volume2 className="h-4 w-4 text-amber-400" />
                  <span>{isAr ? 'إعادة الاحتفال 🎉' : 'Replay Celebration 🎉'}</span>
                </button>

                {/* Primary Proceed Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCelebrationModal(false);
                    if (onProceedToCheckout) onProceedToCheckout();
                  }}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black text-xs font-black uppercase tracking-wider hover:brightness-110 shadow-lg shadow-amber-500/30 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isAr ? 'استكمال الاستلام والشحن' : 'Proceed to Checkout'}</span>
                </button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Permanent On-Page Victory Card Banner in AuctionDetails */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-[#18150c] via-[#121118] to-[#18150c] p-5 shadow-xl shadow-amber-500/10"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 h-32 w-32 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <motion.div
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-md shrink-0"
            >
              <Trophy className="h-6 w-6" />
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/30">
                  {isAr ? 'الفائز النهائي' : 'WINNER'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {formatPrice(winningBidAmount, currency, lang)}
                </span>
              </div>
              <h3 className="text-base font-serif font-black text-amber-300 mt-1">
                🏆 {isAr ? 'تهانينا! أنت الفائز بهذا المزاد' : 'Congratulations! You won this auction'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 font-light">
                {isAr
                  ? 'تم إرساء السلعة عليك. يمكنك تشغيل الاحتفال أو الانتقال لإتمام عملية الدفع والشحن.'
                  : 'The asset has been awarded to you. You can trigger the celebration anytime or proceed to settlement.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <button
              type="button"
              onClick={handleReplayCelebration}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <PartyPopper className="h-4 w-4" />
              <span>{isAr ? 'الاحتفال 🎉' : 'Celebrate 🎉'}</span>
            </button>

            {onProceedToCheckout && (
              <button
                type="button"
                onClick={onProceedToCheckout}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isAr ? 'الدفع والشحن' : 'Checkout'}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
