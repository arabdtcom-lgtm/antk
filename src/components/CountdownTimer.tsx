/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../utils/translations';
import { Clock, Flame, Zap, Radio, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface TimeLeftState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  tenths: number;
  totalSeconds: number;
  totalMs: number;
  isExpired: boolean;
}

/**
 * Calculates remaining time adjusted for server offset.
 */
export function calculateTimeLeftState(endTimeStr: string, serverOffset: number = 0): TimeLeftState {
  const end = new Date(endTimeStr).getTime();
  const now = Date.now() + serverOffset;
  const difference = end - now;

  if (isNaN(end) || difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      tenths: 0,
      totalSeconds: 0,
      totalMs: 0,
      isExpired: true,
    };
  }

  const totalMs = difference;
  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((difference % 1000) / 100);

  return {
    days,
    hours,
    minutes,
    seconds,
    tenths,
    totalSeconds,
    totalMs,
    isExpired: false,
  };
}

/**
 * Plays a soft high-precision web audio click sound for 60s ticking.
 */
function playTickSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      // Browsers require user gesture before playing audio; ignore suspended context
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (_) {
    // Ignore audio permission or context blocks
  }
}

export interface CountdownTimerProps {
  endTime: string;
  createdDate?: string;
  lang: Language;
  variant?: 'details' | 'card-ribbon' | 'card-timer' | 'badge';
  className?: string;
  onEnd?: () => void;
}

export default function CountdownTimer({
  endTime,
  createdDate,
  lang,
  variant = 'details',
  className = '',
  onEnd,
}: CountdownTimerProps) {
  const [serverOffset, setServerOffset] = useState<number>(0);
  const [isServerSynced, setIsServerSynced] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeftState>(() => calculateTimeLeftState(endTime, 0));
  const [tickPulse, setTickPulse] = useState<boolean>(false);
  const lastSecondRef = useRef<number>(-1);

  // 1. Sync with server clock via /api/time endpoint
  useEffect(() => {
    let isMounted = true;
    const syncServerTime = async () => {
      try {
        const start = Date.now();
        const res = await fetch('/api/time');
        if (res.ok) {
          const data = await res.json();
          const latency = Math.floor((Date.now() - start) / 2);
          const computedOffset = (data.serverTime + latency) - Date.now();
          if (isMounted) {
            setServerOffset(computedOffset);
            setIsServerSynced(true);
          }
        }
      } catch (e) {
        // Fallback gracefully to local client time
      }
    };

    syncServerTime();
    const syncInterval = setInterval(syncServerTime, 45000); // Re-sync every 45 seconds
    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  // 2. High precision timer loop (100ms when <=60s, 1000ms otherwise)
  useEffect(() => {
    const updateTimer = () => {
      const updated = calculateTimeLeftState(endTime, serverOffset);
      setTimeLeft(updated);

      if (updated.isExpired) {
        if (onEnd) onEnd();
        return;
      }

      // Ticking animation trigger on integer second changes
      if (updated.seconds !== lastSecondRef.current) {
        lastSecondRef.current = updated.seconds;
        setTickPulse((prev) => !prev);

        if (updated.totalSeconds <= 60 && updated.totalSeconds > 0) {
          playTickSound();
        }
      }
    };

    updateTimer();

    const isUrgent = timeLeft.totalSeconds <= 60 && !timeLeft.isExpired;
    const intervalTime = isUrgent ? 100 : 1000;

    const timer = setInterval(updateTimer, intervalTime);
    return () => clearInterval(timer);
  }, [endTime, serverOffset, onEnd, timeLeft.totalSeconds, timeLeft.isExpired]);

  const { days, hours, minutes, seconds, tenths, totalSeconds, isExpired } = timeLeft;

  const isLessThan60Seconds = !isExpired && totalSeconds > 0 && totalSeconds <= 60;
  const isUrgent = !isExpired && totalSeconds > 0 && totalSeconds <= 300; // < 5 mins
  const isEndingSoon = !isExpired && totalSeconds > 0 && totalSeconds <= 3600; // < 1 hr

  // Calculate percentage remaining if createdDate is provided
  let percentRemaining = 100;
  if (createdDate && !isExpired) {
    const start = new Date(createdDate).getTime();
    const end = new Date(endTime).getTime();
    const totalDuration = end - start;
    if (totalDuration > 0) {
      const currentNow = Date.now() + serverOffset;
      const elapsed = currentNow - start;
      const remaining = Math.max(0, totalDuration - elapsed);
      percentRemaining = Math.min(100, Math.max(0, (remaining / totalDuration) * 100));
    }
  }

  // Formatting strings
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  const formattedTimeText = () => {
    if (isExpired) {
      return lang === 'ar' ? 'منتهي ومغلق' : 'Ended';
    }
    if (days > 0) {
      return lang === 'ar'
        ? `${days}ي ${formattedHours}:${formattedMinutes}:${formattedSeconds}`
        : `${days}d ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
    if (isLessThan60Seconds) {
      return `${formattedSeconds}.${tenths}s`;
    }
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  // -------------------------------------------------------------
  // VARIANT 1: Details View (Full Featured Card for AuctionDetails)
  // -------------------------------------------------------------
  if (variant === 'details') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Status Header & Server Sync Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
            <Clock
              className={`h-4 w-4 ${
                isExpired
                  ? 'text-slate-500'
                  : isLessThan60Seconds
                  ? 'text-red-500 animate-bounce'
                  : isUrgent
                  ? 'text-rose-400 animate-pulse'
                  : 'text-amber-500'
              }`}
            />
            <span>
              {isExpired
                ? lang === 'ar'
                  ? 'انتهى باب المزايدة:'
                  : 'Bidding Closed:'
                : lang === 'ar'
                ? 'الوقت المتبقي لانتهاء المزاد:'
                : 'Time Remaining:'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Server Sync Indicator */}
            {isServerSynced && (
              <span 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 font-bold"
                title={lang === 'ar' ? 'الوقت متزامن بدقة متناهية مع توقيت الخادم' : 'Synchronized precisely with server NTP clock'}
              >
                <Zap className="h-2.5 w-2.5 text-emerald-400 animate-pulse" />
                <span>{lang === 'ar' ? 'توقيت خادم متزامن ⚡' : 'Server Synced ⚡'}</span>
              </span>
            )}

            {isExpired ? (
              <span className="rounded bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-400 border border-rose-500/20">
                {lang === 'ar' ? 'مغلق' : 'Closed'}
              </span>
            ) : isLessThan60Seconds ? (
              <span className="rounded bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse flex items-center gap-1">
                <Radio className="h-3 w-3 animate-spin text-white" />
                <span>{lang === 'ar' ? '🚨 اللحظات الأخيرة' : '🚨 TICKING FINAL SECONDS'}</span>
              </span>
            ) : isUrgent ? (
              <span className="rounded bg-red-500/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-red-400 border border-red-500/30 animate-pulse">
                {lang === 'ar' ? '⚠️ حرج للغاية' : '⚠️ Urgent'}
              </span>
            ) : (
              <span className="rounded bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                {lang === 'ar' ? 'نشط' : 'Live'}
              </span>
            )}
          </div>
        </div>

        {/* Real-time Digital Countdown Cards with Ticking Animation */}
        {!isExpired ? (
          <div className="relative">
            {/* Ticking Radar Ring when in last 60 seconds */}
            {isLessThan60Seconds && (
              <motion.div
                key={`radar-ring-${seconds}`}
                initial={{ scale: 0.98, opacity: 0.8 }}
                animate={{ scale: 1.03, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute -inset-1.5 rounded-2xl bg-red-500/30 pointer-events-none border border-red-500/60"
              />
            )}

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 text-center relative z-10">
              {/* Days */}
              <div className="rounded-xl bg-black/60 p-2.5 border border-white/10 shadow-inner">
                <span className="block font-mono text-xl sm:text-2xl font-black text-white">
                  {String(days).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block mt-0.5">
                  {lang === 'ar' ? 'يوم' : 'Days'}
                </span>
              </div>

              {/* Hours */}
              <div className="rounded-xl bg-black/60 p-2.5 border border-white/10 shadow-inner">
                <span className="block font-mono text-xl sm:text-2xl font-black text-white">
                  {formattedHours}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block mt-0.5">
                  {lang === 'ar' ? 'ساعة' : 'Hours'}
                </span>
              </div>

              {/* Minutes */}
              <div
                className={`rounded-xl p-2.5 border shadow-inner transition-all duration-300 ${
                  isLessThan60Seconds || isUrgent
                    ? 'bg-red-950/40 border-red-500/50'
                    : 'bg-black/60 border-white/10'
                }`}
              >
                <span
                  className={`block font-mono text-xl sm:text-2xl font-black ${
                    isLessThan60Seconds || isUrgent ? 'text-red-400 animate-pulse' : 'text-amber-500'
                  }`}
                >
                  {formattedMinutes}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block mt-0.5">
                  {lang === 'ar' ? 'دقيقة' : 'Minutes'}
                </span>
              </div>

              {/* Seconds with Ticking Animation & Precision Tenths */}
              <div
                className={`rounded-xl p-2.5 border shadow-inner transition-all duration-200 overflow-hidden relative ${
                  isLessThan60Seconds
                    ? 'bg-gradient-to-b from-red-950/80 to-red-900/60 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                    : isUrgent
                    ? 'bg-red-950/40 border-red-500/50'
                    : 'bg-black/60 border-white/10'
                }`}
              >
                <div className="flex items-baseline justify-center gap-0.5">
                  <motion.span
                    key={`sec-${seconds}`}
                    initial={isLessThan60Seconds ? { scale: 1.25, color: '#ffffff' } : false}
                    animate={{ scale: 1, color: isLessThan60Seconds ? '#f87171' : '#f59e0b' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`block font-mono text-xl sm:text-2xl font-black ${
                      isLessThan60Seconds
                        ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                        : isUrgent
                        ? 'text-red-400'
                        : 'text-amber-500'
                    }`}
                  >
                    {formattedSeconds}
                  </motion.span>
                  
                  {/* High precision sub-second indicator when under 60 seconds */}
                  {isLessThan60Seconds && (
                    <span className="font-mono text-xs font-extrabold text-amber-300">
                      .{tenths}s
                    </span>
                  )}
                </div>

                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block mt-0.5">
                  {lang === 'ar' ? 'ثانية' : 'Seconds'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-rose-950/20 p-3.5 border border-rose-900/30 text-center space-y-1">
            <p className="text-xs font-extrabold text-rose-400">
              {lang === 'ar'
                ? 'تم إغلاق المزاد بنجاح ولا يقبل مزايدات إضافية'
                : 'Bidding is now closed for this auction asset.'}
            </p>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 2: Card Ribbon (Top Overlay Ribbon on AuctionCard)
  // -------------------------------------------------------------
  if (variant === 'card-ribbon') {
    return (
      <div className="relative w-full overflow-hidden">
        <div
          className={`w-full flex items-center justify-between gap-1 px-3 py-1.5 text-[10px] sm:text-[11px] font-medium text-white transition-all ${
            isLessThan60Seconds
              ? 'bg-gradient-to-r from-red-800 via-red-600 to-red-800 animate-pulse font-black tracking-widest shadow-[0_-4px_15px_rgba(239,68,68,0.9)] border-t-2 border-red-400'
              : isUrgent
              ? 'bg-gradient-to-r from-red-700 via-rose-700 to-red-700 font-black shadow-[inset_0_0_10px_rgba(239,68,68,0.5)]'
              : isEndingSoon
              ? 'bg-gradient-to-r from-rose-900 to-amber-900 font-bold'
              : 'bg-[#0d0d0f]/90 backdrop-blur-md'
          } ${className}`}
        >
          <div className="flex items-center gap-1.5">
            {isLessThan60Seconds ? (
              <Flame className="h-3.5 w-3.5 text-white animate-bounce shrink-0" />
            ) : isUrgent ? (
              <Flame className="h-3.5 w-3.5 text-red-300 animate-pulse shrink-0" />
            ) : isEndingSoon ? (
              <Flame className="h-3.5 w-3.5 text-amber-300 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
            )}
            <span className="font-mono tracking-widest font-extrabold flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-wider text-amber-200/80 font-sans hidden xs:inline">
                {lang === 'ar' ? 'الوقت المتبقي:' : 'Time Left:'}
              </span>
              {isLessThan60Seconds ? (
                <span className="text-red-100 uppercase tracking-wide font-black flex items-center gap-1.5">
                  <span>{lang === 'ar' ? '🚨 اللحظات الأخيرة:' : '🚨 FINAL SECONDS:'}</span>
                  <motion.span 
                    key={seconds}
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    className="bg-black/90 text-red-300 px-2 py-0.5 rounded border border-red-400 font-mono font-black shadow-lg"
                  >
                    {formattedTimeText()}
                  </motion.span>
                </span>
              ) : (
                <span className="font-mono font-black text-amber-300 drop-shadow-sm">
                  {formattedTimeText()}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isServerSynced && (
              <Zap className="h-3 w-3 text-emerald-400 shrink-0" title="Server Synced" />
            )}
            <span className={`inline-block h-2 w-2 rounded-full ${tickPulse ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-400/30'}`} />
            {isLessThan60Seconds && (
              <span className="text-[9px] uppercase bg-red-600 text-white font-extrabold px-2 py-0.5 rounded animate-bounce shadow-md">
                {lang === 'ar' ? 'تكتكة!' : 'TICKING!'}
              </span>
            )}
          </div>
        </div>

        {/* Live Remaining Time Progress Bar */}
        {!isExpired && (
          <div className="w-full h-1 bg-black/60 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isLessThan60Seconds
                  ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                  : isUrgent
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-amber-600 to-amber-400'
              }`}
              style={{ width: `${percentRemaining}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 3: Card Timer Box (Pricing Section on AuctionCard)
  // -------------------------------------------------------------
  if (variant === 'card-timer') {
    return (
      <div
        className={`flex flex-col items-end text-right rounded-lg px-2.5 py-1.5 min-w-[130px] transition-all duration-300 ${
          isLessThan60Seconds
            ? 'bg-red-950/90 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] ring-1 ring-red-500/60'
            : isUrgent
            ? 'bg-red-950/40 border border-red-500/40'
            : 'bg-white/[0.04] border border-white/10 hover:border-amber-500/30'
        } ${className}`}
      >
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
          <Clock
            className={`w-3 h-3 shrink-0 ${
              isLessThan60Seconds ? 'text-red-400 animate-bounce' : 'text-amber-400 animate-pulse'
            }`}
          />
          <span>{lang === 'ar' ? 'الوقت المتبقي' : 'Time Remaining'}</span>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${tickPulse ? 'bg-amber-400' : 'bg-transparent'}`} />
        </div>

        <div
          className={`font-mono text-xs sm:text-sm font-black tracking-wider mt-0.5 flex items-center gap-1.5 ${
            isExpired
              ? 'text-slate-500'
              : isLessThan60Seconds
              ? 'text-red-300 scale-105 font-black drop-shadow-[0_0_10px_rgba(239,68,68,1)]'
              : isUrgent
              ? 'text-red-400 animate-pulse'
              : isEndingSoon
              ? 'text-rose-400'
              : 'text-amber-400'
          }`}
        >
          {isLessThan60Seconds && <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce shrink-0" />}
          <motion.span
            key={isLessThan60Seconds ? seconds : undefined}
            initial={isLessThan60Seconds ? { scale: 1.15 } : false}
            animate={{ scale: 1 }}
            className="font-mono"
          >
            {formattedTimeText()}
          </motion.span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 4: Default Badge
  // -------------------------------------------------------------
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-bold px-2.5 py-1 rounded-full text-xs border ${
        isExpired
          ? 'bg-slate-900 border-white/10 text-slate-500'
          : isLessThan60Seconds
          ? 'bg-red-950 border-red-500 text-red-300 animate-pulse shadow-md'
          : isUrgent
          ? 'bg-red-950/50 border-red-500/40 text-red-400 animate-pulse'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      } ${className}`}
    >
      <Clock className="w-3 h-3 shrink-0 text-amber-400" />
      <span>{formattedTimeText()}</span>
      {isServerSynced && <Zap className="w-2.5 h-2.5 text-emerald-400" title="Server Synced" />}
    </span>
  );
}
