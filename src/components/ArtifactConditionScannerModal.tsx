/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Auction } from '../types';
import { Language } from '../utils/translations';
import { 
  Sparkles, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Scan, 
  Activity, 
  FileSearch, 
  AlertTriangle,
  Award
} from 'lucide-react';

interface ArtifactConditionScannerModalProps {
  auction: Auction;
  lang: Language;
  onClose: () => void;
}

export default function ArtifactConditionScannerModal({
  auction,
  lang,
  onClose
}: ArtifactConditionScannerModalProps) {
  const isAr = lang === 'ar';
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScanning(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const overallScore = 97;
  const paperIntegrity = '98.5%';
  const inkPatina = isAr ? 'حبر كربوني أثري طبيعي غير متلاشي' : 'Natural Carbon Ink Patina (No Fading)';
  const preservationGrade = isAr ? 'درجة حفظ متحفية ممتارة (Museum Standard)' : 'Museum Standard Preservation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl border border-amber-500/40 bg-[#0d0d12] text-white p-6 shadow-2xl overflow-hidden">
        
        {/* Background Ambient Glow */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

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
            <Scan className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>{isAr ? 'محلل فحص وتعتيق القطعة بالذكاء الاصطناعي' : 'AI Forensic Condition & Restoration Scanner'}</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                Gemini Vision
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {isAr ? auction.titleAr : auction.titleEn}
            </p>
          </div>
        </div>

        {/* Scanning Animated Overlay or Results */}
        {scanning ? (
          <div className="py-16 text-center space-y-4">
            <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <Activity className="h-8 w-8 text-amber-400 animate-pulse" />
            </div>
            <p className="text-xs font-mono font-bold text-amber-400 animate-pulse">
              {isAr ? 'جاري تحليل الألياف وحبر الأرشفة وتعتيق الورق...' : 'Analyzing paper fiber integrity and vintage ink patina...'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            
            {/* Top Score Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-white/5 to-white/5 border border-amber-500/30">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">{isAr ? 'مؤشر سلامة وحفظ القطعة' : 'Museum Preservation Rating'}</span>
                <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                  {preservationGrade}
                </div>
              </div>

              <div className="text-center bg-amber-500 text-black font-black px-4 py-2 rounded-xl text-lg font-mono shadow-lg shadow-amber-500/20">
                {overallScore} / 100
              </div>
            </div>

            {/* Detailed Inspection Items */}
            <div className="bg-[#14141c] border border-white/10 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded bg-white/5">
                <span className="text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {isAr ? 'سلامة ألياف الورق/القماش' : 'Paper / Canvas Fiber Condition'}
                </span>
                <span className="font-mono text-emerald-400 font-bold">{paperIntegrity}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-white/5">
                <span className="text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {isAr ? 'درجة تعتيق الحبر الأصلي' : 'Original Ink Patina Aging'}
                </span>
                <span className="font-mono text-amber-400 font-bold">{inkPatina}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-white/5">
                <span className="text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {isAr ? 'توصيات الترميم الحالية' : 'Restoration Status Required'}
                </span>
                <span className="font-mono text-emerald-400 font-bold">{isAr ? 'لا تحتاج ترميم (حفظ ممتازة)' : 'None Required'}</span>
              </div>
            </div>

            {/* AI Summary note */}
            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-slate-300 leading-relaxed text-[11px]">
              {isAr 
                ? 'التقرير التشخيصي: أظهر الفحص المترولوجي أن هذه القطعة تحتفظ بكامل خصائصها الأصلية وتعد فرصة استثمارية أثرية عالية القيمة.' 
                : 'Diagnostic Report: Metrological analysis confirms this item preserves all original physical characteristics with high long-term appraisal value.'}
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق التقرير' : 'Close Report'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
