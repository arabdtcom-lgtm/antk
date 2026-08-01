/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Auction } from '../types';
import { Language } from '../utils/translations';
import { 
  ShieldCheck, 
  X, 
  Award, 
  CheckCircle2, 
  QrCode, 
  Search, 
  FileText, 
  ExternalLink,
  Lock,
  Building2,
  Calendar
} from 'lucide-react';
import QRCode from 'react-qr-code';

interface ProvenanceInspectorModalProps {
  auction: Auction;
  lang: Language;
  onClose: () => void;
}

export default function ProvenanceInspectorModal({
  auction,
  lang,
  onClose
}: ProvenanceInspectorModalProps) {
  const isAr = lang === 'ar';

  const archiveCode = `ANTK-${auction.id.toUpperCase()}-SEAL-9984`;
  const verificationDate = '2026-07-28';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-xl rounded-2xl border border-amber-500/40 bg-[#0f0f13] text-white p-6 shadow-2xl overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-16 -left-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>{isAr ? 'شهادة التوثيق الملكي والأختام الأثرية' : 'Royal Provenance & Authentication Seal'}</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {isAr ? 'معتمد 100%' : '100% Verified'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {archiveCode}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-xs">
          
          {/* Main Artifact Card */}
          <div className="flex gap-4 p-3.5 rounded-xl bg-white/5 border border-white/5 items-center">
            <img
              src={auction.image}
              alt={isAr ? auction.titleAr : auction.titleEn}
              className="h-16 w-16 rounded-lg object-cover border border-amber-500/30 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-200 truncate">{isAr ? auction.titleAr : auction.titleEn}</h3>
              <p className="text-[11px] text-amber-400 font-semibold mt-0.5">{auction.category}</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  {isAr ? 'تاريخ الفحص:' : 'Inspected:'} {verificationDate}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="h-3 w-3" />
                  {isAr ? 'فحص البصمة المائية' : 'Watermark Cleared'}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Verification Checklist */}
          <div className="bg-[#15151c] border border-white/10 rounded-xl p-4 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-2">
              {isAr ? 'نتائج الفحص الأثري والموثوقية:' : 'Forensic Inspection Results:'}
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white/5">
              <span className="text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {isAr ? 'الأختام الرسمية والخاتم الملكي' : 'Official Royal Seal & Stamp Integrity'}
              </span>
              <span className="font-mono text-emerald-400 font-bold">{isAr ? 'أصلي مؤكد' : 'Authentic'}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white/5">
              <span className="text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {isAr ? 'فحص الورق وحبر الأرشفة (الكربون والألياف)' : 'Paper Fiber & Historical Ink Analysis'}
              </span>
              <span className="font-mono text-emerald-400 font-bold">{isAr ? 'مطابق للحقبة' : 'Period Match'}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white/5">
              <span className="text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {isAr ? 'سلسلة الملكية والتسلسل التاريخي' : 'Lineage & Provenance Chain'}
              </span>
              <span className="font-mono text-emerald-400 font-bold">{isAr ? 'موثقة بالكامل' : 'Fully Documented'}</span>
            </div>
          </div>

          {/* QR Code and digital hash section */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="p-2 bg-white rounded-lg shrink-0">
              <QRCode value={`https://antkawy.com/verify/${archiveCode}`} size={72} />
            </div>
            <div>
              <div className="font-bold text-amber-400 text-xs mb-1">
                {isAr ? 'البصمة الرقمية للوثيقة (Block-Hash)' : 'Digital Cryptographic Seal Hash'}
              </div>
              <p className="text-[10px] text-slate-400 font-mono break-all leading-relaxed">
                0x7f8a9b2c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b2c3d4e5f
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {isAr ? 'مسجلة بالأرشيف الرقمي لمنصة أنتيكاوي للمزادات الملكية.' : 'Registered in the Antkawy Digital Heritage Ledger.'}
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق الشهادة' : 'Close Certificate'}
          </button>
        </div>

      </div>
    </div>
  );
}
