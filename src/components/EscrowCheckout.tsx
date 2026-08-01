/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Auction, User, EscrowTransaction, Shipment } from '../types';
import { Language, Currency, formatPrice, translations } from '../utils/translations';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Lock,
  DollarSign,
  Clock,
  Send,
  X,
  Award,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { releaseEscrowInFirestore, updateTrackingInFirestore, disputeEscrowInFirestore } from '../utils/firebase';

interface EscrowCheckoutProps {
  auction: Auction;
  user: User | null;
  escrow: EscrowTransaction | null;
  shipment: Shipment | null;
  lang: Language;
  currency: Currency;
  onUpdate: () => void;
}

export default function EscrowCheckout({
  auction,
  user,
  escrow,
  shipment,
  lang,
  currency,
  onUpdate
}: EscrowCheckoutProps) {
  const t = translations[lang];
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tracking form states
  const [carrier, setCarrier] = useState(shipment?.carrier || 'Aramex Express');
  const [trackingNumber, setTrackingNumber] = useState(shipment?.trackingNumber || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(shipment?.estimatedDelivery || '');
  const [showTrackingForm, setShowTrackingForm] = useState(false);

  // Dispute form states
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const isBuyer = user?.email && auction.highBidder === user.email;
  const isSeller = user?.email && ((auction.sellerEmail && auction.sellerEmail === user.email) || (auction.seller?.name === user.name));
  const isAdmin = user?.role === 'admin';

  const seller = auction.seller || {
    name: 'أنتيكاوي',
    rating: 5.0,
    verified: true
  };

  // Determine active escrow status
  const currentStatus = escrow?.status || (shipment?.status === 'received' ? 'released' : shipment?.status === 'dispatched' ? 'dispatched' : 'held');

  // Submit tracking details (seller or admin)
  const handleUpdateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال رقم تتبع صحيح' : 'Please enter a valid tracking number');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (user) {
        const result = await updateTrackingInFirestore(auction.id, carrier, trackingNumber, user);
        if (result.success) {
          setSuccessMsg(lang === 'ar' ? 'تم تحديث بيانات التتبع والشحن بنجاح!' : 'Tracking info updated successfully!');
          setShowTrackingForm(false);
          onUpdate();
        } else {
          setErrorMsg(result.messageAr);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating tracking info');
    } finally {
      setLoading(false);
    }
  };

  // Confirm receipt and release funds (buyer or admin)
  const handleReleaseFunds = async () => {
    if (!window.confirm(lang === 'ar' ? 'هل تؤكد استلام السلعة وسرعة الإفراج عن مبلغ الضمان للبائع؟' : 'Confirm receipt of item and release escrow funds to seller?')) {
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (user && escrow) {
        const res = await releaseEscrowInFirestore(escrow.id, user);
        if (res.success) {
          setSuccessMsg(lang === 'ar' ? res.messageAr : res.messageEn);
          onUpdate();
        } else {
          setErrorMsg(lang === 'ar' ? res.messageAr : res.messageEn);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error releasing funds');
    } finally {
      setLoading(false);
    }
  };

  // File dispute (buyer)
  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى كتابة سبب النزاع بالتفصيل' : 'Please describe the reason for dispute');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (user && escrow) {
        const res = await disputeEscrowInFirestore(escrow.id, user, disputeReason);
        if (res.success) {
          setSuccessMsg(lang === 'ar' ? res.messageAr : res.messageEn);
          setShowDisputeForm(false);
          onUpdate();
        } else {
          setErrorMsg(lang === 'ar' ? res.messageAr : res.messageEn);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error filing dispute');
    } finally {
      setLoading(false);
    }
  };

  // Financial calculations in $ USD
  const hammerPriceUSD = escrow?.amountUSD || escrow?.amount || auction.currentPrice;
  const escrowFeeUSD = Math.round(hammerPriceUSD * 0.025 * 100) / 100;
  const shippingFeeUSD = 25.00;
  const totalUSD = hammerPriceUSD + escrowFeeUSD + shippingFeeUSD;

  return (
    <div className="rounded-2xl bg-[#0d0d0f] border border-white/10 p-5 sm:p-6 space-y-6 shadow-2xl">
      {/* Header & Escrow Shield Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-wide font-serif">
                {lang === 'ar' ? 'نظام الضمان المالي الموحد ($ USD)' : 'Unified Escrow Vault ($ USD)'}
              </h3>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                Protected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'ar'
                ? 'الأموال محجوزة بحساب الضمان المالي الموحد ولن يتم الإفراج عنها للبائع حتى استلام السلعة'
                : 'Funds held in secure escrow vault; released to seller only upon verified item receipt'}
            </p>
          </div>
        </div>

        {/* Invoice Modal Button */}
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="cursor-pointer flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <FileText className="h-4 w-4" />
          <span>{lang === 'ar' ? 'عرض الفاتورة ($ USD)' : 'View Invoice ($ USD)'}</span>
        </button>
      </div>

      {/* Seller Verification Badge & Information */}
      <div className="bg-[#161618] rounded-xl p-4 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm">
            {seller.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{seller.name}</span>
              {seller.verified && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                  <Award className="h-3 w-3" />
                  {lang === 'ar' ? 'بائع معتمد موثق' : 'Verified Seller'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ⭐ {seller.rating || 5.0} / 5.0 — {lang === 'ar' ? 'تاجر موثق في نظام المزادات الفيدرالي' : 'Verified Merchant Partner'}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right font-mono">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
            {lang === 'ar' ? 'المبلغ المحجوز بالضمان' : 'Total Escrow Held'}
          </span>
          <span className="text-sm font-black text-emerald-400">
            {formatPrice(hammerPriceUSD, 'USD', lang)}
          </span>
        </div>
      </div>

      {/* State Machine Lifecycle Timeline Widget */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest font-serif flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          {lang === 'ar' ? 'مراحل حالة الضمان والشحن' : 'Escrow State Machine Lifecycle'}
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* State 1: Held */}
          <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${['held', 'dispatched', 'delivered', 'released'].includes(currentStatus)
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-white/5 border-white/5 text-slate-500'
            }`}>
            <Lock className="h-4 w-4 mb-1" />
            <span className="text-[10px] font-bold uppercase">{lang === 'ar' ? '1. حجز الضمان' : '1. Held'}</span>
            <span className="text-[9px] text-slate-400 mt-0.5">{lang === 'ar' ? 'تم دفع وتأمين المبلغ' : 'Funds Secured'}</span>
          </div>

          {/* State 2: Dispatched */}
          <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${['dispatched', 'delivered', 'released'].includes(currentStatus)
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
              : 'bg-white/5 border-white/5 text-slate-500'
            }`}>
            <Truck className="h-4 w-4 mb-1" />
            <span className="text-[10px] font-bold uppercase">{lang === 'ar' ? '2. تم الشحن' : '2. Dispatched'}</span>
            <span className="text-[9px] text-slate-400 mt-0.5">{shipment?.trackingNumber || (lang === 'ar' ? 'بانتظار رقم التتبع' : 'Awaiting Tracking')}</span>
          </div>

          {/* State 3: Delivered */}
          <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${['delivered', 'released'].includes(currentStatus)
              ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
              : 'bg-white/5 border-white/5 text-slate-500'
            }`}>
            <Send className="h-4 w-4 mb-1" />
            <span className="text-[10px] font-bold uppercase">{lang === 'ar' ? '3. تم التسليم' : '3. Delivered'}</span>
            <span className="text-[9px] text-slate-400 mt-0.5">{lang === 'ar' ? 'فحص السلعة' : 'Item Inspection'}</span>
          </div>

          {/* State 4: Released */}
          <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${currentStatus === 'released'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : currentStatus === 'disputed'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                : 'bg-white/5 border-white/5 text-slate-500'
            }`}>
            {currentStatus === 'disputed' ? <AlertTriangle className="h-4 w-4 mb-1 text-rose-400" /> : <CheckCircle2 className="h-4 w-4 mb-1" />}
            <span className="text-[10px] font-bold uppercase">
              {currentStatus === 'disputed' ? (lang === 'ar' ? 'متنازع عليه' : 'Disputed') : (lang === 'ar' ? '4. تحرير الأموال' : '4. Released')}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">
              {currentStatus === 'disputed' ? (lang === 'ar' ? 'قيد مراجعة الإدارة' : 'Under Review') : (lang === 'ar' ? 'تحويل للبائع' : 'Paid to Seller')}
            </span>
          </div>

          {/* State 5: Invoice / Receipt */}
          <div
            onClick={() => setShowInvoiceModal(true)}
            className="cursor-pointer p-3 rounded-xl border bg-white/5 border-white/10 hover:border-amber-500/50 flex flex-col items-center justify-center text-center text-slate-300 hover:text-amber-400 transition-all"
          >
            <FileText className="h-4 w-4 mb-1 text-amber-500" />
            <span className="text-[10px] font-bold uppercase">{lang === 'ar' ? '5. الفاتورة' : '5. Invoice'}</span>
            <span className="text-[9px] font-mono text-amber-400 mt-0.5">$ USD Receipt</span>
          </div>
        </div>
      </div>

      {/* Messages / Alerts */}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ACTION CONTROLS FOR SELLER, BUYER, ADMIN */}
      <div className="pt-2 border-t border-white/5 space-y-4">
        {/* Tracking Details Banner if shipped */}
        {shipment?.trackingNumber && (
          <div className="bg-[#161618] p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-blue-400" />
                {lang === 'ar' ? 'بيانات بوليصة الشحن اللوجستي:' : 'Active Logistics Shipment:'}
              </span>
              <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                {shipment.carrier}
              </span>
            </div>
            <div className="flex justify-between items-center font-mono text-xs text-slate-300 pt-1">
              <span>{lang === 'ar' ? 'رقم التتبع:' : 'Tracking #:'} <strong className="text-white">{shipment.trackingNumber}</strong></span>
              {shipment.estimatedDelivery && (
                <span className="text-slate-400 text-[11px]">
                  {lang === 'ar' ? 'التسليم المتوقع:' : 'Est. Delivery:'} {shipment.estimatedDelivery}
                </span>
              )}
            </div>
          </div>
        )}

        {/* SELLER CONTROLS: Input tracking number */}
        {(isSeller || isAdmin) && currentStatus !== 'released' && currentStatus !== 'refunded' && (
          <div>
            {!showTrackingForm ? (
              <button
                onClick={() => setShowTrackingForm(true)}
                className="w-full cursor-pointer py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" />
                <span>{shipment?.trackingNumber ? (lang === 'ar' ? 'تحديث رقم التتبع والناقل' : 'Update Tracking Info') : (lang === 'ar' ? 'إدخال رقم تتبع الشحنة (للبائع)' : 'Add Tracking Number (Seller)')}</span>
              </button>
            ) : (
              <form onSubmit={handleUpdateTracking} className="bg-[#161618] p-4 rounded-xl border border-blue-500/30 space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Truck className="h-4 w-4" />
                  {lang === 'ar' ? 'إدخال بيانيات الناقل والشحنة' : 'Seller Shipment Tracking Registration'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      {lang === 'ar' ? 'الناقل الرسمي' : 'Official Carrier'}
                    </label>
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full bg-[#0a0a0b] text-xs font-bold border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                    >
                      <option value="Aramex Express">Aramex Express (أرامكس)</option>
                      <option value="DHL Express">DHL Express (دي إتش إل)</option>
                      <option value="FedEx Express">FedEx Express (فيديكس)</option>
                      <option value="SMSA Express">SMSA Express (سمسا)</option>
                      <option value="Local Courier">Local Courier (ناقل محلي)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      {lang === 'ar' ? 'رقم التتبع البوليصة' : 'Tracking Number'}
                    </label>
                    <input
                      type="text"
                      required
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="AMX-981234-SA"
                      className="w-full bg-[#0a0a0b] text-xs font-mono font-bold border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    {lang === 'ar' ? 'التاريخ المتوقع للتسليم' : 'Estimated Delivery Date'}
                  </label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full bg-[#0a0a0b] text-xs font-mono border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 cursor-pointer py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>{lang === 'ar' ? 'حفظ وتحديث الشحنة' : 'Save Tracking'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTrackingForm(false)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs rounded-lg border border-white/10"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* BUYER CONTROLS: Confirm delivery / Release funds or File Dispute */}
        {(isBuyer || isAdmin) && currentStatus !== 'released' && currentStatus !== 'refunded' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReleaseFunds}
              disabled={loading}
              className="flex-1 cursor-pointer py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{lang === 'ar' ? 'تأكيد الاستلام والإفراج المالي ($ USD)' : 'Confirm Receipt & Release Funds ($ USD)'}</span>
            </button>

            {currentStatus !== 'disputed' && (
              <button
                onClick={() => setShowDisputeForm(!showDisputeForm)}
                className="cursor-pointer py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تقديم اعتراض / نزاع' : 'File Dispute'}</span>
              </button>
            )}
          </div>
        )}

        {/* Dispute Form (Buyer) */}
        {showDisputeForm && (
          <form onSubmit={handleFileDispute} className="bg-[#161618] p-4 rounded-xl border border-rose-500/30 space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              {lang === 'ar' ? 'تقديم اعتراض رسمي وإيقاف حجز الضمان' : 'File Official Dispute & Freeze Escrow'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {lang === 'ar'
                ? 'سيتم تجميد مبالغ الضمان فوراً وإبلاغ فريق الإدارة لمراجعة حالة السلعة أو الشحنة.'
                : 'Freezes escrow funds immediately for administrative dispute review.'}
            </p>
            <textarea
              required
              rows={3}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder={lang === 'ar' ? 'اشرح تفاصيل المشكلة (تلف الطرد / عدم المطابقة / تأخر الشحنة)...' : 'Explain issue details (damaged package, wrong item, delivery delay)...'}
              className="w-full bg-[#0a0a0b] text-xs border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-rose-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 cursor-pointer py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>{lang === 'ar' ? 'إرسال طلب الاعتراض' : 'Submit Dispute'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDisputeForm(false)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs rounded-lg border border-white/10"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* PRINTABLE $ USD INVOICE / RECEIPT MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative font-sans text-left" style={{ direction: 'ltr' }}>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black font-serif text-slate-900 tracking-wider">
                  ANTKAWY ESCROW INVOICE
                </h2>
                <p className="text-xs font-mono text-slate-500">
                  Invoice #: {escrow?.invoiceNumber || `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`}
                </p>
                <p className="text-[11px] text-slate-400">
                  Issued: {escrow?.createdAt ? new Date(escrow.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* QR Code */}
                <div className="p-1 bg-white border border-slate-200 rounded">
                  <QRCode value={`https://antkawy.com/escrow/invoice/${escrow?.id || auction.id}`} size={64} />
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="cursor-pointer p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Buyer & Seller Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Buyer Details</span>
                <p className="font-bold text-slate-900 mt-0.5">{escrow?.buyerName || auction.highBidderName || 'Registered Buyer'}</p>
                <p className="font-mono text-slate-600 text-[11px]">{escrow?.buyerEmail || user?.email || auction.highBidder}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Seller Details</span>
                <p className="font-bold text-slate-900 mt-0.5">{seller.name}</p>
                <p className="font-mono text-slate-600 text-[11px]">{auction.sellerEmail || 'seller.verified@antkawy.com'}</p>
                {seller.verified && (
                  <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                    ✓ Verified Merchant
                  </span>
                )}
              </div>
            </div>

            {/* Itemized Table ($ USD) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Amount ($ USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
                  <tr>
                    <td className="p-3 font-sans">
                      <p className="font-bold text-slate-900">{auction.titleEn || auction.titleAr}</p>
                      <p className="text-[10px] text-slate-500">Auction ID: {auction.id}</p>
                    </td>
                    <td className="p-3 text-right font-bold">1</td>
                    <td className="p-3 text-right font-bold">${hammerPriceUSD.toFixed(2)} USD</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans text-slate-600">Escrow Protection & Vault Fee (2.5%)</td>
                    <td className="p-3 text-right">1</td>
                    <td className="p-3 text-right">${escrowFeeUSD.toFixed(2)} USD</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans text-slate-600">Insured Express Logistics Shipping</td>
                    <td className="p-3 text-right">1</td>
                    <td className="p-3 text-right">${shippingFeeUSD.toFixed(2)} USD</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-900 text-white font-mono font-bold text-sm">
                  <tr>
                    <td colSpan={2} className="p-3 text-right uppercase text-xs">Total Paid in Escrow:</td>
                    <td className="p-3 text-right text-emerald-400">${totalUSD.toFixed(2)} USD</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Escrow Audit Status Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-4">
              <div>
                <span>Payment Method: <strong>{escrow?.paymentMethod || 'Credit Card / Escrow Vault'}</strong></span>
                <span className="block font-mono text-[10px]">Vault Status: {currentStatus.toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
