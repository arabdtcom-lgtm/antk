/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Globe, Check } from 'lucide-react';
import { Language } from '../utils/translations';

interface FloatingLanguageToggleProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

export default function FloatingLanguageToggle({
  lang,
  setLang,
}: FloatingLanguageToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 start-6 z-40 flex flex-col items-start gap-2 select-none print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="rounded-2xl bg-[#0e0e12]/95 border border-amber-500/30 p-2 shadow-2xl shadow-black/80 backdrop-blur-xl flex flex-col gap-1 min-w-[160px]"
          >
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 mb-1 flex items-center justify-between">
              <span>{lang === 'ar' ? 'اختر اللغة' : 'Select Language'}</span>
              <Globe className="h-3 w-3 text-amber-400" />
            </div>

            <button
              type="button"
              onClick={() => {
                setLang('ar');
                setIsOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                lang === 'ar'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🇪🇬</span>
                <span>العربية (AR)</span>
              </div>
              {lang === 'ar' && <Check className="h-3.5 w-3.5 text-black" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setLang('en');
                setIsOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🇬🇧</span>
                <span>English (EN)</span>
              </div>
              {lang === 'en' && <Check className="h-3.5 w-3.5 text-black" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0d0d10]/90 hover:bg-[#16161c] border border-amber-500/40 text-amber-400 hover:text-amber-300 shadow-2xl shadow-black/80 backdrop-blur-md cursor-pointer transition-all group"
        title={lang === 'ar' ? 'تغيير اللغة (Change Language)' : 'Change Language (تغيير اللغة)'}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
          <Languages className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-extrabold tracking-wide font-mono text-slate-200 group-hover:text-white">
          {lang === 'ar' ? 'العربية' : 'English'}
        </span>
        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
          {lang === 'ar' ? 'EN' : 'AR'}
        </span>
      </motion.button>
    </div>
  );
}
