/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gavel, AlertCircle, ShieldCheck, CheckSquare, Square, X, ArrowUpRight } from 'lucide-react';
import { Language, Currency, formatPrice } from '../utils/translations';

export interface BidConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  bidAmount: number;
  currentPrice: number;
  auctionTitle: string;
  auctionImage?: string;
  currency: Currency;
  lang: Language;
  loading?: boolean;
}

export default function BidConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  bidAmount,
  currentPrice,
  auctionTitle,
  auctionImage,
  currency,
  lang,
  loading = false,
}: BidConfirmationModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Reset acknowledgment state when opened or bid amount changes
  useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
    }
  }, [isOpen, bidAmount]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  // Fee calculations
  const buyerPremiumRate = 0.025; // 2.5% Buyer's Premium
  const escrowFeeRate = 0.015; // 1.5% Escrow Protection Fee
  const vatRate = 0.15; // 15% VAT on platform fees

  const buyerPremium = Math.round(bidAmount * buyerPremiumRate);
  const escrowFee = Math.round(bidAmount * escrowFeeRate);
  const estimatedVat = Math.round((buyerPremium + escrowFee) * vatRate);
  const totalAmount = bidAmount + buyerPremium + escrowFee + estimatedVat;

  const incrementValue = Math.max(0, bidAmount - currentPrice);

  const handleConfirmSubmit = () => {
    if (!acknowledged || loading) return;
    onConfirm();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !loading && onClose()}
          className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/30 bg-[#0d0d11] p-5 sm:p-6 shadow-2xl shadow-amber-500/10 text-white"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Top Gold Header Badge & Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Gavel className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-amber-400">
                  {isAr ? 'تأكيد إرسال المزايدة' : 'Confirm Bid Submission'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'مراجعة المبالغ والرسوم لحماية المزايدين' : 'Review details & breakdown before commitment'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Auction Item Summary Card */}
          <div className="mt-4 flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            {auctionImage ? (
              <img
                src={auctionImage}
                alt={auctionTitle}
                className="h-14 w-14 rounded-lg object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Gavel className="h-6 w-6 text-amber-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{auctionTitle}</h4>
              <div className="flex items-center gap-3 mt-1 text-[11px]">
                <span className="text-slate-400">
                  {isAr ? 'السعر الحالي:' : 'Current Price:'}{' '}
                  <strong className="text-slate-200 font-mono">{formatPrice(currentPrice, currency, lang)}</strong>
                </span>
                {incrementValue > 0 && (
                  <span className="text-emerald-400 font-extrabold font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    +{formatPrice(incrementValue, currency, lang)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Fee Breakdown Table */}
          <div className="mt-4 rounded-xl bg-[#141419] p-4 border border-amber-500/15 space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400/90 pb-1 border-b border-white/5 flex items-center justify-between">
              <span>{isAr ? 'تفاصيل المبالغ والرسوم المطبقة' : 'Financial Breakdown & Fees'}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            </div>

            {/* Hammer Price / Bid Amount */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">
                {isAr ? 'مبلغ المزايدة المقترح:' : 'Proposed Bid Amount:'}
              </span>
              <span className="font-mono text-amber-400 font-extrabold text-sm">
                {formatPrice(bidAmount, currency, lang)}
              </span>
            </div>

            {/* Buyer Premium */}
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-1">
                {isAr ? 'عمولة المشتري والمنصة (2.5%):' : 'Buyer\'s Premium (2.5%):'}
              </span>
              <span className="font-mono text-slate-300">
                +{formatPrice(buyerPremium, currency, lang)}
              </span>
            </div>

            {/* Escrow Guarantee Fee */}
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-1">
                {isAr ? 'رسوم الضمان والحماية المباشرة (1.5%):' : 'Escrow Guarantee Fee (1.5%):'}
              </span>
              <span className="font-mono text-slate-300">
                +{formatPrice(escrowFee, currency, lang)}
              </span>
            </div>

            {/* VAT */}
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>
                {isAr ? 'ضريبة القيمة المضافة المقدرة (15%):' : 'Estimated VAT (15% on fees):'}
              </span>
              <span className="font-mono text-slate-300">
                +{formatPrice(estimatedVat, currency, lang)}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent my-1" />

            {/* Final Grand Total */}
            <div className="flex justify-between items-center py-1">
              <div>
                <span className="text-xs font-black text-white block">
                  {isAr ? 'إجمالي التكلفة الإجمالية:' : 'Total Estimated Commitment:'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isAr ? 'شاملة كافة الرسوم والضمانات' : 'Inclusive of all fees and escrow coverage'}
                </span>
              </div>
              <span className="font-mono text-xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                {formatPrice(totalAmount, currency, lang)}
              </span>
            </div>
          </div>

          {/* Legal Commitment Notice */}
          <div className="mt-3.5 flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              {isAr
                ? 'تنبيه: تقديم العرض ملزم قانونياً ولا يمكن إلغاؤه بعد التأكيد. في حال فوزك بالمزاد، سيتم تفعيل التزام الشراء تلقائياً.'
                : 'Notice: Bids are legally binding and cannot be retracted once confirmed. If winning, purchase commitment activates automatically.'}
            </p>
          </div>

          {/* Safety Checkbox to Prevent Accidental Submissions */}
          <button
            type="button"
            onClick={() => setAcknowledged(!acknowledged)}
            className={`mt-4 w-full flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer text-left ${
              acknowledged
                ? 'bg-amber-500/15 border-amber-500/50 text-white'
                : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-amber-500/30'
            }`}
          >
            {acknowledged ? (
              <CheckSquare className="h-5 w-5 text-amber-400 shrink-0" />
            ) : (
              <Square className="h-5 w-5 text-slate-500 shrink-0" />
            )}
            <span className="text-xs font-bold leading-tight select-none">
              {isAr
                ? 'أقر بصحة المبلغ وأتعهد بالتزام هذا العرض كاملاً مع الموافقة على الشروط والرسوم'
                : 'I confirm the bid amount and agree to the binding terms and calculated fee structure'}
            </span>
          </button>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-1/3 cursor-pointer py-3 text-xs font-bold uppercase tracking-wider text-slate-300 border border-white/10 rounded-xl hover:bg-white/5 transition-all disabled:opacity-50"
            >
              {isAr ? 'تراجع' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={!acknowledged || loading}
              className={`w-full sm:w-2/3 cursor-pointer flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${
                acknowledged && !loading
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black hover:brightness-110 shadow-amber-500/25 active:scale-98'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <>
                  <Gavel className="h-4 w-4" />
                  <span>{isAr ? 'تأكيد وإرسال المزايدة' : 'Confirm & Place Bid'}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
