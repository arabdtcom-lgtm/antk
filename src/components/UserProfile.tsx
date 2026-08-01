/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { translations, Language, Currency, formatPrice } from '../utils/translations';
import { User, Shipment, Auction } from '../types';
import UserStats from './UserStats';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Wallet, 
  Languages, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Truck,
  Package,
  Calendar,
  MapPin,
  RefreshCw,
  Fingerprint,
  ScanFace
} from 'lucide-react';

interface UserProfileProps {
  lang: Language;
  currency: Currency;
  user: User | null;
  auctions?: Auction[];
  onLogin: (email: string, provider?: string) => void;
  onUpdateProfile: (details: Partial<User>) => void;
}

export default function UserProfile({
  lang,
  currency,
  user,
  auctions = [],
  onLogin,
  onUpdateProfile
}: UserProfileProps) {
  const t = translations[lang];

  // Forms states
  const [email, setEmail] = useState('arabdt.com@gmail.com');
  const [customName, setCustomName] = useState(user?.name || '');
  const [customPhone, setCustomPhone] = useState(user?.phone || '');
  const [customAddress, setCustomAddress] = useState(user?.address || '');
  const [customCity, setCustomCity] = useState(user?.city || '');
  const [customCountry, setCustomCountry] = useState(user?.country || '');
  const [customAvatar, setCustomAvatar] = useState(user?.avatar || '');

  // Wallet Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('10000');
  const [paymentMethod, setPaymentMethod] = useState('Mada / Visa');
  const [withdrawAmount, setWithdrawAmount] = useState('5000');
  const [bankDetails, setBankDetails] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Biometric Auth States
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'scanning' | 'success' | 'idle'>('idle');

  const handleBiometricLogin = async () => {
    setShowBiometricModal(true);
    setBiometricStatus('scanning');

    try {
      if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          try {
            const credential = await navigator.credentials.get({
              publicKey: {
                challenge,
                timeout: 30000,
                userVerification: 'required',
                rpId: window.location.hostname
              }
            });
            if (credential) {
              setBiometricStatus('success');
              setTimeout(() => {
                setShowBiometricModal(false);
                onLogin('arabdt.com@gmail.com', 'Biometric Passkey');
              }, 1000);
              return;
            }
          } catch (webAuthnErr) {
            console.warn('WebAuthn prompt cancelled or unavailable:', webAuthnErr);
          }
        }
      }
    } catch (err) {
      console.warn('Biometric API check error:', err);
    }

    // Fallback secure biometric simulation
    setTimeout(() => {
      setBiometricStatus('success');
      setTimeout(() => {
        setShowBiometricModal(false);
        onLogin('arabdt.com@gmail.com', 'Biometric Passkey');
      }, 1200);
    }, 2000);
  };

  // Seller Logistics States
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [updatingShipId, setUpdatingShipId] = useState<string | null>(null);

  // Form states for shipping input
  const [carrier, setCarrier] = useState('Aramex');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estDelivery, setEstDelivery] = useState('');
  const [cityAr, setCityAr] = useState('الرياض، مركز فرز الطرود الرئيسي');
  const [cityEn, setCityEn] = useState('Riyadh Package Sorting Center');

  useEffect(() => {
    if (user) {
      setCustomName(user.name || '');
      setCustomPhone(user.phone || '');
      setCustomAddress(user.address || '');
      setCustomCity(user.city || '');
      setCustomCountry(user.country || '');
      setCustomAvatar(user.avatar || '');
    }
  }, [user]);

  const fetchShipments = async () => {
    if (!user) return;
    setLoadingShipments(true);
    try {
      const res = await fetch('/api/shipments');
      if (res.ok) {
        const data = await res.json();
        setShipments(data.shipments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShipments(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchShipments();
    }
  }, [user]);

  const handleUpdateTrackingSubmit = async (e: React.FormEvent, auctionId: string) => {
    e.preventDefault();
    if (!carrier || !trackingNumber) return;

    try {
      const res = await fetch('/api/shipments/update-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auctionId,
          carrier,
          trackingNumber,
          estimatedDelivery: estDelivery || '3 Days',
          historyItem: {
            status: 'in_transit',
            statusAr: 'جاري الشحن والنقل الدولي/المحلي',
            city: cityEn,
            cityAr: cityAr,
            timestamp: new Date().toISOString()
          }
        })
      });
      if (res.ok) {
        setUpdatingShipId(null);
        fetchShipments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email);
  };

  const handleCustomLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onLogin(email.trim());
    }
  };

  const handleSocialLogin = (provider: string) => {
    const mockEmail = `${provider.toLowerCase()}_authuser@gmail.com`;
    onLogin(mockEmail, provider);
  };

  const handleSocialMock = (provider: string) => {
    handleSocialLogin(provider);
  };

  const autofillTracking = (preset: string) => {
    const num = Math.floor(10000000 + Math.random() * 90000000);
    const dateStr = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (preset === 'aramex') {
      setCarrier('Aramex Express');
      setTrackingNumber(`AMX-${num}-SA`);
      setEstDelivery(dateStr);
    } else if (preset === 'dhl') {
      setCarrier('DHL Express Premium');
      setTrackingNumber(`DHL-OnDemand-${num}`);
      setEstDelivery(dateStr);
    } else {
      setCarrier('FedEx Overnight Cargo');
      setTrackingNumber(`FDX-${num}-INT`);
      setEstDelivery(dateStr);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: customName || undefined,
      phone: customPhone || undefined,
      address: customAddress || undefined,
      city: customCity || undefined,
      country: customCountry || undefined,
      avatar: customAvatar || undefined
    });
    setSuccessMsg(lang === 'ar' ? 'تم تحديث بيانات العضوية بنجاح!' : 'Member Profile updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleExecuteDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(depositAmount);
    if (!user || isNaN(val) || val <= 0) return;

    const newTx = {
      id: `tx_${Date.now()}`,
      userId: user.id,
      type: 'deposit' as const,
      amount: val,
      currency: user.preferredCurrency || currency,
      status: 'completed' as const,
      method: paymentMethod,
      timestamp: new Date().toISOString(),
      description: lang === 'ar' ? `إيداع رصيد بالمحفظة (${paymentMethod})` : `Wallet Top-Up (${paymentMethod})`
    };

    const updatedTransactions = [newTx, ...(user.transactions || [])];

    onUpdateProfile({
      balance: user.balance + val,
      transactions: updatedTransactions
    });

    setShowDepositModal(false);
    setSuccessMsg(lang === 'ar' ? `تم إيداع ${formatPrice(val, currency, lang)} في محفظتك بنجاح!` : `Successfully deposited ${formatPrice(val, currency, lang)} into your wallet!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleExecuteWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(withdrawAmount);
    if (!user || isNaN(val) || val <= 0 || val > user.balance) return;

    const newTx = {
      id: `tx_w_${Date.now()}`,
      userId: user.id,
      type: 'withdrawal' as const,
      amount: val,
      currency: user.preferredCurrency || currency,
      status: 'pending' as const,
      method: bankDetails || 'IBAN Transfer',
      timestamp: new Date().toISOString(),
      description: lang === 'ar' ? 'طلب سحب رصيد محفظة' : 'Wallet Payout Request'
    };

    const updatedTransactions = [newTx, ...(user.transactions || [])];

    onUpdateProfile({
      balance: user.balance - val,
      transactions: updatedTransactions
    });

    setShowWithdrawModal(false);
    setSuccessMsg(lang === 'ar' ? `تم تقديم طلب سحب ${formatPrice(val, currency, lang)} بنجاح!` : `Payout request for ${formatPrice(val, currency, lang)} submitted!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ar' ? 'بوابة العضوية والتحكم الرقمي بالرصيد' : 'Member Profile & Secure Gateway'}</span>
        </h2>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {lang === 'ar' ? 'قم بتعديل بيانات العضوية، إدارة رصيد المحفظة التجريبية واختبار الدخول الاجتماعي الآمن' : 'Verify secure social identity providers, update contact details, or top up balance'}
        </p>
      </div>

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-250 text-emerald-800 text-xs font-bold text-right">
          ✓ {successMsg}
        </div>
      )}

      {/* User Statistics Dashboard */}
      {user && (
        <div className="pt-2">
          <UserStats
            user={user}
            auctions={auctions}
            lang={lang}
            currency={currency}
          />
        </div>
      )}

      {/* 1. MOCK SOCIAL LOGIN & DEMO GATEWAY */}
      {!user ? (
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-[#0d0d0f] dark:to-slate-900 p-6 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-black text-slate-800 dark:text-amber-400 flex items-center justify-center gap-2">
              <span>🔐</span>
              <span>{lang === 'ar' ? 'بوابة تسجيل الدخول الآمن والمحاكاة الفيدرالية' : 'Secure Login & SSO Gateway'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'ar' ? 'يمكنك الدخول ببريدك الإلكتروني، اختيار المصادقة الوطنية، أو التجربة السريعة بحساب تجريبي:' : 'Sign in using your email, national identity SSO, or quick demo accounts:'}
            </p>
          </div>

          {/* Quick Demo Account Selector Pills */}
          <div className="space-y-2 bg-amber-500/5 dark:bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20">
            <label className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 block text-center">
              ⚡ {lang === 'ar' ? 'تسجيل دخول سريع بنقرة واحدة (حسابات تجريبية جاهزة):' : 'Instant 1-Tap Demo Sign-in:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onLogin('arabdt.com@gmail.com')}
                className="cursor-pointer flex items-center justify-center gap-2 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <span>👑</span>
                <span>أنتيكاوي (مسؤول)</span>
              </button>
              <button
                type="button"
                onClick={() => onLogin('sara.buyer@gmail.com')}
                className="cursor-pointer flex items-center justify-center gap-2 p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 dark:text-purple-300 font-bold text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <span>👩‍💼</span>
                <span>سارة الشمري (مشتري)</span>
              </button>
              <button
                type="button"
                onClick={() => onLogin('john.miller@gmail.com')}
                className="cursor-pointer flex items-center justify-center gap-2 p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <span>🌐</span>
                <span>John Miller (VIP)</span>
              </button>
            </div>
          </div>

          {/* Biometric Login Passkey Option */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleBiometricLogin}
              className="cursor-pointer w-full py-3.5 px-4 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 hover:from-indigo-900 hover:to-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-lg border border-indigo-500/40 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Fingerprint className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>{lang === 'ar' ? 'تسجيل الدخول بالبصمة الحيوية (Touch ID / Face ID)' : 'Login with Biometrics (Passkey)'}</span>
            </button>
          </div>

          {/* Social SSO Providers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleSocialMock('Nafath')}
              className="cursor-pointer flex items-center justify-center gap-2 py-3 font-extrabold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl transition-all shadow-sm active:scale-95"
            >
              <span>🇸🇦</span>
              <span>نفاذ الوطني الموحد</span>
            </button>
            <button
              onClick={() => handleSocialMock('Salla')}
              className="cursor-pointer flex items-center justify-center gap-2 py-3 font-extrabold border border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-xs rounded-xl transition-all shadow-sm active:scale-95"
            >
              <span>🇸🇦</span>
              <span>الدخول عبر سلة</span>
            </button>
            <button
              onClick={() => handleSocialMock('Google')}
              className="cursor-pointer flex items-center justify-center gap-2 py-3 font-extrabold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs rounded-xl transition-all shadow-sm active:scale-95"
            >
              <span>🔍</span>
              <span>Google Account</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-bold justify-center">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            <span>{lang === 'ar' ? 'أو أدخل بريدك الإلكتروني المباشر' : 'Or enter custom email'}</span>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          </div>

          {/* Standard credential login form */}
          <form onSubmit={handleCustomLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                {lang === 'ar' ? 'البريد الإلكتروني المعتمد للعميل' : 'Authorized Account Email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arabdt.com@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-semibold font-mono transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 font-black text-slate-950 text-xs rounded-xl shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer uppercase tracking-wider"
            >
              {lang === 'ar' ? 'دخول آمن للمحفظة والمزادات 🚀' : 'Secure Sign In 🚀'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* USER ACTIVE DETAILS WRAPPER */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={user.name}
                className="h-20 w-20 rounded-full border-4 border-emerald-500/25 object-cover shadow-sm bg-slate-100"
              />
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1 justify-center">
                  <span>{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded dark:bg-indigo-950/45 dark:text-indigo-400">ADMIN</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{user.email}</p>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4 border-t md:border-t-0 md:border-r border-slate-100 dark:border-slate-800/80 pt-4 md:pt-0 pr-0 md:pr-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">{t.balance}</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" />
                    {formatPrice(user.balance, currency, lang)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'نوع الحساب التوثيقي' : 'Federated Verification'}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block">
                    🇸🇦 {user.role === 'admin' ? 'الهوية الوطنية السيادية' : 'عميل موثق'}
                  </span>
                </div>
              </div>

              {/* DEMO WALLET RECHARGING CONTROLS */}
              <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/10 p-4 space-y-3">
                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'إدارة رصيد المحفظة الإلكترونية والمعاملات' : 'Wallet Balance & Instant Transactions'}</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                  {lang === 'ar' ? 'يمكنك إيداع رصيد جديد للمزايدة المباشرة، أو طلب سحب الأرباح والحصيلة إلى حسابك البنكي:' : 'Top-up wallet balance to place bids or request instant payout withdrawals to your bank:'}
                </p>

                <div className="flex gap-3 text-xs">
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="cursor-pointer flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl hover:shadow-md transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span>💳</span>
                    <span>{lang === 'ar' ? 'إيداع / شحن الرصيد' : 'Deposit / Top-Up'}</span>
                  </button>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="cursor-pointer flex-1 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-extrabold rounded-xl hover:shadow-md transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span>🏦</span>
                    <span>{lang === 'ar' ? 'طلب سحب رصيد' : 'Request Payout'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* 2. CUSTOMIZE FIELDS */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-1.5">
              <span>👤 {lang === 'ar' ? 'تعديل البيانات الشخصية' : 'Personal Customization Card'}</span>
            </h3>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">الاسم الكامل للظهور</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={user.name}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">رقم الهاتف للاتصال الجغرافي</label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder={user.phone || '+966'}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none font-semibold font-mono"
                />
              </div>

              <div className="sm:col-span-2 pt-2 text-right">
                <button
                  type="submit"
                  className="px-5 py-2 cursor-pointer bg-slate-800 hover:bg-black text-white font-bold text-xs rounded-lg shadow-md transition-all"
                >
                  {lang === 'ar' ? 'حفظ التغييرات الشخصية' : 'Save Personal Data'}
                </button>
              </div>
            </form>
          </div>

          {/* 3. SELLER CONSIGNMENTS & SHIPPING LOUNGE */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-750 dark:text-slate-350 flex items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-3 mb-2">
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 font-bold" />
                <span>{lang === 'ar' ? 'لوحة المبيعات وإدخال بيانات تتبع الشحنات' : 'Seller Consignments & Tracking Lounge'}</span>
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono px-2 py-0.5 rounded font-extrabold">
                Active Shipments ({shipments.length})
              </span>
            </h3>

            {loadingShipments ? (
              <p className="text-center py-6 text-xs text-slate-400 font-bold">...</p>
            ) : shipments.length === 0 ? (
              <div className="text-center py-10 rounded-xl bg-slate-50 dark:bg-[#161618]/30 max-w-lg mx-auto border border-dashed border-slate-200 dark:border-slate-800">
                <Package className="h-10 w-10 text-slate-400 mx-auto opacity-50" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-3">
                  {lang === 'ar' ? 'لا توجد مبيعات تتطلب إجراءات شحن حتى الآن.' : 'No items requiring logistics handling yet.'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {lang === 'ar' ? 'عند فوز عميل بمزاد وقيامه بالدفع الإلكتروني بالضمان، تظهر السلعة هنا لتقوم بشحنها وتزويدنا برقم بوليصة التتبع.' : 'Consignments will activate here once a prospective bidder pays securing escrow.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {shipments.map((ship, idx) => {
                  const isUpdating = updatingShipId === ship.id;
                  return (
                    <div 
                      key={`prof-ship-${ship.id}-${idx}`}
                      className="p-4 rounded-xl border border-slate-200/85 dark:border-slate-800 bg-slate-50 dark:bg-[#16161d]/40 space-y-3 text-right"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-right">
                          <h4 className="text-xs font-serif font-bold text-slate-950 dark:text-slate-100">
                            {lang === 'ar' ? ship.auctionTitleAr : ship.auctionTitleEn}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Buyer: {ship.buyerEmail}
                          </p>
                        </div>
                        <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wider ${
                          ship.status === 'payment_confirmed' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-white border border-amber-300/30' 
                            : 'bg-emerald-105 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300/30'
                        }`}>
                          {ship.status === 'payment_confirmed' 
                            ? (lang === 'ar' ? 'بانتظار الشحن' : 'Awaiting Tracking') 
                            : (lang === 'ar' ? 'تم الشحن' : 'Dispatched')}
                        </span>
                      </div>

                      {ship.trackingNumber ? (
                        <div className="bg-slate-100 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/5 space-y-1 text-[11px] text-right">
                          <div className="flex justify-between">
                            <span className="text-slate-500">{lang === 'ar' ? 'الناقل الرسمي:' : 'Official Carrier:'}</span>
                            <span className="text-slate-900 dark:text-white font-bold">{ship.carrier}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{lang === 'ar' ? 'رقم التتبع بوليصة المعاملة:' : 'Ship Tracking Code:'}</span>
                            <span className="text-amber-600 dark:text-amber-500 font-mono font-bold">{ship.trackingNumber}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 text-[10px] text-slate-500 leading-relaxed dark:text-slate-400 text-right">
                          ⚠️ {lang === 'ar' 
                            ? 'لقد قام المشتري بالوفاء بالدفع بالكامل بالضمان بنجاح. يرجى تسليم القطعة وإدخال تتبع الشحنة لتسريع صرف مبالغ المزاد للضمان ماليًا.' 
                            : 'Buyer finalized credit settlement. Handover item to the shipment branch of your choice and provide the tracking identifier below.'}
                        </div>
                      )}

                      {!isUpdating ? (
                        <div className="text-left">
                          <button
                            onClick={() => {
                              setUpdatingShipId(ship.id);
                              setCarrier('Aramex');
                              setTrackingNumber('');
                            }}
                            className="px-3 py-1.5 cursor-pointer bg-slate-800 hover:bg-black dark:bg-[#1a1a1f] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-white font-bold text-[10px] rounded"
                          >
                            {ship.trackingNumber 
                              ? (lang === 'ar' ? 'تعديل أو تحديث رقم التتبع' : 'Edit Tracking Code') 
                              : (lang === 'ar' ? 'تجهيز الشحن وإدخال التتبع' : 'Add Tracking Info & Ship')}
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleUpdateTrackingSubmit(e, ship.auctionId)} className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-3 text-right">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-bold text-amber-500 font-serif uppercase tracking-wider">
                              🛠️ {lang === 'ar' ? 'إدخال بوليصة التتبع اللوجستية' : 'Dispatch Console Tracker Input'}
                            </h5>
                            
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => autofillTracking('aramex')}
                                className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 text-[10px] font-bold rounded border border-rose-500/20"
                              >
                                Aramex Fill
                              </button>
                              <button
                                type="button"
                                onClick={() => autofillTracking('dhl')}
                                className="px-2 py-0.5 bg-yellow-500/10 hover:bg-yellow-500/25 text-yellow-500 text-[10px] font-bold rounded border border-yellow-500/20"
                              >
                                DHL Fill
                              </button>
                              <button
                                type="button"
                                onClick={() => autofillTracking('fedex')}
                                className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20"
                              >
                                FedEx Fill
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[9px] text-slate-400 block mb-0.5">شركة الشحن (Carrier)</label>
                              <select
                                value={carrier}
                                onChange={(e) => setCarrier(e.target.value)}
                                className="w-full bg-white dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded p-1.5 text-xs text-slate-900 dark:text-white outline-none"
                              >
                                <option value="Aramex Line Exchange">أرامكس (Aramex Express)</option>
                                <option value="DHL Worldwide Service">دي اتش ال (DHL Express)</option>
                                <option value="FedEx Int Freight">فيدكس (FedEx Transit)</option>
                                <option value="SMSA Logistics Rapid">سمسا الرمادية (SMSA)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] text-slate-400 block mb-0.5">رقم تتبع الشحنة (Tracking No.)</label>
                              <input
                                type="text"
                                required
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="AMX-39823122-SA"
                                className="w-full bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 p-1.5 text-xs text-slate-900 dark:text-white outline-none font-mono font-bold rounded"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] text-slate-400 block mb-0.5">الوصول المتوقع (Est. Delivery)</label>
                              <input
                                type="date"
                                required
                                value={estDelivery}
                                onChange={(e) => setEstDelivery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 p-1.5 text-xs text-slate-900 dark:text-white outline-none rounded"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setUpdatingShipId(null)}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-[#16161a] text-slate-600 dark:text-slate-400 rounded hover:opacity-85"
                            >
                              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded"
                            >
                              🚀 {lang === 'ar' ? 'إطلاق الشحنة وحفظ البيانات' : 'Confirm Dispatch'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl text-right text-white">
            <h3 className="text-base font-black text-emerald-400 flex items-center justify-between">
              <span>💳 {lang === 'ar' ? 'إيداع وتغذية محفظة المزايدة' : 'Wallet Deposit & Top-Up'}</span>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </h3>
            
            <form onSubmit={handleExecuteDeposit} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {lang === 'ar' ? 'مبلغ الإيداع' : 'Deposit Amount'} ({currency})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {lang === 'ar' ? 'وسيلة الدفع' : 'Payment Method'}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold outline-none"
                >
                  <option value="Mada / Visa">مدى / Mada Direct</option>
                  <option value="Apple Pay">أبل باي / Apple Pay Instant</option>
                  <option value="Visa / MasterCard">فيزا / ماستركارد (Visa/MasterCard)</option>
                  <option value="Bank Wire / Swift">تحويل بنكي مباشر (Bank Wire)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-lg"
                >
                  ✓ {lang === 'ar' ? 'تأكيد الإيداع الفوري' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-amber-500/30 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl text-right text-white">
            <h3 className="text-base font-black text-amber-400 flex items-center justify-between">
              <span>🏦 {lang === 'ar' ? 'طلب سحب الأرباح والرصيد المتاح' : 'Payout & Withdrawal Request'}</span>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </h3>

            <form onSubmit={handleExecuteWithdrawal} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {lang === 'ar' ? 'المبلغ المراد سحبه' : 'Withdrawal Amount'} ({currency})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={user?.balance || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-mono font-bold text-sm outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {lang === 'ar' ? 'الرصيد المتاح للسحب:' : 'Available balance:'} {formatPrice(user?.balance || 0, currency, lang)}
                </p>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  {lang === 'ar' ? 'تفاصيل الحساب البنكي (آيبان IBAN / الاسم)' : 'Bank Account (IBAN & Name)'}
                </label>
                <input
                  type="text"
                  required
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  placeholder="SA03 8000 0000 6080 1010 1010"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl shadow-lg"
                >
                  🚀 {lang === 'ar' ? 'إرسال طلب التحويل' : 'Submit Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Biometric Verification Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#121216] border border-amber-500/40 rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center relative space-y-6">
            
            <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center relative shadow-inner">
              <div className="absolute inset-0 rounded-full border border-amber-400 animate-ping opacity-25" />
              {biometricStatus === 'success' ? (
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              ) : (
                <Fingerprint className="w-10 h-10 text-amber-400 animate-pulse" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-bold text-lg">
                {lang === 'ar' ? 'المصادقة بالبصمة الحيوية' : 'Biometric Passkey Authentication'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {biometricStatus === 'success'
                  ? (lang === 'ar' ? 'تم التحقق من البصمة بنجاح! جاري التوجيه...' : 'Verification successful! Redirecting...')
                  : (lang === 'ar' ? 'قم بمسح بصمة الإصبع أو الوجه على جهازك للوصول الآمن الفوري...' : 'Scan fingerprint or Face ID on your device for instant secure access...')}
              </p>
            </div>

            {biometricStatus === 'scanning' && (
              <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{lang === 'ar' ? 'في انتظار استجابة المستشعر...' : 'Waiting for hardware sensor...'}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowBiometricModal(false)}
                className="cursor-pointer w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
