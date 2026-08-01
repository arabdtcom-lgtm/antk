/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Auction } from '../types';
import { Language, translations } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Gavel,
  AlertCircle
} from 'lucide-react';

interface AuctionCalendarProps {
  auctions: Auction[];
  lang: Language;
  onSelectAuction: (auction: Auction) => void;
}

export default function AuctionCalendar({ auctions, lang, onSelectAuction }: AuctionCalendarProps) {
  const t = translations[lang];
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = useMemo(() => {
    if (lang === 'ar') {
      return [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
    }
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }, [lang]);

  const daysOfWeek = useMemo(() => {
    if (lang === 'ar') {
      return ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
    }
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [lang]);

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  const calendarDays = useMemo(() => {
    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, date: null });
    }
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        day: i, 
        date: new Date(year, month, i) 
      });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOfMonth]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const getAuctionsForDate = (date: Date | null) => {
    if (!date) return [];
    return auctions.filter(auc => {
      const start = new Date(auc.createdDate);
      const end = new Date(auc.endTime);
      
      // Normalize dates to compare only Y-M-D
      const startYMD = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endYMD = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const targetYMD = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      return targetYMD.getTime() === startYMD.getTime() || targetYMD.getTime() === endYMD.getTime();
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/20 via-[#0d0d0f] to-[#0d0d0f] border border-amber-500/20 rounded-2xl p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold font-serif text-white tracking-wide">
              {t.auctionCalendar}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {t.calendarPlan}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft className={`h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div className="text-sm font-bold text-white min-w-[120px] text-center font-serif">
            {monthNames[month]} {year}
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <ChevronRight className={`h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#0d0d0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 border-b border-white/5">
          {daysOfWeek.map((d, i) => (
            <div key={`dow-${i}`} className="py-4 text-center text-[10px] uppercase font-black tracking-widest text-slate-500 bg-white/2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((item, idx) => {
            const dayAuctions = getAuctionsForDate(item.date);
            const isCurrentToday = isToday(item.date);
            
            return (
              <div 
                key={`day-${idx}`}
                className={`min-h-[120px] p-2 border-b border-r border-white/5 transition-colors ${
                  !item.day ? 'bg-white/[0.01]' : 'hover:bg-white/[0.03]'
                } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
              >
                {item.day && (
                  <div className="flex flex-col h-full gap-2">
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-mono font-bold flex h-6 w-6 items-center justify-center rounded-lg ${
                        isCurrentToday 
                          ? 'bg-amber-500 text-black' 
                          : 'text-slate-400'
                      }`}>
                        {item.day}
                      </span>
                      {dayAuctions.length > 0 && (
                        <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {dayAuctions.length} {lang === 'ar' ? 'حدث' : 'Events'}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
                      {dayAuctions.map(auc => {
                        const isStart = new Date(auc.createdDate).toDateString() === item.date?.toDateString();
                        return (
                          <button
                            key={`cal-auc-${auc.id}-${item.day}`}
                            onClick={() => onSelectAuction(auc)}
                            className={`w-full text-left p-1.5 rounded-lg border text-[9px] transition-all cursor-pointer group ${
                              isStart 
                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' 
                                : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                isStart ? 'bg-emerald-500' : 'bg-rose-500'
                              }`} />
                              <span className="font-bold text-white truncate">
                                {lang === 'ar' ? auc.titleAr : auc.titleEn}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[8px] text-slate-400 group-hover:text-slate-200">
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {new Date(isStart ? auc.createdDate : auc.endTime).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="font-black uppercase">
                                {isStart ? t.starts : t.ends}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center gap-6 p-6 bg-[#0d0d0f] border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{lang === 'ar' ? 'بداية المزاد' : 'Auction Starts'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{lang === 'ar' ? 'نهاية المزاد' : 'Auction Ends'}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] text-slate-500 italic">
            {lang === 'ar' 
              ? 'جميع الأوقات المعروضة هي بالتوقيت المحلي لجرينتش +3'
              : 'All times are shown in GMT+3 standard time'}
          </span>
        </div>
      </div>
    </div>
  );
}
