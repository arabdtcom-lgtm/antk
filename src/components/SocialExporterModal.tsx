/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Auction } from '../types';
import { Language, Currency, formatPrice } from '../utils/translations';
import { Share2, X, Send, Copy, Check, MessageSquare } from 'lucide-react';

interface SocialExporterModalProps {
  auction: Auction;
  lang: Language;
  currency: Currency;
  onClose: () => void;
}

export default function SocialExporterModal({
  auction,
  lang,
  currency,
  onClose
}: SocialExporterModalProps) {
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);

  const auctionUrl = typeof window !== 'undefined' ? `${window.location.origin}/?auctionId=${auction.id}` : '';

  const shareText = isAr
    ? `🏛️ *مزاد أثري نادر على منصة أنتيكاوي الملكية*
📜 *القطعة:* ${auction.titleAr}
💎 *الفئة:* ${auction.category}
💰 *السعر الحالي:* ${formatPrice(auction.currentPrice, currency, 'ar')}
⏳ *رابط المزايدة المباشرة:* ${auctionUrl}`
    : `🏛️ *Rare Antique Auction on Antkawy*
📜 *Item:* ${auction.titleEn}
💰 *Current Price:* ${formatPrice(auction.currentPrice, currency, 'en')}
⏳ *Bid Link:* ${auctionUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(auctionUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/40 bg-[#0d0d12] text-white p-6 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              {isAr ? 'مشارك المزاد المباشر للواتساب وتليجرام' : 'Export Auction Card to WhatsApp & Telegram'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formatted Text Preview Card */}
        <div className="bg-[#14141c] border border-white/10 rounded-xl p-4 my-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">{isAr ? 'معاينة النص المنسق:' : 'Formatted Message Preview:'}</span>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
            {shareText}
          </pre>
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleTelegram}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Telegram</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-all border border-white/10 cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
