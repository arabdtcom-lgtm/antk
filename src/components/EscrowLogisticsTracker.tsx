/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EscrowTransaction, Shipment } from '../types';
import { Language, Currency, formatPrice } from '../utils/translations';
import { 
  Lock, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface EscrowLogisticsTrackerProps {
  escrow?: EscrowTransaction | null;
  shipment?: Shipment | null;
  lang: Language;
  currency: Currency;
}

export default function EscrowLogisticsTracker({
  escrow,
  shipment,
  lang,
  currency
}: EscrowLogisticsTrackerProps) {
  const isAr = lang === 'ar';

  // Determine active milestone step (1 to 5)
  let currentStep = 1;
  if (escrow?.status === 'held') currentStep = 1;
  if (shipment?.status === 'payment_confirmed') currentStep = 2;
  if (shipment?.status === 'dispatched' || shipment?.status === 'in_transit') currentStep = 3;
  if (shipment?.status === 'delivered' || shipment?.status === 'received') currentStep = 4;
  if (escrow?.status === 'released') currentStep = 5;

  const steps = [
    {
      id: 1,
      titleAr: 'حجز الأموال بالضمان',
      titleEn: 'Escrow Funds Locked',
      descAr: 'الأموال آمنة ومحفوطة في حساب الضمان التابع للمنصة',
      descEn: 'Funds secured in platform escrow',
      icon: Lock
    },
    {
      id: 2,
      titleAr: 'التغليف والتجهيز',
      titleEn: 'Packaging & Prep',
      descAr: 'البائع يقوم بتغليف التحفة وتجهيز الوثائق بالأختام',
      descEn: 'Seller packaging item with seals',
      icon: Package
    },
    {
      id: 3,
      titleAr: 'الشحن الدولي/المحلي',
      titleEn: 'In Transit',
      descAr: shipment?.trackingNumber ? `رقم التتبع: ${shipment.trackingNumber}` : 'جاري نقل القطعة عبر شركة الشحن المعتمدة',
      descEn: shipment?.trackingNumber ? `Tracking: ${shipment.trackingNumber}` : 'Item dispatched with insured courier',
      icon: Truck
    },
    {
      id: 4,
      titleAr: 'التسليم والمعاينة',
      titleEn: 'Delivery & Inspection',
      descAr: 'استلام المشتري للقطعة وفحص مطابقة المواصفات',
      descEn: 'Buyer inspecting physical item',
      icon: CheckCircle2
    },
    {
      id: 5,
      titleAr: 'الإفراج المالي للبائع',
      titleEn: 'Funds Released',
      descAr: 'تحويل كامل المبلغ لمحفظة البائع بعد تأكيد الرضا',
      descEn: 'Funds deposited to seller balance',
      icon: DollarSign
    }
  ];

  return (
    <div className="bg-[#121218] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl my-6">
      
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {isAr ? 'مسار حماية الضمان وتتبع الشحنة المباشر' : 'Escrow Milestone & Delivery Timeline'}
            </h3>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'نظام الحماية المزدوج للمشتري والبائع' : 'Real-time 2-way buyer & seller protection'}
            </p>
          </div>
        </div>

        {escrow && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">{isAr ? 'المبلغ المؤمن:' : 'Secured Amount:'}</span>
            <span className="text-sm font-extrabold font-mono text-emerald-400">
              {formatPrice(escrow.amount, currency, lang)}
            </span>
          </div>
        )}
      </div>

      {/* Visual Timeline Steps Horizontal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div 
              key={step.id}
              className={`flex md:flex-col items-center md:items-start gap-3 p-3 rounded-xl border transition-all ${
                isCurrent 
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/40 shadow-lg' 
                  : isCompleted 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-white/5 border-white/5 text-slate-500 opacity-60'
              }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                isCurrent 
                  ? 'bg-amber-500 text-black shadow-md' 
                  : isCompleted 
                  ? 'bg-emerald-500 text-black' 
                  : 'bg-white/10 text-slate-400'
              }`}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono font-bold opacity-75">#{step.id}</span>
                  <h4 className="text-xs font-bold truncate">{isAr ? step.titleAr : step.titleEn}</h4>
                </div>
                <p className="text-[10px] leading-relaxed opacity-80 mt-0.5 line-clamp-2">
                  {isAr ? step.descAr : step.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
