/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Auction, User } from '../types';
import { Language, Currency, formatPrice } from '../utils/translations';
import { Award, Printer, Download, X, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';

interface OwnershipCertificateModalProps {
  auction: Auction;
  user: User | null;
  lang: Language;
  currency: Currency;
  onClose: () => void;
}

export default function OwnershipCertificateModal({
  auction,
  user,
  lang,
  currency,
  onClose
}: OwnershipCertificateModalProps) {
  const isAr = lang === 'ar';
  const certId = `ANTK-CERT-${auction.id.toUpperCase()}-2026`;
  const winningPrice = auction.currentPrice;
  const issueDate = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-amber-500/50 bg-[#0d0d12] text-white p-6 sm:p-8 shadow-2xl overflow-hidden print:p-0 print:border-none print:bg-white print:text-black">
        
        {/* Decorative Golden Corner Accents */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-500/20 to-transparent pointer-events-none" />

        {/* Close & Action Toolbar (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              {isAr ? 'شهادة الملكية والأصالة المعتمدة' : 'Official Ownership Certificate'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Printer className="h-4 w-4" />
              <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Styled like an ornate royal document) */}
        <div className="border-4 border-double border-amber-500/40 p-6 sm:p-8 rounded-xl bg-gradient-to-b from-[#14141d] to-[#0a0a0d] print:bg-white print:text-black print:border-black">
          
          {/* Top Royal Emblem Header */}
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold mb-2">
              <span className="font-serif text-2xl font-black">A</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-widest text-amber-400 uppercase font-serif">
              {isAr ? 'منصة أنتيكاوي للمزادات الملكية والأنتيك' : 'ANTKAWY ROYAL AUCTION HOUSE'}
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-mono text-slate-400 mt-1">
              {isAr ? 'شهادة نقل الملكية والأرشيف الأثري' : 'CERTIFICATE OF OWNERSHIP & HISTORICAL LINEAGE'}
            </p>
            <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-3" />
          </div>

          {/* Certificate Main Text */}
          <div className="text-center space-y-3 my-6">
            <p className="text-xs text-slate-300 print:text-black leading-relaxed font-serif">
              {isAr ? 'تأكد هذه الشهادة الرسمية أن المقتنى الأثري والتاريخي الموضحة تفاصيله أدناه قد تم مزايدته ونقل ملكيته المعتمدة إلى السيد:' : 'This official document certifies that the historical artifact specified below has been acquired through verified auction by:'}
            </p>
            <div className="text-lg font-black text-amber-300 print:text-black font-serif underline decoration-amber-500/50 underline-offset-4">
              {user?.name || (isAr ? 'المزايد المالك المعتمد' : 'Verified Auction Winner')}
            </div>
          </div>

          {/* Item Details Box */}
          <div className="bg-white/5 border border-amber-500/30 rounded-xl p-4 my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 print:bg-gray-100 print:border-black">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'عنوان المقتنى:' : 'Artifact Title:'}</span>
              <p className="text-xs font-extrabold text-white print:text-black truncate">
                {isAr ? auction.titleAr : auction.titleEn}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'الفئة والحقبة:' : 'Category & Era:'}</span>
              <p className="text-xs font-bold text-amber-400 print:text-black">
                {auction.category}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'سعر الرسو النهائي:' : 'Winning Hammer Price:'}</span>
              <p className="text-sm font-black text-emerald-400 print:text-black font-mono">
                {formatPrice(winningPrice, currency, lang)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'تاريخ الإصدار:' : 'Date of Issue:'}</span>
              <p className="text-xs font-mono font-bold text-slate-200 print:text-black">
                {issueDate}
              </p>
            </div>
          </div>

          {/* Footer Seals & QR Code */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6 print:border-black">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-white rounded-lg">
                <QRCode value={`https://antkawy.com/certificate/${certId}`} size={56} />
              </div>
              <div className="text-[10px] font-mono text-slate-400 print:text-black">
                <div>{isAr ? 'رقم التوثيق:' : 'Serial:'}</div>
                <div className="font-bold text-amber-400 print:text-black">{certId}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 print:border-black print:text-black">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isAr ? 'خاتم الضمان المعتمد' : 'Verified Escrow Seal'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
