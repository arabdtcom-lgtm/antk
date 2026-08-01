/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { translations, Language, Currency, formatPrice } from '../utils/translations';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gavel, 
  Globe, 
  Coins, 
  Sun, 
  Moon, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Database,
  Volume2,
  VolumeX,
  Heart,
  Mail,
  Calculator,
  PlusCircle,
  TrendingUp,
  Bot,
  Calendar as CalendarIcon
} from 'lucide-react';
import RoyalAmbientPlayer from './RoyalAmbientPlayer';

interface NavbarProps {
  lang: Language;
  setLang: (l: Language) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  user: User | null;
  activeTab: string;
  setActiveTab: (t: string) => void;
  onLogout: () => void;
  notifications: Array<{ id: string; text: string; timestamp: string }>;
  clearNotifications: () => void;
  muteSound: boolean;
  setMuteSound: (m: boolean) => void;
  watchlistCount?: number;
}

export default function Navbar({
  lang,
  setLang,
  currency,
  setCurrency,
  darkMode,
  setDarkMode,
  user,
  activeTab,
  setActiveTab,
  onLogout,
  notifications,
  clearNotifications,
  muteSound,
  setMuteSound,
  watchlistCount = 0
}: NavbarProps) {
  const t = translations[lang];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0d0d0f]/95 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and App Title */}
        <div 
          onClick={() => setActiveTab('auctions')}
          className="flex cursor-pointer items-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-9 w-9 bg-amber-500 rounded-xl items-center justify-center text-[#0a0a0b] shadow-lg shadow-amber-500/30">
            <span className="font-black text-lg" style={{fontFamily: 'serif'}}>A</span>
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-amber-500 uppercase leading-tight">
              {lang === 'ar' ? 'أنتيكاوي' : 'ANTKAWY'}
            </h1>
            <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
              {lang === 'ar' ? 'منصة المزادات الأثرية' : 'ANTIQUE AUCTIONS'}
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-2">
          <button
            id="tab-auctions-btn"
            onClick={() => setActiveTab('auctions')}
            className={`cursor-pointer px-4 py-1.5 text-xs uppercase tracking-wider font-semibold rounded transition-all ${
              activeTab === 'auctions'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.activeAuctions}
          </button>

          <button
            id="tab-calendar-btn"
            onClick={() => setActiveTab('calendar')}
            className={`cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold rounded transition-all ${
              activeTab === 'calendar'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'التقويم' : 'Calendar'}</span>
          </button>
          
          <button
            id="tab-create-btn"
            onClick={() => setActiveTab('create')}
            className={`cursor-pointer px-4 py-1.5 text-xs uppercase tracking-wider font-semibold rounded transition-all ${
              activeTab === 'create'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.createAuction}
          </button>

          <button
            id="tab-watchlist-btn"
            onClick={() => setActiveTab('watchlist')}
            className={`cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold rounded transition-all ${
              activeTab === 'watchlist'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${watchlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{t.watchlist}</span>
            {watchlistCount > 0 && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'watchlist' ? 'bg-black/20 text-black' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {watchlistCount}
              </span>
            )}
          </button>

          <button
            id="tab-messages-btn"
            onClick={() => setActiveTab('messages')}
            className={`cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold rounded transition-all ${
              activeTab === 'messages'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'رسائلي' : 'Messages'}</span>
          </button>

          <button
            id="tab-valuation-btn"
            onClick={() => setActiveTab('valuation')}
            className={`cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold rounded transition-all ${
              activeTab === 'valuation'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'حاسبة التقييم' : 'Valuation'}</span>
          </button>

          <button
            id="tab-roi-btn"
            onClick={() => setActiveTab('roi')}
            className={`cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold rounded transition-all ${
              activeTab === 'roi'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'مؤشر النمو' : 'ROI Index'}</span>
          </button>

          <button
            id="tab-simulator-btn"
            onClick={() => setActiveTab('simulator')}
            className={`cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold rounded transition-all ${
              activeTab === 'simulator'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'ساحة التدريب' : 'Simulator'}</span>
          </button>

          <button
            id="tab-support-btn"
            onClick={() => setActiveTab('support')}
            className={`cursor-pointer px-4 py-1.5 text-xs uppercase tracking-wider font-semibold rounded transition-all ${
              activeTab === 'support'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.supportTickets}
          </button>

          {user?.role === 'admin' && (
            <button
              id="tab-admin-btn"
              onClick={() => setActiveTab('admin')}
              className={`cursor-pointer flex items-center gap-1.5 px-4 py-1.5 text-xs uppercase tracking-wider font-bold rounded ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-amber-500 border border-white/10'
              } transition-all`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {t.adminDashboard}
            </button>
          )}
        </nav>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Royal Heritage Ambient Soundscapes Player */}
          <div className="hidden sm:block">
            <RoyalAmbientPlayer lang={lang} />
          </div>
          
          {/* Audio toggle */}
          <button
            onClick={() => setMuteSound(!muteSound)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title={muteSound ? "كتم الأصوات" : "تفعيل الأصوات"}
          >
            {muteSound ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4 text-amber-500" />
            )}
          </button>

          {/* Language Control */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Globe className="h-3 w-3 text-amber-400" />
            <span>{t.language}</span>
          </button>

          {/* Currency Selection */}
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded px-1 py-0.5">
            <Coins className="h-3.5 w-3.5 text-amber-500 mx-1" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="bg-transparent text-xs font-bold text-white outline-none pr-3 cursor-pointer py-1"
            >
              <option value="SAR">SAR (ر.س)</option>
              <option value="USD">USD ($)</option>
              <option value="EGP">EGP (ج.م)</option>
            </select>
          </div>

          {/* Audio Sound FX Toggle */}
          <button
            onClick={() => setMuteSound(!muteSound)}
            title={muteSound ? (lang === 'ar' ? 'تشغيل المؤثرات الصوتية' : 'Unmute Sound Effects') : (lang === 'ar' ? 'كتم المؤثرات الصوتية' : 'Mute Sound Effects')}
            className="p-2 text-slate-300 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            {muteSound ? <VolumeX className="h-4 w-4 text-slate-500" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>

          {/* Dark / Light Mode Toggle */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1, rotate: 15 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode')}
            className="relative p-2.5 text-slate-300 hover:text-amber-400 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 shadow-lg transition-colors cursor-pointer flex items-center justify-center overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {darkMode ? (
                <motion.div
                  key="sun"
                  initial={{ y: -15, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 15, opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-4 w-4 text-amber-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ y: -15, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 15, opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-4 w-4 text-indigo-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Real-time notifications bell popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
              }}
              className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div 
                className={`absolute top-12 ${
                  lang === 'ar' ? 'left-0' : 'right-0'
                } w-80 rounded-xl border border-white/10 bg-[#0d0d0f] shadow-2xl transition-all p-3`}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                  <span className="text-xs font-extrabold text-amber-500 font-serif tracking-wide uppercase">
                    {lang === 'ar' ? 'التنبيهات اللحظية المباشرة' : 'Live Incident Stream'}
                  </span>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        clearNotifications();
                        setShowNotifications(false);
                      }}
                      className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                    >
                      {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-500">
                      {lang === 'ar' ? 'لا توجد إشعارات فورية جديدة' : 'No dynamic activity recorded'}
                    </p>
                  ) : (
                    notifications.map((n, nIdx) => (
                      <div 
                        key={n.id ? `notif-${n.id}-${nIdx}` : `notif-${nIdx}`} 
                        className="p-2 rounded bg-white/5 border border-white/5 text-[11px] leading-relaxed text-slate-300"
                      >
                        <div>{n.text}</div>
                        <div className="text-[9px] text-slate-500 text-right mt-1 font-mono">
                          {n.timestamp}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account / Profile dropdown summary */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={user.name}
                    className="h-8 w-8 rounded-full border border-amber-500/40 object-cover"
                  />
                  {user.tier === 'vip' && (
                    <span className="absolute -top-1 -right-1 text-[10px]">👑</span>
                  )}
                  {user.tier === 'verified_seller' && (
                    <span className="absolute -top-1 -right-1 text-[10px]">🛡️</span>
                  )}
                  {user.role === 'admin' && (
                    <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>
                  )}
                </div>
                <div className="hidden lg:block text-right pr-1">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <span>{user.name}</span>
                    {user.verified && <span className="text-[10px] text-blue-400">✓</span>}
                  </div>
                  <div className="text-[9px] font-mono font-bold text-amber-500">
                    {formatPrice(user.balance, currency, lang)}
                  </div>
                </div>
              </button>

              {showProfileDropdown && (
                <div 
                  className={`absolute top-12 ${
                    lang === 'ar' ? 'left-0' : 'right-0'
                  } w-60 rounded-xl border border-white/10 bg-[#0d0d0f] shadow-2xl overflow-hidden transition-all z-50`}
                >
                  <div className="bg-white/5 p-3 border-b border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        user.tier === 'vip' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        user.tier === 'verified_seller' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {user.tier === 'vip' ? (lang === 'ar' ? 'VIP مميز' : 'VIP Member') :
                         user.tier === 'verified_seller' ? (lang === 'ar' ? 'بائع موثق' : 'Verified Seller') :
                         user.role === 'admin' ? (lang === 'ar' ? 'مدير النظام' : 'Admin') :
                         (lang === 'ar' ? 'عضو عادي' : 'Standard')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono font-extrabold text-amber-500">
                        {formatPrice(user.balance, currency, lang)}
                      </span>
                      <button
                        onClick={() => {
                          setActiveTab('my-profile');
                          setShowProfileDropdown(false);
                        }}
                        className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                      >
                        + {lang === 'ar' ? 'شحن المحفظة' : 'Top Up'}
                      </button>
                    </div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setActiveTab('my-profile');
                        setShowProfileDropdown(false);
                      }}
                      className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded text-right"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>{t.myProfile}</span>
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setShowProfileDropdown(false);
                        }}
                        className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-xs text-amber-500 hover:bg-white/5 rounded text-right font-semibold"
                      >
                        <Database className="h-3.5 w-3.5" />
                        <span>{t.adminDashboard}</span>
                      </button>
                    )}
                    <div className="h-px bg-white/5 my-1" />
                    <button
                      onClick={() => {
                        onLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/20 rounded text-right"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('my-profile')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 rounded transition-all uppercase tracking-wider cursor-pointer"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>{t.login}</span>
            </button>
          )}

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0d]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('auctions')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'auctions' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gavel className="h-5 w-5" />
          <span className="text-[9px]">{lang === 'ar' ? 'المزادات' : 'Auctions'}</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'calendar' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarIcon className="h-5 w-5" />
          <span className="text-[9px]">{lang === 'ar' ? 'التقويم' : 'Calendar'}</span>
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'watchlist' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className={`h-5 w-5 ${watchlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className="text-[9px]">{lang === 'ar' ? 'المفضلة' : 'Saved'}</span>
          {watchlistCount > 0 && (
            <span className="absolute top-0 right-1 bg-rose-500 text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center">
              {watchlistCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className="flex flex-col items-center justify-center h-10 w-10 -mt-4 bg-amber-500 text-black rounded-full shadow-lg shadow-amber-500/40 cursor-pointer hover:bg-amber-400 transition-all active:scale-95"
        >
          <PlusCircle className="h-5 w-5 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('valuation')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'valuation' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="h-5 w-5" />
          <span className="text-[9px]">{lang === 'ar' ? 'التقييم' : 'Valuation'}</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'messages' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="h-5 w-5" />
          <span className="text-[9px]">{lang === 'ar' ? 'الرسائل' : 'Messages'}</span>
        </button>

        <button
          onClick={() => setActiveTab('my-profile')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'my-profile' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[9px]">{lang === 'ar' ? 'حسابي' : 'Profile'}</span>
        </button>
      </nav>
    </header>
  );
}
