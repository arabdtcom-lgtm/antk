import React, { useMemo, useState } from 'react';
import { formatPrice, Currency } from '../utils/translations';
import { User, Auction } from '../types';
import { Trophy, Gavel, Wallet, TrendingUp, Clock, FileText, Printer, Download, CheckCircle2, ShieldCheck, X, Award } from 'lucide-react';
import TrustScoreProgressBar from './TrustScoreProgressBar';

interface UserStatsProps {
  user: User;
  auctions: Auction[];
  lang: 'ar' | 'en';
  currency: Currency;
}

export default function UserStats({ user, auctions, lang, currency }: UserStatsProps) {
  const isRTL = lang === 'ar';
  const [selectedInvoiceAuction, setSelectedInvoiceAuction] = useState<Auction | null>(null);

  const { activeBids, wonAuctions, totalSpent } = useMemo(() => {
    const active = auctions.filter(auc => auc.highBidder === user.email && auc.status === 'active');
    const won = auctions.filter(auc => auc.highBidder === user.email && (auc.status === 'completed' || auc.status === 'pending_payment' || auc.status === 'buyout_claimed'));
    const spent = won.reduce((acc, auc) => acc + auc.currentPrice, 0);

    return { activeBids: active, wonAuctions: won, totalSpent: spent };
  }, [auctions, user.email]);

  const stats = [
    {
      id: 'active',
      label: isRTL ? 'مزادات نشطة' : 'Active Bids',
      value: activeBids.length.toString(),
      icon: Gavel,
    },
    {
      id: 'won',
      label: isRTL ? 'مزادات فاز بها' : 'Auctions Won',
      value: wonAuctions.length.toString(),
      icon: Trophy,
    },
    {
      id: 'spent',
      label: isRTL ? 'إجمالي الإنفاق' : 'Total Spent',
      value: formatPrice(totalSpent, currency, lang),
      icon: TrendingUp,
    },
    {
      id: 'balance',
      label: isRTL ? 'رصيد المحفظة' : 'Wallet Balance',
      value: formatPrice(user.balance || 0, currency, lang),
      icon: Wallet,
    },
  ];

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className={`mx-auto max-w-5xl px-4 py-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-bold text-white mb-6">
        {isRTL ? 'إحصائياتي' : 'My Statistics'}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-[#0d0d0f] border border-white/10 rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <div className="bg-amber-500/10 p-3 rounded-full mb-3">
              <stat.icon className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-500 mb-1">{stat.value}</div>
            <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* User Trust Score Progress Bar */}
      <div className="mb-6">
        <TrustScoreProgressBar
          user={user}
          auctions={auctions}
          lang={lang}
          variant="full"
        />
      </div>

      {/* VIP Collector Level & XP Progress Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#13131a] to-amber-950/30 border border-amber-500/30 rounded-2xl p-5 mb-8 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg">
              👑
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-400">
                {isRTL ? 'مستوى جامع التحف والقطع الفاخرة' : 'Master Collector Loyalty Status'}
              </h4>
              <p className="text-xs text-slate-300 font-mono">
                {user.tier === 'vip' ? (isRTL ? 'رتبة كبار الشخصيات الذهبية (VIP Gold Status)' : 'VIP Gold Member Tier') :
                 user.tier === 'verified_seller' ? (isRTL ? 'تاجر وبائع معتمد (Verified Merchant)' : 'Verified Merchant Tier') :
                 (isRTL ? 'عضو مزايد فضي (Silver Collector Level 3)' : 'Silver Collector Level 3')}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            {wonAuctions.length * 250 + 1250} XP
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>{isRTL ? 'المستوى 5 (جامع محترف)' : 'Level 5 (Experienced Collector)'}</span>
            <span>{isRTL ? 'الهدف للمستوى القادم: 2,500 XP' : 'Next Level Target: 2,500 XP'}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(35, ((wonAuctions.length * 250 + 1250) / 2500) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Won Auctions Section with PDF Invoice Download */}
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400" />
        {isRTL ? 'المزادات الفائز بها والفواتير' : 'Won Auctions & Official Invoices'}
      </h3>

      {wonAuctions.length === 0 ? (
        <div className="bg-[#0d0d0f] border border-white/10 rounded-xl p-8 text-center text-slate-400 mb-8">
          {isRTL ? 'لم تفز بأي مزادات بعد. ابدأ المزايدة الآن واربح قطعاً فاخرة!' : 'No won auctions yet. Place a winning bid on exclusive items!'}
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {wonAuctions.map((auction, idx) => (
            <div key={`won-${auction.id}-${idx}`} className="bg-[#0d0d0f] border border-amber-500/30 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-4 min-w-0">
                {auction.image ? (
                  <img src={auction.image} alt={isRTL ? auction.titleAr : auction.titleEn} className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      {isRTL ? 'تم الفوز بنجاح 🏆' : 'Won & Secured'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: #{auction.id.substring(0, 8)}
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-base truncate">{isRTL ? auction.titleAr : auction.titleEn}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                    <span>{isRTL ? 'السعر النهائي:' : 'Hammer Price:'} <strong className="text-amber-400 font-mono">{formatPrice(auction.currentPrice, currency, lang)}</strong></span>
                    <span>&bull;</span>
                    <span>{isRTL ? 'البائع:' : 'Seller:'} {auction.seller.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceAuction(auction)}
                  className="cursor-pointer bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isRTL ? 'تحميل فاتورة PDF' : 'Download PDF Invoice'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Bids Section */}
      <h3 className="text-xl font-bold text-white mb-4">
        {isRTL ? 'مزاداتي النشطة' : 'My Active Auctions'}
      </h3>

      {activeBids.length === 0 ? (
        <div className="bg-[#0d0d0f] border border-white/10 rounded-xl p-8 text-center text-slate-400">
          {isRTL ? 'لا توجد مزادات نشطة حالياً.' : 'No active auctions at the moment.'}
        </div>
      ) : (
        <div className="space-y-3">
          {activeBids.map((auction, idx) => (
            <div key={`abid-${auction.id}-${idx}`} className="bg-[#0d0d0f] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {auction.image ? (
                  <img src={auction.image} alt={isRTL ? auction.titleAr : auction.titleEn} className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                    <Gavel className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <div>
                  <h4 className="text-white font-medium text-lg">{isRTL ? auction.titleAr : auction.titleEn}</h4>
                  <p className="text-amber-500 font-bold">{formatPrice(auction.currentPrice, currency, lang)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg w-fit">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {new Date(auction.endTime).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Professional Printable PDF Invoice Modal */}
      {selectedInvoiceAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8 print:m-0 print:shadow-none print:w-full print:max-w-none">
            
            {/* Close modal button (hidden during print) */}
            <button
              onClick={() => setSelectedInvoiceAuction(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all print:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2 text-amber-600 font-black text-xl mb-1">
                  <span>🏛️</span>
                  <span>ARABDT AUCTIONS VIP</span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {isRTL ? 'منصة المزادات الفاخرة المعتمدة' : 'Official Digital Auction House & Escrow Receipt'}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black text-slate-900 font-mono">
                  INVOICE #INV-{selectedInvoiceAuction.id.substring(0, 8).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isRTL ? 'تاريخ الإصدار:' : 'Date Issued:'} {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  {isRTL ? 'مدفوع ومضمون بالضمان' : 'Paid & Escrow Secured'}
                </span>
              </div>
            </div>

            {/* Buyer & Seller Details */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider">{isRTL ? 'بيانات المشتري (المستلم)' : 'Billed To'}</span>
                <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                <p className="text-slate-600">{user.email}</p>
                <p className="text-slate-600">{user.city || (isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia')}</p>
              </div>
              <div>
                <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider">{isRTL ? 'بيانات البائع (الموثق)' : 'Consignor / Seller'}</span>
                <p className="font-bold text-slate-900 text-sm">{selectedInvoiceAuction.seller.name}</p>
                <p className="text-slate-600">Rating: ⭐ {selectedInvoiceAuction.seller.rating || 4.9} (Verified Consignor)</p>
                <p className="text-slate-600">{isRTL ? 'ضمان الأصالة الفاخرة' : '100% Authenticity Guaranteed'}</p>
              </div>
            </div>

            {/* Auction Item Summary Table */}
            <div>
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500">
                    <th className="py-2.5 font-bold">{isRTL ? 'تفاصيل المزاد والسلعة' : 'Item Description'}</th>
                    <th className="py-2.5 font-bold">{isRTL ? 'الحالة' : 'Condition'}</th>
                    <th className="py-2.5 font-bold text-right">{isRTL ? 'سعر المطرقة' : 'Hammer Price'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-4">
                      <div className="font-bold text-slate-900">{isRTL ? selectedInvoiceAuction.titleAr : selectedInvoiceAuction.titleEn}</div>
                      <div className="text-slate-500 text-xs mt-0.5">Auction Category: {selectedInvoiceAuction.category}</div>
                    </td>
                    <td className="py-4 text-slate-700 capitalize">
                      {selectedInvoiceAuction.itemCondition.replace('_', ' ')}
                    </td>
                    <td className="py-4 text-right font-mono font-bold text-slate-900 text-base">
                      {formatPrice(selectedInvoiceAuction.currentPrice, currency, lang)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals Box */}
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{isRTL ? 'رسوم التوثيق والضمان (0%):' : 'Escrow Fee (0%):'}</span>
                  <span className="font-mono">SAR 0.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isRTL ? 'الشحن المؤمن السريع:' : 'Insured Express Shipping:'}</span>
                  <span className="font-mono">{isRTL ? 'مجاني (VIP)' : 'FREE (VIP)'}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-2">
                  <span>{isRTL ? 'الإجمالي المدفوع:' : 'Total Paid:'}</span>
                  <span className="font-mono text-amber-600">{formatPrice(selectedInvoiceAuction.currentPrice, currency, lang)}</span>
                </div>
              </div>
            </div>

            {/* Seal & QR Footer */}
            <div className="border-t border-slate-200 pt-6 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-800">{isRTL ? 'معتمد رسمياً بخدمة الضمان البنكي' : 'Certified Official Escrow Receipt'}</p>
                  <p>{isRTL ? 'هذه الفاتورة صادرة إلكترونياً ولا تحتاج إلى توقيع ختمي.' : 'Digitally generated invoice, valid without signature.'}</p>
                </div>
              </div>
              <div className="text-right font-mono text-xs">
                <p>Verification Code:</p>
                <p className="font-bold text-slate-800">SECURE-{selectedInvoiceAuction.id.substring(0, 12).toUpperCase()}</p>
              </div>
            </div>

            {/* Action Buttons (hidden during print) */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <button
                onClick={() => setSelectedInvoiceAuction(null)}
                className="cursor-pointer px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={handlePrintInvoice}
                className="cursor-pointer bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>{isRTL ? 'طباعة / حفظ كملف PDF' : 'Print / Save as PDF'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

