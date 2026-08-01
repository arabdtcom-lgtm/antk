/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { translations, Language, Currency, formatPrice } from './utils/translations';
import { Auction, User } from './types';
import Navbar from './components/Navbar';
import AuctionCard from './components/AuctionCard';
import AuctionSkeletonCard from './components/AuctionSkeletonCard';
import AuctionDetails from './components/AuctionDetails';
import FloatingLanguageToggle from './components/FloatingLanguageToggle';
import { ToastContainer, useToast } from './components/Toast';
import { audioSynth } from './utils/audio';
import { motion, AnimatePresence } from 'motion/react';

// Lazy-loaded components for optimal bundle splitting
const CreateAuction = lazy(() => import('./components/CreateAuction'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const CustomerSystem = lazy(() => import('./components/CustomerSystem'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Messages = lazy(() => import('./components/Messages'));
const ValuationCalculator = lazy(() => import('./components/ValuationCalculator'));
const CollectorRoiCalculator = lazy(() => import('./components/CollectorRoiCalculator'));
const BiddingSimulatorArena = lazy(() => import('./components/BiddingSimulatorArena'));
const AuctionCalendar = lazy(() => import('./components/AuctionCalendar'));
const CookieConsentBanner = lazy(() => import('./components/CookieConsentBanner'));

// Minimal loading spinner fallback
const ViewFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
  </div>
);

import { fetchAuctionsFromFirestore, DEMO_USERS, loginUser, getSessionUser, saveSessionUser, clearSessionUser } from './utils/firebase';
import { 
  Search, 
  Layers, 
  Flame, 
  Volume2, 
  VolumeX, 
  Lock, 
  Info,
  SlidersHorizontal,
  ChevronDown,
  Inbox,
  Sparkles,
  Smartphone,
  Car,
  Palette,
  Home,
  Watch,
  Heart,
  Scan,
  Camera,
  QrCode,
  X
} from 'lucide-react';

export default function App() {
  // Toast Notification Hook
  const { toasts, dismiss, success, info } = useToast();

  // Localization & Currency states
  const [lang, setLang] = useState<Language>('ar');
  const [currency, setCurrency] = useState<Currency>('SAR');
  const [darkMode, setDarkMode] = useState(true);
  const [muteSound, setMuteSound] = useState(false);

  // Authentication state
  const [user, setUser] = useState<User | null>(null);

  // Layout navigation states
  const [activeTab, setActiveTab] = useState<string>('auctions');
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [valuationDraft, setValuationDraft] = useState<any>(null);

  // Collection states
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState<boolean>(true);

  // Keep references of state for non-spammable EventSource closures to prevent "Failed to fetch" connection exhaustions
  const langRef = useRef(lang);
  const muteSoundRef = useRef(muteSound);
  const auctionsRef = useRef(auctions);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    muteSoundRef.current = muteSound;
  }, [muteSound]);

  useEffect(() => {
    auctionsRef.current = auctions;
  }, [auctions]);

  const [categories, setCategories] = useState<string[]>([
    'فنون وأنتيك ملوكي',
    'وثائق ومستندات تاريخية',
    'ساعات ومجوهرات فاخرة',
    'سيارات ومحركات',
    'عقارات وأراضي'
  ]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'ending-soonest' | 'lowest-price' | 'most-bids'>('ending-soonest');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // QR Camera Stream Effect
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (showQrScanner) {
      setCameraError(null);
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera access error or permission denied:', err);
          setCameraError(lang === 'ar' ? 'تعذر الوصول إلى الكاميرا. يرجى السماح بصلاحية الكاميرا في المتصفح أو اختيار سلعة أدناه.' : 'Camera access denied or unavailable. Please grant permission or select an item below.');
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showQrScanner, lang]);
  
  // Real-time Event Feed Notifications
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; timestamp: string }>>([]);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aurum_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWatchlist = (auctionId: string) => {
    setWatchlist((prev) => {
      const exists = prev.includes(auctionId);
      const next = exists ? prev.filter((id) => id !== auctionId) : [...prev, auctionId];
      try {
        localStorage.setItem('aurum_watchlist', JSON.stringify(next));
      } catch (err) {
        console.error('Error saving watchlist:', err);
      }
      return next;
    });
  };

  // Recommended viewed categories
  const [viewedCategories, setViewedCategories] = useState<string[]>([]);

  // Load viewed categories history on mount
  useEffect(() => {
    try {
      const history = localStorage.getItem('aurum_viewed_categories');
      if (history) {
        setViewedCategories(JSON.parse(history));
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  }, []);

  // Update viewed categories when an auction is selected (viewed)
  useEffect(() => {
    if (selectedAuction) {
      const category = selectedAuction.category;
      setViewedCategories((prev) => {
        const next = [category, ...prev.filter((c) => c !== category)].slice(0, 5);
        try {
          localStorage.setItem('aurum_viewed_categories', JSON.stringify(next));
        } catch (err) {
          console.error('Error saving history:', err);
        }
        return next;
      });
    }
  }, [selectedAuction]);

  // Compute recommended auctions
  const recommendedAuctions = React.useMemo(() => {
    const activeAuctions = auctions.filter(a => a.status === 'active');
    if (activeAuctions.length === 0) return [];

    if (viewedCategories.length === 0) {
      // Suggest active auctions sorted by bid counts or hot first
      return [...activeAuctions]
        .sort((a, b) => (b.bidsCount || 0) - (a.bidsCount || 0))
        .slice(0, 3);
    }

    const recs: Auction[] = [];
    // Prioritize by viewed category recency
    for (const cat of viewedCategories) {
      const matching = activeAuctions.filter(a => a.category === cat && !recs.find(r => r.id === a.id));
      recs.push(...matching);
    }

    // Fill with remaining active auctions if under 3 matches
    if (recs.length < 3) {
      const remaining = activeAuctions.filter(a => !recs.find(r => r.id === a.id));
      recs.push(...remaining);
    }

    return recs.slice(0, 3);
  }, [auctions, viewedCategories]);

  const t = translations[lang];

  // Browser Audio Synthesizer: pleasant electronic beep code reusing single AudioContext
  const playSynthesizerBeep = (freq: number = 880, duration: number = 0.1) => {
    if (muteSoundRef.current) return;
    audioSynth.setMuted(false);
    audioSynth.playTone(freq, duration);
  };

  // Fetch Session user — API first, then localStorage fallback
  const fetchSession = async () => {
    try {
      const r = await fetch('/api/auth/me');
      if (r.ok) {
        const d = await r.json();
        if (d.user) {
          setUser(d.user);
          saveSessionUser(d.user);
          return;
        }
      }
    } catch {
      // API not available or error
    }
    const localUser = getSessionUser();
    setUser(localUser);
  };

  // Fetch Auctions — API first, then Firebase fallback
  const fetchAuctions = async () => {
    try {
      const r = await fetch('/api/auctions');
      if (r.ok) {
        const d = await r.json();
        if (d.auctions && d.auctions.length > 0) {
          setAuctions(d.auctions);
          const urlParams = new URLSearchParams(window.location.search);
          const targetId = urlParams.get('auctionId') || urlParams.get('auction');
          if (targetId) {
            const found = d.auctions.find((a: Auction) => a.id === targetId);
            if (found) setSelectedAuction(found);
          } else if (selectedAuction) {
            const updated = d.auctions.find((a: Auction) => a.id === selectedAuction.id);
            if (updated) setSelectedAuction(updated);
          }
          return;
        }
      }
    } catch {
      // API not available — fall through to Firebase
    }
    // Firebase direct fallback (works on Cloudflare)
    try {
      const list = await fetchAuctionsFromFirestore();
      if (list.length > 0) {
        setAuctions(list);
        const urlParams = new URLSearchParams(window.location.search);
        const targetId = urlParams.get('auctionId') || urlParams.get('auction');
        if (targetId) {
          const found = list.find((a: Auction) => a.id === targetId);
          if (found) setSelectedAuction(found);
        } else if (selectedAuction) {
          const updated = list.find((a: Auction) => a.id === selectedAuction.id);
          if (updated) setSelectedAuction(updated);
        }
      }
    } catch (e) {
      console.warn('Firebase fallback failed:', e);
    } finally {
      setLoadingAuctions(false);
    }
  };

  // Handle logins
  const handleLogin = async (email: string, provider?: string) => {
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) return;

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: 'demo', provider })
      });
      if (r.ok) {
        const d = await r.json();
        if (d.user) {
          setUser(d.user);
          saveSessionUser(d.user);
          playSynthesizerBeep(1200, 0.15);
          setActiveTab('auctions');
          success(lang === 'ar' ? `مرحباً بك ${d.user.name}! تم تسجيل الدخول بنجاح` : `Welcome ${d.user.name}! Signed in successfully`);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend login deferred:', e);
    }

    // Client-side fallback authentication via Firebase / Local session
    const fallbackUser = await loginUser(cleanEmail, provider);
    if (fallbackUser) {
      setUser(fallbackUser);
      saveSessionUser(fallbackUser);
      playSynthesizerBeep(1200, 0.15);
      setActiveTab('auctions');
      success(lang === 'ar' ? `مرحباً بك ${fallbackUser.name}! تم تسجيل الدخول بنجاح` : `Welcome ${fallbackUser.name}! Signed in successfully`);
    }
  };

  // Handle dynamic profile updates (balance charging, Language switches, name revisions)
  const handleUpdateProfile = async (details: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...details };
      setUser(updatedUser);
      saveSessionUser(updatedUser);
    }
    try {
      const r = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
      });
      if (r.ok) {
        const d = await r.json();
        if (d.user) {
          setUser(d.user);
          saveSessionUser(d.user);
          playSynthesizerBeep(1000, 0.12);
        }
      }
    } catch (e) {
      console.warn('Profile updates deferred:', e);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    clearSessionUser();
    setUser(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Signout deferred:', e);
    }
    playSynthesizerBeep(600, 0.2);
    setActiveTab('auctions');
    info(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully');
  };

  // Clear events feed
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Core boot sequence
  useEffect(() => {
    fetchSession();
    fetchAuctions();

    // Secondary interval backup polling
    const interval = setInterval(() => {
      fetchAuctions();
    }, 7000);

    return () => clearInterval(interval);
  }, [selectedAuction?.id]);

  // Dark shade class controller
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // RTL / LTR document direction handler
  useEffect(() => {
    const root = window.document.documentElement;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.lang = lang;
  }, [lang]);

  // --- CONNECT SYSTEM-SENT EVENTS (SSE) FOR INSTANT MULTI-CLIENT UPDATES ---
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let timer: any = null;
    let active = true;

    function connect() {
      if (!active) return;
      
      try {
        eventSource = new EventSource('/api/realtime-notifications');
        
        eventSource.onopen = () => {
          // Connected successfully
        };

        eventSource.onmessage = (event) => {
          try {
            const messageObj = JSON.parse(event.data);
            if (messageObj.connected) return; // ignore initial connect ping

            const { type, payload } = messageObj;
            let notifText = '';

            // Formulate Arabic-English real-time event texts
            if (type === 'bid_submitted') {
              // Play a delightful ascending sequence beep of two tones indicating aggressive competition!
              playSynthesizerBeep(980, 0.08);
              setTimeout(() => playSynthesizerBeep(1320, 0.12), 80);

              const arcTitle = auctionsRef.current.find(a => a.id === payload.auctionId);
              const tTitle = arcTitle ? (langRef.current === 'ar' ? arcTitle.titleAr : arcTitle.titleEn) : 'سلعة';
              
              notifText = langRef.current === 'ar' 
                ? `مزايدة فورية قوية! قدم ${payload.highBidderName} عرضاً جديداً بقيمة ${payload.currentPrice} ر.س على "${tTitle}"`
                : `Fierce bidding war! ${payload.highBidderName} submitted a live bid of ${payload.currentPrice} SAR on "${tTitle}"`;
              
              fetchAuctions();
            } else if (type === 'auction_created') {
              playSynthesizerBeep(1100, 0.2);
              notifText = langRef.current === 'ar'
                ? `🏁 إدراج وحراج جديد! تم طرح "${payload.titleAr}" للمزايدة والبيع الآن!`
                : `🏁 Fresh auction! "${payload.titleEn}" was listed for active bidding!`;
              fetchAuctions();
            } else if (type === 'shipment_created') {
              playSynthesizerBeep(880, 0.15);
              notifText = langRef.current === 'ar'
                ? `🚚 شحنة جديدة! تم تأكيد السداد وإرسال الطرد برقم التتبع: ${payload.trackingNumber}`
                : `🚚 Carrier dispatch initiated under Aramex tracking: ${payload.trackingNumber}`;
            } else if (type === 'escrow_released') {
              playSynthesizerBeep(1500, 0.3);
              notifText = langRef.current === 'ar'
                ? `💸 حسم الضمان ماليًا! أكد المشتري الاستلام وتم تحرير المبالغ للبائع بنجاح!`
                : `💸 Escrow released! Funds unlocked and wired directly to seller's account.`;
            } else if (type === 'ticket_created') {
              notifText = langRef.current === 'ar'
                ? `✉️ دعم فني: تم استلام شكوى أو استفسار جديد بخصوص: ${payload.subject}`
                : `✉️ Support: New helpdesk ticket opened on: ${payload.subject}`;
            }

            if (notifText) {
              const timestampStr = new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit', second: '2-digit'});
              setNotifications(prev => [
                {
                  id: `${Date.now()}_not`,
                  text: notifText,
                  timestamp: timestampStr
                },
                ...prev
              ]);
            }
          } catch (err) {
            console.warn('Error parsing message:', err);
          }
        };

        eventSource.onerror = () => {
          // Fail gracefully and schedule a throttled reconnect
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (active) {
            clearTimeout(timer);
            timer = setTimeout(connect, 8000);
          }
        };
      } catch (err) {
        console.warn('EventSource initialization deferred:', err);
      }
    }

    connect();

    return () => {
      active = false;
      clearTimeout(timer);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Filters logic matcher - memoized to prevent re-filtering on unrelated updates
  const filteredAuctions = useMemo(() => {
    const list = auctions.filter((auc) => {
      // Hide unapproved, rejected, or paused auctions from public stream
      if (auc.status === 'pending_approval' || auc.status === 'rejected' || auc.isPaused) return false;

      const isCategoryMatched = selectedCategory === 'all' || auc.category === selectedCategory;
      
      const searchLower = searchQuery.toLowerCase();
      const isSearchMatched = 
        auc.titleAr.toLowerCase().includes(searchLower) ||
        auc.titleEn.toLowerCase().includes(searchLower) ||
        auc.descAr.toLowerCase().includes(searchLower) ||
        auc.descEn.toLowerCase().includes(searchLower) ||
        auc.category.toLowerCase().includes(searchLower);

      return isCategoryMatched && isSearchMatched;
    });

    return list.sort((a, b) => {
      if (sortBy === 'ending-soonest') {
        const timeA = new Date(a.endTime).getTime();
        const timeB = new Date(b.endTime).getTime();
        return timeA - timeB;
      } else if (sortBy === 'lowest-price') {
        return (a.currentPrice || a.startingPrice || 0) - (b.currentPrice || b.startingPrice || 0);
      } else if (sortBy === 'most-bids') {
        return (b.bidsCount || 0) - (a.bidsCount || 0);
      }
      return 0;
    });
  }, [auctions, selectedCategory, searchQuery, sortBy]);


  // Hot dynamic ending highlights
  const hotEndingAuctions = auctions
    .filter(a => a.status === 'active')
    .slice(0, 3);

  // Helper to map category to icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'جولات وهواتف ذكية':
        return <Smartphone className="h-3.5 w-3.5 shrink-0" />;
      case 'سيارات ومحركات':
        return <Car className="h-3.5 w-3.5 shrink-0" />;
      case 'فنون وأنتيك ملوكي':
        return <Palette className="h-3.5 w-3.5 shrink-0" />;
      case 'عقارات وأراضي':
        return <Home className="h-3.5 w-3.5 shrink-0" />;
      case 'ساعات ومجوهرات فاخرة':
        return <Watch className="h-3.5 w-3.5 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0a0a0b] text-slate-100">
      
      {/* 1. TOP RESPONSIVE HEADER BAR */}
      <Navbar
        lang={lang}
        setLang={setLang}
        currency={currency}
        setCurrency={setCurrency}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedAuction(null); // Reset detail view
        }}
        onLogout={handleSignOut}
        notifications={notifications}
        clearNotifications={clearNotifications}
        muteSound={muteSound}
        setMuteSound={setMuteSound}
        watchlistCount={watchlist.length}
      />

      {/* 2. MAIN SINGLE-VIEW HUB ROUTER CONFIG */}
      <main className="flex-1 w-full">
        <Suspense fallback={<ViewFallback />}>
          {/* VIEW A: SEARCHABLE AUCTIONS STREAM */}
          {activeTab === 'auctions' && !selectedAuction && (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8 animate-fade-in">

              {/* HERO SYSTEM EXPLAINER */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d0d0f] to-[#161618] border border-white/10 p-6 sm:p-10 shadow-2xl">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-amber-500/10 to-transparent blur-3xl pointer-events-none" />
                <div className="relative max-w-2xl space-y-4">
                  <span className="inline-flex items-center gap-1.5 rounded bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-amber-500">
                    <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    <span>{lang === 'ar' ? 'مزايدات ونشاط مؤمن بالضمان عالي القيمة' : 'Secured Escrow High-Value Bidding Active'}</span>
                  </span>
                  
                  <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-widest leading-none font-light italic">
                    {lang === 'ar' ? 'مزادات أنتيكاوي الفاخرة' : 'أنتيكاوي Auctions Hub'}
                  </h2>
                  
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    {lang === 'ar' 
                      ? 'منصتك الموثقة للمشاركة ودخول المزادات الفاخرة: الساعات العتيقة والسيارات الرياضية النادرة. المزايدة في اللحظات الأخيرة تمدد الوقت تلقائياً لحماية المزايدين وضمان المساواة.'
                      : 'The premier place to bid on luxury watches, rare sports cars and fine collector items. Sniper protection with smart physical escrow locks and instant response streams.'}
                  </p>

                  {/* Simulated quick status indicators */}
                  <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-wider font-semibold text-slate-505 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {lang === 'ar' ? 'حماية الضمان المستقلة: نشطة' : 'Escrow protection: Active'}</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {lang === 'ar' ? 'قفل قنص اللحظات الأخيرة: مفعل' : 'Auto-extend protection: Armed'}</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {lang === 'ar' ? 'بوابة الدعم المباشر: آمنة' : 'Live support desk: 24/7'}</span>
                  </div>
                </div>
              </div>

              {/* LIVE EVENTS FLASH TICKER FEED */}
              {notifications.length > 0 && (
                <div className="flex items-center gap-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 p-3.5 rounded-2xl text-xs font-semibold transition-all animate-fade-in">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span className="truncate flex-1 font-serif italic">{notifications[0].text}</span>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">{notifications[0].timestamp}</span>
                </div>
              )}

              {/* RECOMMENDED FOR YOU SECTION */}
              {recommendedAuctions.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-[#0d0d0f] p-5 sm:p-6 shadow-xl space-y-4" id="recommended-section">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                      <h3 className="text-sm font-black text-white tracking-wider">
                        {lang === 'ar' ? 'مقترح لك خصيصاً' : 'Recommended for You'}
                      </h3>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2.5 py-0.5 rounded font-black tracking-widest uppercase">
                      {lang === 'ar' ? 'مبني على اهتمامك' : 'Smart Suggestion'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendedAuctions.map((auc, idx) => {
                      // Reason label
                      const isMatchedCat = viewedCategories.includes(auc.category);
                      const reasonText = isMatchedCat
                        ? (lang === 'ar' 
                            ? `بسبب اهتمامك بـ ${t[auc.category as keyof typeof t] || auc.category}` 
                            : `Based on your interest in ${t[auc.category as keyof typeof t] || auc.category}`)
                        : (lang === 'ar' ? '🔥 من المزادات الأكثر رواجاً' : '🔥 Popular Trending Right Now');

                      return (
                        <div
                          key={`rec-${auc.id}-${idx}`}
                          onClick={() => setSelectedAuction(auc)}
                          className="group/rec relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-[#161618]/50 hover:bg-[#161618] hover:border-amber-500/20 p-3 flex gap-3 items-center transition-all duration-300"
                          id={`rec-card-${auc.id}`}
                        >
                          {/* Compact thumbnail */}
                          <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-white/10">
                            <img
                              src={auc.image}
                              alt={lang === 'ar' ? auc.titleAr : auc.titleEn}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover/rec:scale-105"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-1 text-right">
                            <p className="text-[9px] text-amber-400 font-bold tracking-tight truncate">
                              {reasonText}
                            </p>
                            <h4 className="text-xs font-bold text-white truncate font-serif">
                              {lang === 'ar' ? auc.titleAr : auc.titleEn}
                            </h4>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                {auc.bidsCount} {lang === 'ar' ? 'مزايدات' : 'bids'}
                              </span>
                              <span className="text-xs font-mono font-bold text-amber-500">
                                {formatPrice(auc.currentPrice, currency, lang)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FILTERING & CATEGORIES TOOLBAR widgets with Cairo font elegance */}
              <div className="rounded-2xl border border-white/10 bg-[#0d0d0f] p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Category selector row buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`cursor-pointer flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded uppercase tracking-wider transition-all border ${
                      selectedCategory === 'all'
                        ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-lg shadow-amber-500/20'
                        : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                    }`}
                    id="category-btn-all"
                  >
                    <Layers className={`h-3.5 w-3.5 shrink-0 ${selectedCategory === 'all' ? 'text-black' : 'text-amber-500'}`} />
                    <span>{t.allCategories}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-extrabold transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-black/20 text-black border border-black/10'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {auctions.filter(a => a.status === 'active').length}
                    </span>
                  </button>
                  {categories.map((cat, catIdx) => {
                    const icon = getCategoryIcon(cat);
                    const isSelected = selectedCategory === cat;
                    const activeCount = auctions.filter(a => a.status === 'active' && a.category === cat).length;
                    return (
                      <button
                        key={`cat-${cat}-${catIdx}`}
                        onClick={() => setSelectedCategory(cat)}
                        className={`cursor-pointer flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded uppercase tracking-wider transition-all border ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-lg shadow-amber-500/30'
                            : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                        }`}
                        id={`category-btn-${cat}`}
                      >
                        {icon && (
                          <span className={isSelected ? 'text-black font-bold' : 'text-amber-500'}>
                            {icon}
                          </span>
                        )}
                        <span>{t[cat as keyof typeof t] || cat}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-extrabold transition-colors ${
                          isSelected
                            ? 'bg-black/20 text-black border border-black/10'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {activeCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search & Sorting Toolbar group */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                  {/* Sorting Dropdown */}
                  <div className="relative w-full sm:w-48">
                    <SlidersHorizontal className="absolute left-3 top-2.5 h-3.5 w-3.5 text-amber-500 pointer-events-none" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-[#161618] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                      id="sorting-select-dropdown"
                    >
                      <option value="ending-soonest">{lang === 'ar' ? '⏱️ أقرب انتهاءً' : '⏱️ Ending Soonest'}</option>
                      <option value="lowest-price">{lang === 'ar' ? '🏷️ أقل سعر' : '🏷️ Lowest Price'}</option>
                      <option value="most-bids">{lang === 'ar' ? '🔥 أكثر المزايدات' : '🔥 Most Bids'}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Keyword Search Input */}
                  <div className="relative w-full sm:w-64 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={lang === 'ar' ? 'بحث عن سلعة بالأسم أو المواصفات...' : 'Search by title...'}
                        className="w-full bg-[#161618] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-white outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQrScanner(true)}
                      className="cursor-pointer bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 transition-all"
                      title={lang === 'ar' ? 'مسح رمز QR' : 'Scan QR'}
                    >
                      <Scan className="w-4 h-4" />
                      <span className="hidden xl:inline">{lang === 'ar' ? 'مسح QR' : 'Scan QR'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* THE GENERAL GRID VIEW */}
              {loadingAuctions ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AuctionSkeletonCard count={6} />
                </div>
              ) : filteredAuctions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-800 space-y-2">
                  <Inbox className="h-12 w-12 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-black text-slate-700 dark:text-slate-350">
                    {lang === 'ar' ? 'لم يتم العثور على مزادات مطابقة للفلاتر حالياً' : 'No matching active auctions found'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar' ? 'يرجى تغيير فئة البحث أو محاولة تصفح فئات أخرى.' : 'Adjust search terms or query tags.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAuctions.map((auc, idx) => (
                    <AuctionCard
                      key={`grid-${auc.id}-${idx}`}
                      auction={auc}
                      lang={lang}
                      currency={currency}
                      currentUserEmail={user?.email}
                      isWatchlisted={watchlist.includes(auc.id)}
                      onToggleWatchlist={toggleWatchlist}
                      onSelect={(selected) => setSelectedAuction(selected)}
                      // Won settle shortcuts triggers
                      onQuickCheckout={(target) => {
                        setSelectedAuction(target);
                        // Settle details automatically pops up
                      }}
                    />
                  ))}
                </div>
              )}

            </div>
          )}

          {/* VIEW B: INTERACTIVE SINGLE AUCTION DETAIL SCREEN */}
          {selectedAuction && (
            <div className="animate-fade-in">
              <AuctionDetails
                auction={selectedAuction}
                allAuctions={auctions}
                lang={lang}
                currency={currency}
                user={user}
                onBack={() => setSelectedAuction(null)}
                onSelectAuction={(auc) => setSelectedAuction(auc)}
                onBidSuccess={() => {
                  fetchAuctions();
                }}
              />
            </div>
          )}

          {/* VIEW: AUCTION CALENDAR MAPPING */}
          {activeTab === 'calendar' && !selectedAuction && (
            <div className="animate-fade-in">
              <AuctionCalendar
                auctions={auctions}
                lang={lang}
                onSelectAuction={(auc) => setSelectedAuction(auc)}
              />
            </div>
          )}

          {/* VIEW: WATCHLIST / FAVORITES TAB */}
          {activeTab === 'watchlist' && !selectedAuction && (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-950/40 via-[#0d0d0f] to-[#0d0d0f] border border-rose-500/20 rounded-2xl p-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 fill-rose-500 text-rose-500 animate-pulse" />
                    <h2 className="text-xl font-bold font-serif text-white tracking-wide">
                      {t.watchlist}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar' 
                      ? 'المزادات والسلع التي تم حفظها في مفضلتك لمتابعتها والمزايدة السريعة عليها'
                      : 'Saved auctions and items in your favorites for quick monitoring and bidding'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full">
                    {watchlist.length} {lang === 'ar' ? 'سلعة محفوظة' : 'Saved Items'}
                  </span>
                </div>
              </div>

              {/* Watchlist Items Grid or Empty State */}
              {auctions.filter(a => watchlist.includes(a.id)).length === 0 ? (
                <div className="text-center py-20 bg-[#0d0d0f]/80 rounded-3xl border border-white/10 p-8 space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <Heart className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">
                      {t.emptyWatchlist}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      {lang === 'ar'
                        ? 'يمكنك حفظ أي مزاد عن طريق الضغط على أيقونة القلب في بطاقة المزاد للوصول إليه بسرعة لاحقاً.'
                        : 'Click the heart icon on any auction card to bookmark it for quick access later.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('auctions')}
                    className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                  >
                    <Search className="h-4 w-4" />
                    <span>{t.browseAuctions}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {auctions
                    .filter(a => watchlist.includes(a.id))
                    .map((auc, idx) => (
                      <AuctionCard
                        key={`watchlist-${auc.id}-${idx}`}
                        auction={auc}
                        lang={lang}
                        currency={currency}
                        currentUserEmail={user?.email}
                        isWatchlisted={true}
                        onToggleWatchlist={toggleWatchlist}
                        onSelect={(selected) => setSelectedAuction(selected)}
                        onQuickCheckout={(target) => {
                          setSelectedAuction(target);
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW C: PUBLISH / CREATE AUCTION SUB-SECTION */}
          {activeTab === 'create' && (
            <div className="animate-fade-in">
              <CreateAuction
                lang={lang}
                initialDraft={valuationDraft}
                onSuccess={() => {
                  setValuationDraft(null);
                  fetchAuctions();
                  setActiveTab('auctions');
                }}
              />
            </div>
          )}

          {/* VIEW C-2: ANTIQUE VALUATION CALCULATOR & APPRAISAL ENGINE */}
          {activeTab === 'valuation' && (
            <div className="animate-fade-in">
              <ValuationCalculator
                lang={lang}
                currency={currency}
                onDraftAuction={(draft) => {
                  setValuationDraft(draft);
                  setActiveTab('create');
                }}
              />
            </div>
          )}

          {/* VIEW C-3: COLLECTOR INVESTMENT ROI CALCULATOR */}
          {activeTab === 'roi' && (
            <div className="animate-fade-in">
              <CollectorRoiCalculator
                lang={lang}
                currency={currency}
              />
            </div>
          )}

          {/* VIEW C-4: BIDDING WARM-UP & TACTICAL PRACTICE ARENA */}
          {activeTab === 'simulator' && (
            <div className="animate-fade-in">
              <BiddingSimulatorArena
                lang={lang}
                currency={currency}
              />
            </div>
          )}

          {/* VIEW D: TICKETING TECHNICAL SUPPORT CENTER & CRM HUB */}
          {activeTab === 'support' && (
            <div className="animate-fade-in">
              <CustomerSystem
                lang={lang}
                currentUser={user}
                onRefreshUser={fetchSession}
              />
            </div>
          )}

          {/* VIEW E: ADMIN SYSTEM EMBOSS COMMAND DASHBOARD */}
          {activeTab === 'admin' && user?.role === 'admin' && (
            <div className="animate-fade-in">
              <AdminPanel
                lang={lang}
                currency={currency}
                onRefreshData={() => {
                  fetchAuctions();
                }}
              />
            </div>
          )}

          {/* VIEW F: MEMBER PROFILE USER AREA AND TESTING RECHARGES */}
          {activeTab === 'my-profile' && (
            <div className="animate-fade-in">
              <UserProfile
                lang={lang}
                currency={currency}
                user={user}
                auctions={auctions}
                onLogin={(email, provider) => handleLogin(email, provider)}
                onUpdateProfile={(updated) => handleUpdateProfile(updated)}
              />
            </div>
          )}

          {/* VIEW G: PRIVATE MESSAGES */}
          {activeTab === 'messages' && user && (
            <div className="animate-fade-in">
              <Messages
                user={user}
                lang={lang}
                auctions={auctions}
              />
            </div>
          )}
          {activeTab === 'messages' && !user && (
            <div className="animate-fade-in text-center py-20 text-slate-400">
              <p className="text-lg font-bold">{lang === 'ar' ? 'يجب تسجيل الدخول لعرض الرسائل' : 'Please log in to view messages'}</p>
            </div>
          )}
        </Suspense>
      </main>

      {/* 3. FOOTER SIGNATURES */}
      <footer className="border-t border-slate-200 mt-12 bg-white/50 py-8 dark:border-slate-800 dark:bg-slate-900/30 text-xs font-bold text-slate-400">
        <div className="mx-auto max-w-7xl px-4 text-center space-y-2 sm:px-6 lg:px-8">
          <p>© 2026 {t.appName} &bull; {lang === 'ar' ? 'منصة المزادات الرقمية المتكاملة والموثقة' : 'Secure Enterprise Bidding Node'}</p>
          <p className="text-[10px] text-slate-400">
            {lang === 'ar' ? 'مؤمن ومشفر بتراخيص حماية الضمان (Secured escrow systems) والنسخ الاحتياطي اللحظي التلقائي (Auto-backup)' : 'Protected under federal escrow policies with real-time backups logs'}
          </p>
        </div>
      </footer>

      <Suspense fallback={null}>
        <CookieConsentBanner />
      </Suspense>
      <FloatingLanguageToggle lang={lang} setLang={setLang} />

      {/* QR Code Scanner Modal */}
      {showQrScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121216] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Scan className="w-5 h-5 text-amber-400" />
                <span>{lang === 'ar' ? 'ماسح رمز الاستجابة السريعة (QR)' : 'Auction Item QR Scanner'}</span>
              </div>
              <button
                onClick={() => setShowQrScanner(false)}
                className="cursor-pointer p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {lang === 'ar' ? 'قم بتوجيه الكاميرا نحو رمز QR الخاص بالسلعة الأثرية أو اختر من القائمة أدناه للمسح الفوري:' : 'Point your camera at the auction item QR code or select from live catalog below for instant inspection:'}
            </p>

            <div className="relative bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-56 object-cover"
              />
              {/* Glowing Scan-line Overlay Animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_18px_rgba(251,191,36,0.95)]"
                />
              </div>

              <div className="absolute inset-0 border-2 border-amber-500/50 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="relative w-36 h-36 border border-dashed border-amber-400/80 rounded-lg flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="rgba(251, 191, 36, 0.2)"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="3.5"
                      strokeDasharray="276"
                      animate={{ strokeDashoffset: [276, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                      strokeLinecap="round"
                      className="filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                    />
                  </svg>
                  <span className="text-[10px] text-amber-300 bg-black/80 px-2.5 py-1 rounded-full font-mono shadow-md border border-amber-500/40">
                    {lang === 'ar' ? 'جارِ مسح الرمز...' : 'Scanning...'}
                  </span>
                </div>
              </div>
            </div>

            {cameraError && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30">
                {cameraError}
              </p>
            )}

            <div>
              <span className="text-xs font-bold text-slate-400 block mb-2">
                {lang === 'ar' ? 'أو اختر سلعة مسجلة للمحاكاة الفورية:' : 'Or simulate scan with live catalog item:'}
              </span>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {auctions.slice(0, 5).map((auc) => (
                  <div
                    key={`qr-sim-${auc.id}`}
                    onClick={() => {
                      setSelectedAuction(auc);
                      setShowQrScanner(false);
                      success(lang === 'ar' ? `تم مسح السلعة "${auc.titleAr}" بنجاح!` : `Scanned "${auc.titleEn}" successfully!`);
                    }}
                    className="cursor-pointer bg-[#1a1a1f] hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/40 p-2.5 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {auc.image ? (
                        <img src={auc.image} alt="" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                          <QrCode className="w-5 h-5 text-amber-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{lang === 'ar' ? auc.titleAr : auc.titleEn}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: #{auc.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 shrink-0">
                      {lang === 'ar' ? 'مسح فوري' : 'Scan'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowQrScanner(false)}
                className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
