/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Auction, Bid, Shipment, EscrowTransaction, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language, Currency, formatPrice } from '../utils/translations';
import CountdownTimer from './CountdownTimer';
import BidConfirmationModal from './BidConfirmationModal';
import VictoryCelebrationEffect from './VictoryCelebrationEffect';
import BidderReputationBadge from './BidderReputationBadge';
import { 
  ArrowLeft, 
  Eye, 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  Gavel, 
  CheckCircle,
  Truck,
  DollarSign,
  Lock,
  Box,
  MapPin,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  HelpCircle,
  Activity,
  TrendingUp,
  BarChart2,
  Wallet,
  CreditCard,
  Smartphone,
  Coins,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Share2,
  Send,
  Mail,
  Link,
  QrCode,
  Facebook,
  Linkedin,
  Store,
  ExternalLink,
  Award,
  ShieldCheck,
  Star,
  UserCheck,
  Scan,
  Bell,
  BellRing,
  BellOff,
  BadgeCheck
} from 'lucide-react';
import QRCode from 'react-qr-code';
import AutoBid from './AutoBid';
import AuctionComments from './AuctionComments';
import LiveAuctionOverlay from './LiveAuctionOverlay';
import ProvenanceInspectorModal from './ProvenanceInspectorModal';
import OwnershipCertificateModal from './OwnershipCertificateModal';
import EscrowLogisticsTracker from './EscrowLogisticsTracker';
import Artifact3DViewerModal from './Artifact3DViewerModal';
import ArtifactConditionScannerModal from './ArtifactConditionScannerModal';
import SocialExporterModal from './SocialExporterModal';
import QrCodeScannerModal from './QrCodeScannerModal';
import AuctionAnalytics from './AuctionAnalytics';
import { audioSynth } from '../utils/audio';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { submitBidInFirestore } from '../utils/firebase';

interface AuctionDetailsProps {
  auction: Auction;
  allAuctions?: Auction[];
  lang: Language;
  currency: Currency;
  user: User | null;
  onBack: () => void;
  onBidSuccess: () => void;
  onSelectAuction?: (auction: Auction) => void;
}

const GALLERY_MAPPING: Record<string, string[]> = {
  a1: [
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=1200', // Rolex
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200', // Dial Details
    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200', // Crown profile
    'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=1200', // Movement
    'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=1200', // Presentation Box
  ],
  a2: [
    'https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?w=1200', // Mercedes G63 Matte Black
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200', // Side angle profile
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200', // G63 Red Leather Interior
    'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=1200', // AMG steering wheel
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200', // Rear wheel layout
  ],
  a3: [
    'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=1200', // Sadu Weaving Carpet
    'https://images.unsplash.com/photo-1576016770956-debb63d900ef?w=1200', // Patterned traditional symbols
    'https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?w=1200', // Weaving textures
    'https://images.unsplash.com/photo-1600121848600-fbe0255dfb22?w=1200'  // Intricate details
  ],
  a4: [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200', // Obhur Seaside Villa
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200', // Pools & lounge patio
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200', // salon area
    'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1200', // master bedroom
    'https://images.unsplash.com/photo-1617806118233-18e1db207faf?w=1200'  // modern kitchen
  ],
  a5: [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200', // Stallion Oil Painting
    'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=1200', // Art frame
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200', // easel workshop
    'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=1200'  // brush strokes detail
  ],
  a6: [
    'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=1200', // AirPods Max Gray
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200', // Smart case
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200', // ear cushions
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1100'  // lifestyle
  ]
};

const getAuctionImages = (auc: Auction): string[] => {
  if (GALLERY_MAPPING[auc.id]) {
    return GALLERY_MAPPING[auc.id];
  }
  
  const baseImg = auc.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200';
  
  if (auc.category.includes('ساعات') || auc.category.includes('Watch') || auc.category.includes('مجوهرات') || auc.category.includes('Jewelry')) {
    return [
      baseImg,
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200',
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200',
      'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=1200'
    ];
  }
  if (auc.category.includes('سيارات') || auc.category.includes('Car') || auc.category.includes('محركات') || auc.category.includes('Motor')) {
    return [
      baseImg,
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200',
      'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=1200'
    ];
  }
  if (auc.category.includes('عقارات') || auc.category.includes('Real Estate') || auc.category.includes('أراضي') || auc.category.includes('Property') || auc.category.includes('فيلا')) {
    return [
      baseImg,
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
      'https://images.unsplash.com/photo-1617806118233-18e1db207faf?w=1200'
    ];
  }
  if (auc.category.includes('فنون') || auc.category.includes('Art') || auc.category.includes('لوحة') || auc.category.includes('لوحات') || auc.category.includes('أنتيك')) {
    return [
      baseImg,
      'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=1200',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200',
      'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=1200'
    ];
  }
  if (auc.category.includes('جولات') || auc.category.includes('Phone') || auc.category.includes('هواتف') || auc.category.includes('إلكترونيات') || auc.category.includes('Electronics')) {
    return [
      baseImg,
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200'
    ];
  }

  return [
    baseImg,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200'
  ];
};

export const calculateProgressiveIncrement = (currentPrice: number): number => {
  if (currentPrice < 100) return 10;
  if (currentPrice < 500) return 25;
  if (currentPrice < 1000) return 50;
  if (currentPrice < 5000) return 100;
  if (currentPrice < 10000) return 250;
  if (currentPrice < 50000) return 500;
  if (currentPrice < 100000) return 1000;
  return 2500;
};

export const calculateTimeLeft = (endTimeStr: string) => {
  const difference = new Date(endTimeStr).getTime() - Date.now();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false,
  };
};

export default function AuctionDetails({
  auction: initialAuction,
  allAuctions = [],
  lang,
  currency,
  user,
  onBack,
  onBidSuccess,
  onSelectAuction
}: AuctionDetailsProps) {
  const t = translations[lang];
  
  const [auction, setAuction] = useState<Auction>(initialAuction);
  const images = getAuctionImages(auction);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmValue, setConfirmValue] = useState<number>(0);
  const [showIncrementGuide, setShowIncrementGuide] = useState(false);
  const [showTopBidConfetti, setShowTopBidConfetti] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<'link' | 'qr'>('link');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [showSellerProfileModal, setShowSellerProfileModal] = useState(false);
  const [copiedStoreUrl, setCopiedStoreUrl] = useState(false);

  const [marketInsight, setMarketInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);
  const [showLiveOverlay, setShowLiveOverlay] = useState(false);
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [show3DModal, setShow3DModal] = useState(false);
  const [showConditionScannerModal, setShowConditionScannerModal] = useState(false);
  const [showSocialExporterModal, setShowSocialExporterModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [voiceAnnounceEnabled, setVoiceAnnounceEnabled] = useState(true);

  // Price Alert state management
  interface PriceAlert {
    targetPrice: number;
    createdAt: string;
    triggered: boolean;
  }

  const [priceAlert, setPriceAlert] = useState<PriceAlert | null>(() => {
    try {
      const saved = localStorage.getItem(`price_alert_${initialAuction.id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [priceAlertInput, setPriceAlertInput] = useState<string>('');
  const [priceAlertBanner, setPriceAlertBanner] = useState<string | null>(null);

  // Monitor price changes against active price alert
  useEffect(() => {
    if (priceAlert && !priceAlert.triggered && auction.currentPrice >= priceAlert.targetPrice) {
      const triggeredAlert = { ...priceAlert, triggered: true };
      setPriceAlert(triggeredAlert);
      try {
        localStorage.setItem(`price_alert_${auction.id}`, JSON.stringify(triggeredAlert));
      } catch (e) {
        console.warn('Failed to save price alert state', e);
      }
      const msg = lang === 'ar'
        ? `🔔 تنبيه السعر مفعّل! وصل سعر المزاد الحالي إلى ${formatPrice(auction.currentPrice, currency, lang)} وهو يفوق أو يساوي حدك المحدد (${formatPrice(priceAlert.targetPrice, currency, lang)})!`
        : `🔔 Price Alert Triggered! Current price ${formatPrice(auction.currentPrice, currency, lang)} reached or exceeded your threshold of ${formatPrice(priceAlert.targetPrice, currency, lang)}!`;
      setPriceAlertBanner(msg);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([150, 50, 150]); } catch (_) {}
      }
    }
  }, [auction.currentPrice, priceAlert, currency, lang, auction.id]);

  const handleSavePriceAlert = (targetVal: number) => {
    if (isNaN(targetVal) || targetVal <= 0) return;
    const isAlreadyReached = auction.currentPrice >= targetVal;
    const newAlert: PriceAlert = {
      targetPrice: targetVal,
      createdAt: new Date().toISOString(),
      triggered: isAlreadyReached,
    };
    setPriceAlert(newAlert);
    try {
      localStorage.setItem(`price_alert_${auction.id}`, JSON.stringify(newAlert));
    } catch (e) {
      console.warn('Failed to save alert', e);
    }
    setShowPriceAlertModal(false);
    if (isAlreadyReached) {
      const msg = lang === 'ar'
        ? `🔔 تنبيه السعر! السعر الحالي ${formatPrice(auction.currentPrice, currency, lang)} وصل بالفعل إلى الحد المحدد (${formatPrice(targetVal, currency, lang)})`
        : `🔔 Price Alert! Current price ${formatPrice(auction.currentPrice, currency, lang)} has already reached your target threshold (${formatPrice(targetVal, currency, lang)})`;
      setPriceAlertBanner(msg);
    } else {
      setSuccessMsg(
        lang === 'ar'
          ? `تم تفعيل تنبيه السعر بنجاح عند الوصول إلى ${formatPrice(targetVal, currency, lang)}`
          : `Price alert set for ${formatPrice(targetVal, currency, lang)} successfully`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleRemovePriceAlert = () => {
    setPriceAlert(null);
    setPriceAlertBanner(null);
    try {
      localStorage.removeItem(`price_alert_${auction.id}`);
    } catch (e) {
      console.warn('Failed to remove alert', e);
    }
    setShowPriceAlertModal(false);
  };

  const minIncrementRule = Math.max(auction.minIncrement || 0, calculateProgressiveIncrement(auction.currentPrice));
  const minRequiredBid = auction.currentPrice + minIncrementRule;

  // Seller Badge & Rating Level Information
  const sellerRating = auction.seller.rating || 5.0;
  const sellerTotalSold = auction.seller.totalSold ?? Math.max(14, (auction.seller.name.length * 7) % 120 + 18);

  const sellerBadge = React.useMemo(() => {
    if (sellerRating >= 4.8 && sellerTotalSold >= 20) {
      return {
        level: 5,
        tier: 'Diamond',
        badgeTitle: lang === 'ar' ? '💎 بائع ماسي ممتاز (المستوى 5)' : '💎 Level 5 Diamond Consignor',
        badgeShort: lang === 'ar' ? 'تاجر ماسي VIP' : 'Diamond VIP',
        trustScore: '99.8%',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        pillClass: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
      };
    } else if (sellerRating >= 4.5) {
      return {
        level: 4,
        tier: 'Gold',
        badgeTitle: lang === 'ar' ? '🥇 بائع ذهبي معتمد (المستوى 4)' : '🥇 Level 4 Gold Consignor',
        badgeShort: lang === 'ar' ? 'تاجر ذهبي' : 'Gold Seller',
        trustScore: '98.5%',
        colorClass: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
        pillClass: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'
      };
    } else if (sellerRating >= 4.0) {
      return {
        level: 3,
        tier: 'Silver',
        badgeTitle: lang === 'ar' ? '🥈 بائع فضي موثق (المستوى 3)' : '🥈 Level 3 Silver Seller',
        badgeShort: lang === 'ar' ? 'تاجر فضي' : 'Silver Seller',
        trustScore: '96.2%',
        colorClass: 'text-slate-300 bg-slate-400/10 border-slate-400/30',
        pillClass: 'bg-slate-400/15 border-slate-400/30 text-slate-200'
      };
    }
    return {
      level: 2,
      tier: 'Verified',
      badgeTitle: lang === 'ar' ? '🛡️ بائع موثق (المستوى 2)' : '🛡️ Level 2 Verified Seller',
      badgeShort: lang === 'ar' ? 'تاجر موثق' : 'Verified Seller',
      trustScore: '94.0%',
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      pillClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
    };
  }, [sellerRating, sellerTotalSold, lang]);

  const bidValidation = React.useMemo(() => {
    if (!bidAmount || bidAmount.trim() === '') {
      return {
        status: 'empty' as const,
        isValid: false,
        message: lang === 'ar'
          ? `الحد الأدنى المطلوب للمزايدة هو ${formatPrice(minRequiredBid, currency, lang)} (أعلى سعر حالي ${formatPrice(auction.currentPrice, currency, lang)} + الزيادة ${formatPrice(minIncrementRule, currency, lang)})`
          : `Minimum required bid is ${formatPrice(minRequiredBid, currency, lang)} (Highest bid ${formatPrice(auction.currentPrice, currency, lang)} + min increment ${formatPrice(minIncrementRule, currency, lang)})`
      };
    }

    const val = Number(bidAmount);
    if (isNaN(val) || val <= 0) {
      return {
        status: 'invalid_number' as const,
        isValid: false,
        message: lang === 'ar' ? 'يرجى إدخال مبلغ مزايدة رقمي صحيح وموجب' : 'Please enter a valid positive numerical amount'
      };
    }

    if (val <= auction.currentPrice) {
      return {
        status: 'below_current' as const,
        isValid: false,
        message: lang === 'ar'
          ? `عفواً، المبلغ أقل من أو يساوي أعلى سعر حالي (${formatPrice(auction.currentPrice, currency, lang)}). المزايدات يجب أن تفوق أعلى سعر حالي.`
          : `Bid amount is lower than or equal to current highest bid (${formatPrice(auction.currentPrice, currency, lang)}).`
      };
    }

    if (val < minRequiredBid) {
      return {
        status: 'below_increment' as const,
        isValid: false,
        message: lang === 'ar'
          ? `عفواً، الحد الأدنى المقبول للزيادة هو +${formatPrice(minIncrementRule, currency, lang)}. المزايدة المقبولة تبدأ من ${formatPrice(minRequiredBid, currency, lang)}.`
          : `Bid violates minimum increment rule (+${formatPrice(minIncrementRule, currency, lang)}). Minimum valid bid is ${formatPrice(minRequiredBid, currency, lang)}.`
      };
    }

    return {
      status: 'valid' as const,
      isValid: true,
      amount: val,
      difference: val - auction.currentPrice,
      message: lang === 'ar'
        ? `مزايدة معتمدة ومقبولة! (+${formatPrice(val - auction.currentPrice, currency, lang)} فوق أعلى سعر حالي)`
        : `Valid bid! (+${formatPrice(val - auction.currentPrice, currency, lang)} above current highest bid)`
    };
  }, [bidAmount, auction.currentPrice, minRequiredBid, minIncrementRule, currency, lang]);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/$/, '');
    return `${origin}${pathname}/?auctionId=${auction.id}`;
  };

  const handleQrAction = () => {
    setShareTab('qr');
    setShowShareModal(true);
  };

  const handleShareAction = async () => {
    setShareTab('link');
    const shareUrl = getShareUrl();
    const title = lang === 'ar' ? auction.titleAr : auction.titleEn;
    const text = lang === 'ar' 
      ? `شاهد هذا المزاد الفاخر على منصة أنتيكاوي: ${auction.titleAr} - السعر الحالي: ${formatPrice(auction.currentPrice, currency, lang)}`
      : `Check out this luxury auction on أنتيكاوي: ${auction.titleEn} - Current Bid: ${formatPrice(auction.currentPrice, currency, lang)}`;

    if (typeof navigator !== 'undefined' && navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        setSuccessMsg(lang === 'ar' ? 'تمت مشاركة رابط المزاد بنجاح!' : 'Auction link shared successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = getShareUrl();
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedShareLink(true);
        setSuccessMsg(lang === 'ar' ? 'تم نسخ رابط المزاد المخصص للحافظة!' : 'Unique auction link copied to clipboard!');
        setTimeout(() => {
          setCopiedShareLink(false);
          setSuccessMsg('');
        }, 3000);
      }).catch(err => {
        console.error('Failed to copy link:', err);
      });
    }
  };

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(auction.endTime));

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(auction.endTime));
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(auction.endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.endTime]);

  const [syncLoading, setSyncLoading] = useState(false);
  const [carrierApiData, setCarrierApiData] = useState<any>(null);

  // Settle States
  const [showCheckout, setShowCheckout] = useState(false);
  const [payCardNumber, setPayCardNumber] = useState('4000 1234 5678 9010');
  const [payExpiry, setPayExpiry] = useState('09/29');
  const [payCVV, setPayCVV] = useState('123');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'applepay' | 'stcpay' | 'crypto'>('card');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [stcPhone, setStcPhone] = useState('+966 50 123 4567');
  const [stcOtp, setStcOtp] = useState('');
  const [stcOtpSent, setStcOtpSent] = useState(false);
  const [cryptoToken, setCryptoToken] = useState<'USDT' | 'USDC' | 'BTC' | 'ETH'>('USDT');
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Shipment & Escrow states
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);

  // Network connectivity state for offline bidding protection
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // FAQ state and content
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = React.useMemo(() => {
    return lang === 'ar' ? [
      {
        q: 'كيف يعمل نظام الأسئلة الضمانية وحماية الدفع (Escrow)؟',
        a: 'يتم حجز مدفوعاتك بأمان تام في محفظة الضمان الخاصة بـ أنتيكاوي. لا يتم إرسال الأموال لحساب البائع إلا بعد قيامك بتأكيد سلامة استلام السلعة الفاخرة وخلوها من العيوب ومطابقتها للمواصفات المعروضة.'
      },
      {
        q: 'ما هي ميزة مكافحة القنص (Anti-Snipe) وتمديد الوقت؟',
        a: 'حفاظاً على عدالة المزايدة، فإن أي مزايدة يتم تقديمها في آخر دقيقتين من وقت المزاد ستؤدي تلقائياً إلى تمديد العداد التنازلي للمزاد لمدة 3 دقائق إضافية حتى يتسنى للجميع فرصة متكافئة للمزايدة.'
      },
      {
        q: 'هل يمكنني إلغاء أو سحب عرض المزايدة بعد تقديمه؟',
        a: 'لا، جميع عروض المزايدة على منصة أنتيكاوي ملزمة قانونياً ونهائية بمجرد تأكيد الإرسال. يرجى التحقق من كافة صور وتفاصيل الفحص الفني المعتمد وتأمين ملاءتك المالية قبل المزايدة.'
      },
      {
        q: 'كيف يتم تتبع واستلام الشحنات الموثقة الفاخرة؟',
        a: 'بعد دفع القيمة، يقوم البائع بشحن السلعة عبر ناقل مؤمن تحت إشراف المنصة وتزويدنا برقم التتبع الدولي، حيث تظهر التحديثات اللوجستية مباشرة في صفحة المزاد لمراقبة سير الرحلة وحتى الاستلام النهائي.'
      }
    ] : [
      {
        q: 'How does the Secure Escrow Protection system work?',
        a: 'Your payment is safely held in the أنتيكاوي Escrow vault. The seller only receives your funds once you have confirmed safe delivery and verified that the luxury item exactly matches its authenticated descriptions.'
      },
      {
        q: 'What is the Anti-Snipe feature and bidding extension?',
        a: 'To guarantee absolute fairness, any bid placed during the final 2 minutes will automatically trigger a 3-minute extension to the remaining duration. This allows all interested buyers an equal, unmanaged chance.'
      },
      {
        q: 'Can I cancel, withdraw, or lower my bid?',
        a: 'No. All registered bids are legally binding contracts on our secure network. Please carefully study the certificate details, high-resolution condition logs, and your liquidity before placing a bid.'
      },
      {
        q: 'How do I handle the certified delivery tracking?',
        a: 'Immediately upon checkout, the seller is alerted to dispatch the luxury load via secure insured couriers. Once the tracking metrics are registered, live updates populate right under the logistics tracker here in real time.'
      }
    ];
  }, [lang]);

  // Price escalation sparkline chart data
  const chartData = React.useMemo(() => {
    const base = {
      name: lang === 'ar' ? 'سعر البداية' : 'Start Price',
      price: auction.startPrice,
      bidder: lang === 'ar' ? 'الافتتاح' : 'Start'
    };
    if (bids.length === 0 && auction.currentPrice > auction.startPrice) {
      return [
        base,
        {
          name: lang === 'ar' ? 'السعر الحالي' : 'Current Price',
          price: auction.currentPrice,
          bidder: auction.highBidderName || (lang === 'ar' ? 'المتصدر' : 'Lead')
        }
      ];
    }
    const list = [...bids].reverse().map((b, idx) => ({
      name: `${lang === 'ar' ? 'مزايدة' : 'Bid'} #${idx + 1}`,
      price: b.amount,
      bidder: b.bidderName || b.bidderEmail.split('@')[0]
    }));
    return [base, ...list];
  }, [bids, auction.startPrice, auction.currentPrice, auction.highBidderName, lang]);

  const [analyticsTab, setAnalyticsTab] = useState<'progression' | 'peak'>('progression');

  // Detailed chronological progression data for recharts connection 
  const detailedProgressionData = React.useMemo(() => {
    const baseDate = new Date(auction.createdDate || Date.now() - 3600000 * 24);
    const startPoint = {
      name: lang === 'ar' ? 'سعر الافتتاح' : 'Opening Price',
      timeLabel: baseDate.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      dateLabel: baseDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' }),
      price: auction.startPrice,
      bidderName: lang === 'ar' ? 'البداية' : 'Start',
      isStart: true
    };

    if (bids.length === 0) {
      if (auction.currentPrice > auction.startPrice) {
        const midDate = new Date(baseDate.getTime() + (Date.now() - baseDate.getTime()) / 2);
        const nowDate = new Date();
        return [
          startPoint,
          {
            name: lang === 'ar' ? 'مزايدة #1 (مسجلة)' : 'Bid #1 (Recorded)',
            timeLabel: midDate.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
            dateLabel: midDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            price: Math.round((auction.startPrice + auction.currentPrice) / 2),
            bidderName: lang === 'ar' ? 'مزايد موثق' : 'Verified Bidder',
            isStart: false
          },
          {
            name: lang === 'ar' ? 'أعلى سعر واصل' : 'Current Peak Bid',
            timeLabel: nowDate.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
            dateLabel: nowDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            price: auction.currentPrice,
            bidderName: auction.highBidderName || (lang === 'ar' ? 'المتصدر الحالي' : 'Current Leader'),
            isStart: false
          }
        ];
      }
      return [startPoint];
    }

    const points = [...bids].reverse().map((b, idx) => {
      const bidDate = new Date(b.timestamp);
      return {
        name: `${lang === 'ar' ? 'مزايدة' : 'Bid'} #${idx + 1}`,
        timeLabel: bidDate.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        dateLabel: bidDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        price: b.amount,
        bidderName: b.bidderName || b.bidderEmail.split('@')[0],
        isStart: false
      };
    });

    return [startPoint, ...points];
  }, [bids, auction.startPrice, auction.currentPrice, auction.highBidderName, auction.createdDate, lang]);

  // Hourly/Period distribution calculation of bidding activity
  const hourDistribution = React.useMemo(() => {
    const dist = [
      { 
        period: lang === 'ar' ? 'فجراً (12ص - 6ص)' : 'Dawn (12AM-6AM)', 
        count: 0,
        color: '#f59e0b'
      },
      { 
        period: lang === 'ar' ? 'صباحاً (6ص - 12م)' : 'Morning (6AM-12PM)', 
        count: 0,
        color: '#10b981'
      },
      { 
        period: lang === 'ar' ? 'بعد الظهر (12م - 6م)' : 'Afternoon (12PM-6PM)', 
        count: 0,
        color: '#3b82f6'
      },
      { 
        period: lang === 'ar' ? 'مساءً (6م - 12ص)' : 'Evening (6PM-12AM)', 
        count: 0,
        color: '#ec4899'
      },
    ];

    bids.forEach(b => {
      const h = new Date(b.timestamp).getHours();
      if (h >= 0 && h < 6) dist[0].count += 1;
      else if (h >= 6 && h < 12) dist[1].count += 1;
      else if (h >= 12 && h < 18) dist[2].count += 1;
      else dist[3].count += 1;
    });

    return dist;
  }, [bids, lang]);

  // Live Carrier API Sync query
  const handleCarrierApiLookup = async () => {
    if (!shipment || !shipment.carrier || !shipment.trackingNumber) return;
    setSyncLoading(true);
    try {
      const res = await fetch(`/api/shipping/carrier-lookup?carrier=${encodeURIComponent(shipment.carrier)}&trackingNumber=${encodeURIComponent(shipment.trackingNumber)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCarrierApiData(data.apiLookup);
        }
      }
    } catch (e) {
      console.warn('Carrier lookup query deferred:', e);
    } finally {
      setSyncLoading(false);
    }
  };

  // Poll of auction metrics and bids
  const fetchAuctionDetails = async () => {
    try {
      const r = await fetch(`/api/auctions/${auction.id}`);
      if (r.ok) {
        const d = await r.json();
        setAuction(d.auction);
      }
    } catch (e) {
      console.warn('Auction details query deferred:', e);
    }
  };

  const fetchBidsAndShipments = async () => {
    try {
      // Find bids for this auction specifically
      const rb = await fetch(`/api/auctions/${auction.id}/bids`);
      if (rb.ok) {
        const db = await rb.json();
        setBids(db.bids || []);
      }

      // Fetch logistics / shipments
      const rs = await fetch('/api/shipments');
      if (rs.ok) {
        const ds = await rs.json();
        const foundShip = ds.shipments.find((s: Shipment) => s.auctionId === auction.id);
        if (foundShip) {
          setShipment(foundShip);
        }
      }

      // Fetch escrow
      const re = await fetch('/api/escrows');
      if (re.ok) {
        const de = await re.json();
        const foundEscrow = de.escrows.find((e: EscrowTransaction) => e.auctionId === auction.id);
        if (foundEscrow) setEscrow(foundEscrow);
      }
    } catch (e) {
      console.warn('Logistics and escrow query deferred:', e);
    }
  };

  const fetchMarketInsight = async () => {
    setLoadingInsight(true);
    try {
      const res = await fetch(`/api/auctions/${auction.id}/market-insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.insight) {
          setMarketInsight(data.insight);
        }
      }
    } catch (err) {
      console.warn('Market insight fetch error:', err);
    } finally {
      setLoadingInsight(false);
    }
  };

  useEffect(() => {
    fetchMarketInsight();
  }, [auction.id, lang]);

  useEffect(() => {
    fetchAuctionDetails();
    fetchBidsAndShipments();
    
    // Quick polling for active bid simulation
    const interval = setInterval(() => {
      fetchAuctionDetails();
      fetchBidsAndShipments();
    }, 5000);

    return () => clearInterval(interval);
  }, [auction.id]);

  // Handle placing a live bid (triggers confirmation modal)
  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine || !isOnline) {
      setErrorMsg(
        lang === 'ar'
          ? '⚠️ تنبيه: انقطع الاتصال بالإنترنت. تعذر إرسال المزايدة أثناء عدم الاتصال لمنع فشل العملية.'
          : '⚠️ Warning: Network connection lost. Bid submission prevented while offline.'
      );
      return;
    }

    if (!user) {
      setErrorMsg(t.unauthorizedBid);
      return;
    }

    if (!bidValidation.isValid) {
      setErrorMsg(bidValidation.message);
      return;
    }

    const value = Number(bidAmount);
    setConfirmValue(value);
    setShowConfirmModal(true);
  };

  // Handle quick bid increment selection (triggers confirmation modal)
  const handleQuickBidIncrement = (targetAmount: number) => {
    if (!navigator.onLine || !isOnline) {
      setErrorMsg(
        lang === 'ar'
          ? '⚠️ تنبيه: انقطع الاتصال بالإنترنت. تعذر إرسال المزايدة أثناء عدم الاتصال لمنع فشل العملية.'
          : '⚠️ Warning: Network connection lost. Bid submission prevented while offline.'
      );
      return;
    }

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(12); } catch (_) {}
    }
    setBidAmount(targetAmount.toString());
    if (!user) {
      setErrorMsg(t.unauthorizedBid);
      return;
    }
    setConfirmValue(targetAmount);
    setShowConfirmModal(true);
  };

  // Submit the confirmed bid
  const submitConfirmedBid = async () => {
    if (!navigator.onLine || !isOnline) {
      setErrorMsg(
        lang === 'ar'
          ? '⚠️ تنبيه: انقطع الاتصال بالإنترنت. تعذر إرسال المزايدة أثناء عدم الاتصال لمنع فشل العملية.'
          : '⚠️ Warning: Network connection lost. Bid submission prevented while offline.'
      );
      return;
    }

    setShowConfirmModal(false);
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/auctions/${auction.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: confirmValue,
          email: user?.email,
          name: user?.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const newBidObj: Bid = {
            id: `bid_${Date.now()}`,
            auctionId: auction.id,
            bidderName: user?.name || (lang === 'ar' ? 'مزايد معتمد' : 'Verified Bidder'),
            bidderEmail: user?.email || 'user@antkawy.com',
            amount: confirmValue,
            timestamp: new Date().toISOString()
          };
          setBids((prev) => [newBidObj, ...prev.filter(b => b.amount !== confirmValue)]);
          setAuction((prev) => ({
            ...prev,
            currentPrice: confirmValue,
            bidsCount: (prev.bidsCount || 0) + 1,
            highBidder: user?.email,
            highBidderName: user?.name
          }));

          setSuccessMsg(lang === 'ar' ? data.messageAr : data.messageEn);
          setBidAmount('');
          setShowTopBidConfetti(true);
          audioSynth.playGavelStrike();
          if (voiceAnnounceEnabled) {
            audioSynth.announceBid(confirmValue, currency, lang);
          }
          onBidSuccess();
          fetchAuctionDetails();
          fetchBidsAndShipments();
          setLoading(false);
          return;
        } else {
          setErrorMsg(lang === 'ar' ? data.messageAr : data.messageEn);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API bid submission deferred, resorting to direct Firestore handler:', err);
    }

    // Direct Firestore bid fallback (ensures bidding always succeeds)
    if (user) {
      try {
        const fRes = await submitBidInFirestore(auction.id, confirmValue, user);
        if (fRes.success) {
          const newBidObj: Bid = {
            id: `bid_${Date.now()}`,
            auctionId: auction.id,
            bidderName: user.name,
            bidderEmail: user.email,
            amount: confirmValue,
            timestamp: new Date().toISOString()
          };
          setBids((prev) => [newBidObj, ...prev.filter(b => b.amount !== confirmValue)]);
          setAuction((prev) => ({
            ...prev,
            currentPrice: confirmValue,
            bidsCount: (prev.bidsCount || 0) + 1,
            highBidder: user.email,
            highBidderName: user.name
          }));

          setSuccessMsg(lang === 'ar' ? fRes.messageAr : fRes.messageEn);
          setBidAmount('');
          setShowTopBidConfetti(true);
          audioSynth.playGavelStrike();
          if (voiceAnnounceEnabled) {
            audioSynth.announceBid(confirmValue, currency, lang);
          }
          onBidSuccess();
          fetchAuctionDetails();
          fetchBidsAndShipments();
        } else {
          setErrorMsg(lang === 'ar' ? fRes.messageAr : fRes.messageEn);
        }
      } catch (e: any) {
        setErrorMsg(lang === 'ar' ? 'فشل الاتصال بالخادم. يرجى إعادة المحاولة' : 'Server connection failed.');
      }
    } else {
      setErrorMsg(t.unauthorizedBid);
    }
    setLoading(false);
  };

  // Pre-fill minimum bid increment
  const prefillBid = () => {
    setBidAmount(minRequiredBid.toString());
  };

  // Immediate buyout purchase
  const handleBuyout = async () => {
    if (!user) {
      setErrorMsg(t.unauthorizedBid);
      return;
    }
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في استخدام خيار الشراء الفوري واقتناء السلعة الآن؟' : 'Are you sure you want to buy this item instantly?')) {
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/auctions/${auction.id}/buyout`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(lang === 'ar' ? data.messageAr : data.messageEn);
        setShowCheckout(true);
        fetchAuctionDetails();
        fetchBidsAndShipments();
      } else {
        setErrorMsg(lang === 'ar' ? data.messageAr : data.messageEn);
      }
    } catch (err) {
      setErrorMsg(lang === 'ar' ? 'فشل اتمام الشراء الفوري' : 'Buyout execution failed.');
    } finally {
      setLoading(false);
    }
  };

  // Checkout and lock funds in escrow
  const handleCheckoutSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);

    let methodLabel = '';
    let detailsLabel = '';

    if (paymentMethod === 'card') {
      methodLabel = lang === 'ar' ? 'بطاقة ائتمانية' : 'Credit Card';
      detailsLabel = `Cardending: *${payCardNumber.slice(-4) || '9010'}`;
    } else if (paymentMethod === 'paypal') {
      methodLabel = lang === 'ar' ? 'بايبال (E-Wallet)' : 'PayPal E-Wallet';
      detailsLabel = paypalEmail || user?.email || 'paypal_customer';
    } else if (paymentMethod === 'applepay') {
      methodLabel = lang === 'ar' ? 'أبل باي (Apple Pay)' : 'Apple Pay Wallet';
      detailsLabel = `Token ID: apl_${Math.floor(Math.random() * 900000 + 100000)}`;
    } else if (paymentMethod === 'stcpay') {
      methodLabel = lang === 'ar' ? 'إس تي سي باي (STC Pay)' : 'STC Pay Wallet';
      detailsLabel = `Phone: ${stcPhone}`;
    } else if (paymentMethod === 'crypto') {
      methodLabel = `Crypto Escrow (${cryptoToken})`;
      detailsLabel = cryptoTxHash || `Hash: 0x${Math.random().toString(16).substr(2, 20)}`;
    }

    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: auction.id,
          amount: auction.currentPrice,
          paymentMethod: methodLabel,
          paymentDetails: detailsLabel
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.messageAr);
        setShowCheckout(false);
        fetchAuctionDetails();
        fetchBidsAndShipments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Release Escrow funds by Confirming Delivery
  const handleReleaseEscrow = async () => {
    if (!window.confirm(lang === 'ar' ? 'هل تؤكد استلامك السلعة كاملة وسليمة ومطابقة للمواصفات لإطلاق الضمان المالي المالي للبائع؟' : 'Confirm release of escrow funds to seller?')) {
      return;
    }

    try {
      const res = await fetch(`/api/escrows/${auction.id}/release`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.messageAr);
        fetchAuctionDetails();
        fetchBidsAndShipments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Remaining active countdown
  const isAuctionClosed = timeLeft.isExpired || auction.status === 'completed';
  const isWinner = isAuctionClosed && auction.highBidder === user?.email;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* Top Navigation Row: Back button & Share button */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="cursor-pointer group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-amber-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>{lang === 'ar' ? 'العودة لقائمة المزادات' : 'Back to Listings'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleQrAction}
            className="cursor-pointer group flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-[#0a0a0b] border border-white/10 hover:border-amber-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all shadow-lg active:scale-95"
            title={lang === 'ar' ? 'عرض رمز الاستجابة السريعة QR للمسح عبر الهاتف' : 'View QR Code for Mobile Scanning'}
            id="btn-qr-auction-top"
          >
            <QrCode className="h-3.5 w-3.5 text-amber-500 group-hover:text-[#0a0a0b] transition-colors shrink-0" />
            <span>{lang === 'ar' ? 'رمز QR' : 'QR Code'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="cursor-pointer group flex items-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/30 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-400 transition-all shadow-lg active:scale-95"
            title={lang === 'ar' ? 'مسح رمز الملصق أو بطاقة القطعة' : 'Scan Tag or QR Code'}
            id="btn-scan-tag-top"
          >
            <Scan className="h-3.5 w-3.5 text-amber-400 group-hover:text-black transition-colors shrink-0" />
            <span>{lang === 'ar' ? 'مسح الرمز 📷' : 'Scan Tag 📷'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLiveOverlay(true)}
            className="cursor-pointer group flex items-center gap-2 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/50 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-red-400 hover:text-white transition-all shadow-lg active:scale-95 animate-pulse"
            title={lang === 'ar' ? 'عرض المزاد ببث مباشر على الشاشة كاملة' : 'View Full-Screen Live Auction'}
            id="btn-live-auction-top"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>{lang === 'ar' ? 'البث المباشر 🔴' : 'Live Mode 🔴'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShow3DModal(true)}
            className="cursor-pointer group flex items-center gap-2 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 transition-all shadow-lg active:scale-95"
            title={lang === 'ar' ? 'معاينة التحفة 3D ومحاكاة المعرض' : '3D Artifact Showcase'}
          >
            <Box className="h-3.5 w-3.5 text-amber-400 group-hover:text-black transition-colors shrink-0" />
            <span>{lang === 'ar' ? 'معاينة 360°' : '3D View'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCertModal(true)}
            className="cursor-pointer group flex items-center gap-2 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 transition-all shadow-lg active:scale-95"
            title={lang === 'ar' ? 'عرض وثيقة الملكية المعتمدة' : 'Official Certificate'}
          >
            <Award className="h-3.5 w-3.5 text-amber-400 group-hover:text-black transition-colors shrink-0" />
            <span>{lang === 'ar' ? 'شهادة الملكية' : 'Certificate'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConditionScannerModal(true)}
            className="cursor-pointer group flex items-center gap-2 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 transition-all shadow-lg active:scale-95"
            title={lang === 'ar' ? 'فحص سلامة وتعتيق القطعة الذكي' : 'AI Forensic Scanner'}
          >
            <Scan className="h-3.5 w-3.5 text-amber-400 group-hover:text-black transition-colors shrink-0" />
            <span>{lang === 'ar' ? 'فحص الحالة' : 'Scan Condition'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSocialExporterModal(true)}
            className="cursor-pointer group flex items-center gap-2 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366] hover:text-black border border-[#25D366]/40 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#25D366] group-hover:text-black transition-all shadow-lg active:scale-95"
            title={lang === 'ar' ? 'مشاركة بطاقة المزاد على الواتساب وتليجرام' : 'Export to WhatsApp/Telegram'}
          >
            <Share2 className="h-3.5 w-3.5 shrink-0" />
            <span>{lang === 'ar' ? 'واتساب / تليجرام' : 'Social Export'}</span>
          </button>

          <button
            type="button"
            onClick={() => setVoiceAnnounceEnabled(!voiceAnnounceEnabled)}
            className={`cursor-pointer flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
              voiceAnnounceEnabled ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'
            }`}
            title={voiceAnnounceEnabled ? (lang === 'ar' ? 'تعطيل المعلق الصوتي' : 'Mute AI Announcer') : (lang === 'ar' ? 'تفعيل المعلق الصوتي' : 'Enable AI Announcer')}
          >
            {voiceAnnounceEnabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{lang === 'ar' ? 'المنادي الصوتي' : 'Voice AI'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareAction}
            className="cursor-pointer group flex items-center gap-2 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-[#0a0a0b] border border-white/10 hover:border-amber-500 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all shadow-lg active:scale-95"
            title={lang === 'ar' ? 'مشاركة رابط المزاد وتوليد رابط مخصص' : 'Share Auction Link'}
            id="btn-share-auction-top"
          >
            <Share2 className="h-3.5 w-3.5 text-amber-500 group-hover:text-[#0a0a0b] transition-colors shrink-0" />
            <span>{lang === 'ar' ? 'مشاركة المزاد' : 'Share Auction'}</span>
          </button>
        </div>
      </div>

      {/* Victory Celebration Banner & Animated Confetti when user is winner or places top bid */}
      <VictoryCelebrationEffect
        isWinner={isWinner}
        showTopBidConfetti={showTopBidConfetti}
        onConfettiClose={() => setShowTopBidConfetti(false)}
        auctionTitle={lang === 'ar' ? auction.titleAr : auction.titleEn}
        winningBidAmount={auction.currentPrice}
        currency={currency}
        lang={lang}
        onProceedToCheckout={() => setShowCheckout(true)}
      />

      {/* Main Grid display split into Bento cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image, Info and Logistics updates */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Visual showcase Card */}
          <div className="overflow-hidden rounded bg-[#0d0d0f] border border-white/10 p-4 sm:p-6 shadow-2xl">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded bg-[#0a0a0b] border border-white/5 group">
              <img
                src={images[currentImageIndex]}
                alt={lang === 'ar' ? `${auction.titleAr} - ${currentImageIndex + 1}` : `${auction.titleEn} - ${currentImageIndex + 1}`}
                className="h-full w-full object-cover opacity-90 transition-all duration-300"
              />
              <span className="absolute left-3 top-3 rounded bg-amber-500 text-black font-extrabold uppercase tracking-widest px-3 py-1 text-[10px] shadow-lg z-10 select-none">
                {t[auction.category as keyof typeof t] || auction.category}
              </span>
              
              {/* Image Position and Total Index */}
              <span className="absolute right-3 top-3 rounded bg-black/70 text-amber-500 border border-white/10 font-mono text-[10px] px-2 py-0.5 shadow z-10 select-none">
                {currentImageIndex + 1} / {images.length}
              </span>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white hover:bg-amber-500 hover:text-black opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10"
                    title={lang === 'ar' ? 'الصورة السابقة' : 'Previous Image'}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white hover:bg-amber-500 hover:text-black opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10"
                    title={lang === 'ar' ? 'الصورة التالية' : 'Next Image'}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Lightbox / Zoom-in Trigger Overlay */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200 cursor-zoom-in z-0 group"
                title={lang === 'ar' ? 'عرض ملء الشاشة' : 'View Fullscreen'}
              >
                <div className="flex items-center gap-1.5 rounded-full bg-black/80 border border-white/10 px-4 py-2 text-xs font-bold text-amber-500 shadow-2xl scale-95 group-hover:scale-100 transition-all">
                  <ZoomIn className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'انقر لتكبير الصورة' : 'Click to zoom'}</span>
                </div>
              </button>
            </div>

            {/* Thumbnail Selection Row */}
            {images.length > 1 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 select-none" id={`thumbnails-${auction.id}`}>
                {images.map((img, idx) => (
                  <button
                    key={`thumb-${auction.id}-${idx}`}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative aspect-[16/10] w-16 sm:w-20 overflow-hidden rounded bg-black transition-all cursor-pointer ${
                      idx === currentImageIndex
                        ? 'ring-2 ring-amber-500 scale-105 opacity-100'
                        : 'border border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Escrow Milestone & Logistics Visual Tracker */}
            <EscrowLogisticsTracker
              escrow={escrow}
              shipment={shipment}
              lang={lang}
              currency={currency}
            />

            {/* Core Details */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl sm:text-3xl font-serif font-semibold leading-tight text-white italic">
                  {lang === 'ar' ? auction.titleAr : auction.titleEn}
                </h2>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] font-extrabold text-amber-400 uppercase tracking-widest">
                    <Sparkles className="h-3 w-3" />
                    {t[auction.itemCondition as keyof typeof t]}
                  </span>
                  
                  <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300">
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    {auction.viewsCount} {t.views}
                  </span>

                  <button
                    type="button"
                    onClick={handleQrAction}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded bg-white/5 hover:bg-amber-500 hover:text-[#0a0a0b] border border-white/10 hover:border-amber-500 px-2.5 py-1 text-xs font-bold text-slate-300 transition-all shadow active:scale-95"
                    title={lang === 'ar' ? 'عرض رمز QR' : 'QR Code'}
                    id="btn-qr-auction-title"
                  >
                    <QrCode className="h-3.5 w-3.5 text-amber-500 hover:text-[#0a0a0b] transition-colors" />
                    <span>{lang === 'ar' ? 'رمز QR' : 'QR Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareAction}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded bg-white/5 hover:bg-amber-500 hover:text-[#0a0a0b] border border-white/10 hover:border-amber-500 px-2.5 py-1 text-xs font-bold text-slate-300 transition-all shadow active:scale-95"
                    title={lang === 'ar' ? 'مشاركة هذا المزاد' : 'Share'}
                    id="btn-share-auction-title"
                  >
                    <Share2 className="h-3.5 w-3.5 text-amber-500 hover:text-[#0a0a0b] transition-colors" />
                    <span>{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4 border-t border-white/5 pt-4">
                <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                  {lang === 'ar' ? 'تفاصيل السلعة المعتمدة' : 'Official Authentication Specs'}
                </h4>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed font-light whitespace-pre-line">
                  {lang === 'ar' ? auction.descAr : auction.descEn}
                </p>
              </div>

              {/* Gemini AI Market Insight Box */}
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-purple-500/[0.05] p-4 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    </div>
                    <h4 className="text-xs font-serif font-bold tracking-wide text-white uppercase flex items-center gap-1.5">
                      <span>{lang === 'ar' ? 'نظرة السوق الذكية وتقييم الندرة' : 'AI Market Insight & Scarcity'}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold uppercase">Gemini AI</span>
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={fetchMarketInsight}
                    disabled={loadingInsight}
                    className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-50"
                    title={lang === 'ar' ? 'تحديث الرؤية التقديرية' : 'Refresh AI Appraisal'}
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingInsight ? 'animate-spin text-amber-500' : ''}`} />
                    <span className="hidden sm:inline">{lang === 'ar' ? 'تحديث الرؤية' : 'Refresh'}</span>
                  </button>
                </div>

                {loadingInsight ? (
                  <div className="py-4 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="h-5 w-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-[11px] text-slate-400 font-mono animate-pulse">
                      {lang === 'ar' ? 'جاري تحليل مؤشرات الندرة والقيمة التاريخية عبر محرك Gemini...' : 'Analyzing artifact scarcity and historical valuation via Gemini AI...'}
                    </p>
                  </div>
                ) : marketInsight ? (
                  <div className="text-xs text-slate-300 leading-relaxed font-light whitespace-pre-line space-y-2 font-serif">
                    {marketInsight}
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <p className="text-xs text-slate-400">
                      {lang === 'ar' ? 'انقر لتوليد تقرير استثماري وتحليل ندرة القطعة عبر الذكاء الاصطناعي.' : 'Click to generate an AI investment appraisal and scarcity report.'}
                    </p>
                    <button
                      type="button"
                      onClick={fetchMarketInsight}
                      className="mt-2.5 cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'توليد تقرير السوق الآن' : 'Generate Market Report'}</span>
                    </button>
                  </div>
                )}
                
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>{lang === 'ar' ? '🔒 تحليل مدعوم بنموذج Gemini التقديري' : '🔒 Valuation powered by Gemini Appraisal Model'}</span>
                  <span>{lang === 'ar' ? 'تحديث لحظي لبيانات السلع' : 'Real-time asset intelligence'}</span>
                </div>
              </div>

              {/* Seller Profile Summary Card */}
              <div className="mt-6 rounded-xl bg-gradient-to-br from-[#131316] via-[#16161a] to-[#121214] p-4 sm:p-5 border border-amber-500/30 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    {auction.seller.logo ? (
                      <img
                        src={auction.seller.logo}
                        alt={auction.seller.name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-amber-500/50 shadow-md shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-serif font-black text-sm shadow-md shrink-0">
                        {auction.seller.name.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sellerBadge.pillClass}`}>
                          {sellerBadge.badgeTitle}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          {lang === 'ar' ? 'ضمان الأصالة 100%' : '100% Authentic'}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white font-serif mt-1 tracking-wide">
                        {auction.seller.name}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 py-1 bg-white/[0.03] rounded-lg p-3 border border-white/5 font-mono">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded bg-amber-500/10 text-amber-400">
                      <Star className="h-4 w-4 fill-amber-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">{lang === 'ar' ? 'تقييم البائع' : 'Seller Rating'}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-white">{auction.seller.rating || 5.0}</span>
                        <span className="text-[10px] text-amber-400">★</span>
                        <span className="text-[9px] text-slate-500 font-sans">({lang === 'ar' ? 'ممتاز' : 'Excellent'})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 border-l border-white/10 pl-3">
                    <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans">{lang === 'ar' ? 'إجمالي المزادات المباعة' : 'Total Auctions Sold'}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-white">
                          {auction.seller.totalSold ?? Math.max(14, (auction.seller.name.length * 7) % 120 + 18)}
                        </span>
                        <span className="text-[9px] text-emerald-400 font-sans">{lang === 'ar' ? 'صفقة ناجحة' : 'Successful'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seller Description snippet */}
                <p className="text-xs text-slate-300 leading-relaxed font-light line-clamp-2">
                  {lang === 'ar' 
                    ? (auction.seller.description || 'جهة موثقة رسمياً ومعتمدة لعرض المزادات الفاخرة والسلع النادرة بضمان الفحص والاختبار الشامل.')
                    : (auction.seller.descriptionEn || 'Officially certified and verified consignor specializing in luxury auctions and rare assets with complete appraisal guarantee.')}
                </p>

                {/* Store Profile Link Button */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-slate-400" />
                    {lang === 'ar' ? `عضو منذ ${auction.seller.memberSince || '2021'}` : `Member since ${auction.seller.memberSince || '2021'}`}
                  </span>

                  <a
                    href={auction.seller.storeUrl || `#store-${encodeURIComponent(auction.seller.name)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowSellerProfileModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all shadow-sm group cursor-pointer"
                  >
                    <Store className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    <span>{lang === 'ar' ? 'زيارة المتجر والملف العام' : 'View Store / Public Profile'}</span>
                    <ExternalLink className="h-3 w-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Secure Escrow protection Warning Box */}
          <div className="flex items-start gap-4 rounded border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5">
            <Lock className="mt-1 h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest font-serif italic">
                🛡️ {lang === 'ar' ? 'نظام الضمان وحماية البائع والمشتري' : 'Escrow Fund Protection Protocol'}
              </h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed font-light">
                {t.secureEscrowAlert}
              </p>
            </div>
          </div>

          {/* Integrated Recharts Auction Analytics Component */}
          <div id="bidding-analytics-section">
            <AuctionAnalytics auction={auction} bids={bids} lang={lang} currency={currency} />
          </div>

          {/* FAQ Accordion Section */}
          <div className="rounded border border-white/10 bg-[#0d0d0f] p-4 sm:p-6 shadow-xl space-y-4" id="faq-accordions">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <HelpCircle className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm sm:text-base font-serif font-black text-white italic">
                {lang === 'ar' ? 'الأسئلة الشائعة وسياسة الضمان' : 'Frequently Asked Questions & Escrow Policy'}
              </h3>
            </div>
            
            <div className="space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index} 
                    className="border border-white/5 rounded overflow-hidden transition-colors duration-200 bg-[#111113] hover:border-white/10"
                    id={`faq-item-${index}`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between gap-3 p-3.5 text-right font-medium text-xs sm:text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
                      id={`faq-btn-${index}`}
                    >
                      <span className="font-serif font-semibold tracking-wide text-amber-500/90 hover:text-amber-500">
                        {faq.q}
                      </span>
                      <ChevronDown 
                        className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-amber-500' : ''
                        }`}
                      />
                    </button>
                    
                    <div 
                      className={`transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-52 border-t border-white/5 opacity-100 p-3.5' : 'max-h-0 opacity-0 pointer-events-none'
                      } overflow-hidden`}
                      id={`faq-answer-${index}`}
                    >
                      <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-light font-sans">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipment tracking status card IF bought/checkout */}
          {shipment && (
            <div className="overflow-hidden rounded border border-white/10 bg-[#0d0d0f] p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-amber-500" />
                  <h3 className="text-sm sm:text-base font-serif font-black text-white italic">
                    {t.shipmentTracking} ({shipment.carrier || (lang === 'ar' ? 'انتظار الشحن' : 'Pending Ship')})
                  </h3>
                </div>
                
                {shipment.trackingNumber ? (
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{t.trackingNo}</p>
                    <p className="text-xs font-mono font-bold text-amber-500">{shipment.trackingNumber}</p>
                  </div>
                ) : (
                  <span className="rounded bg-rose-500/15 border border-rose-500/30 text-[10px] text-rose-400 font-extrabold px-2.5 py-1 animate-pulse uppercase tracking-wider">
                    {lang === 'ar' ? 'بانتظار رقم التتبع' : 'Awaiting Tracking'}
                  </span>
                )}
              </div>

              {!shipment.trackingNumber ? (
                <div className="rounded border border-amber-500/10 bg-amber-500/5 p-4 text-center">
                  <p className="text-xs font-black text-amber-400">📦 {lang === 'ar' ? 'بانتظار قيام البائع بشحن السلعة' : 'Waiting for Seller Dispatch'}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    {lang === 'ar' 
                      ? 'تم تأمين مبلغ المزاد وحجزه بنجاح بالضمان (Escrow). قمنا بإشعار البائع لتسليم السلعة لمركز الشحن المعتمد وتزويدنا برقم بوليصة التتبع الرسمية لتفعيل الخدمة.' 
                      : 'Auction security deposit is successfully held. Seller was requested to dispatch the consignment and input valid tracking metrics immediately.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Option to live query the carrier's REST API */}
                  <div className="flex items-center justify-between gap-2 bg-[#161618] p-2 rounded border border-white/5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">
                      📡 {lang === 'ar' ? 'خدمة ربط بوابات الشحن الخارجية:' : 'Carrier Integrations API Link:'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCarrierApiLookup}
                      disabled={syncLoading}
                      className="cursor-pointer flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-amber-500 border border-amber-500/30 rounded bg-amber-500/5 hover:bg-amber-500/10 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${syncLoading ? 'animate-spin' : ''}`} />
                      <span>{syncLoading ? '...' : (lang === 'ar' ? 'استعلام وتحديث فوري' : 'Live Gateway Sync')}</span>
                    </button>
                  </div>

                  {/* Render simulated carrier API telemetry logs underneath if queried */}
                  {carrierApiData && (
                    <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                        <span className="text-[10px] text-emerald-400 font-mono tracking-wider font-extrabold uppercase">
                          🟢 {carrierApiData.carrier} (Online Active)
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {carrierApiData.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {carrierApiData.events.map((ev: any, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                            <div className="text-[11px]">
                              <p className="font-extrabold text-white leading-tight">
                                {lang === 'ar' ? ev.statusAr : ev.status}
                              </p>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                {lang === 'ar' ? ev.cityAr : ev.city} &bull; <span className="font-mono">{new Date(ev.timestamp).toLocaleTimeString(lang==='ar'?'ar-EG':'en-US')}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Standard local backend/database timeline updates */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                      {lang === 'ar' ? 'تاريخ التحديثات اللوجستية والفرز للمنصة' : 'Internal Logistics Platform Logs'}
                    </h4>
                    {shipment.history.map((hist, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="relative flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full ${
                            idx === 0 ? 'bg-amber-500 ring-4 ring-amber-500/25' : 'bg-white/10'
                          }`} />
                          {idx < shipment.history.length - 1 && (
                            <div className="w-px bg-white/10 flex-1 my-1 min-h-[40px]" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {hist.statusAr}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1 font-semibold">
                              <MapPin className="h-3 w-3 text-amber-500/60" />
                              {hist.cityAr}
                            </span>
                            <span>&bull;</span>
                            <span className="font-mono">{new Date(hist.timestamp).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Release button for escrow protection */}
              {escrow?.status === 'held' && (
                <div className="mt-6 border-t border-white/5 pt-4">
                  <button
                    onClick={handleReleaseEscrow}
                    className="w-full cursor-pointer flex items-center justify-center gap-2 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#0a0a0b] bg-amber-500 hover:bg-amber-400 rounded transition-all shadow-lg shadow-amber-500/10"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{t.releaseEscrowBtn}</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Interaction Bounties & Live Bids History */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Dedicated Seller Trust & Rating Badge Box */}
          <div className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-[#121216] via-[#16161c] to-[#0f0f12] p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  {auction.seller.logo ? (
                    <img
                      src={auction.seller.logo}
                      alt={auction.seller.name}
                      className="h-11 w-11 rounded-full object-cover border-2 border-amber-500/50 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-serif font-black text-sm shadow-md">
                      {auction.seller.name.substring(0, 2)}
                    </div>
                  )}
                  <ShieldCheck className="absolute -bottom-1 -right-1 h-4 w-4 text-emerald-400 bg-[#121216] rounded-full p-0.5 border border-emerald-500/40" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-black text-white font-serif truncate">
                      {auction.seller.name}
                    </h4>
                    <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      {lang === 'ar' ? `المستوى ${sellerBadge.level}` : `Level ${sellerBadge.level}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 text-amber-400 font-extrabold font-mono">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {sellerRating}
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {sellerBadge.trustScore} {lang === 'ar' ? 'نسبة الموثوقية' : 'Trust'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSellerProfileModal(true)}
                className="cursor-pointer shrink-0 p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-amber-400 border border-white/10 hover:border-amber-500/30 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-sm"
                title={lang === 'ar' ? 'استعراض ملف البائع ومتجره' : 'View full seller store'}
              >
                <Store className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline font-sans text-[11px]">{lang === 'ar' ? 'المتجر' : 'Store'}</span>
              </button>
            </div>

            {/* Badge Level Tag & Sales Counter Footer */}
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[10px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <BadgeCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{sellerBadge.badgeTitle}</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {sellerTotalSold} {lang === 'ar' ? 'صفقة مباعة' : 'Sold'}
              </span>
            </div>
          </div>
          
          {/* Live Action card */}
          <div className="rounded border border-white/10 bg-[#0d0d0f] p-4 sm:p-6 shadow-2xl">
            
            {/* Price state */}
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">
                {t.currentPrice}
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-amber-500">
                  {formatPrice(auction.currentPrice, currency, lang)}
                </span>
                
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">
                    {lang === 'ar' ? 'الزيادة التقدمية المحسوبة' : 'Calculated Increment'}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    +{formatPrice(calculateProgressiveIncrement(auction.currentPrice), currency, lang)}
                  </span>
                </div>
              </div>

              {/* Price Alert Button & Status Pill */}
              <div className="mt-3 pt-2.5 border-t border-white/10">
                {priceAlert ? (
                  <div className={`flex items-center justify-between p-2 rounded-xl border text-xs font-mono font-bold transition-all shadow-md ${
                    priceAlert.triggered 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    <div className="flex items-center gap-2 truncate">
                      <BellRing className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="truncate">
                        {lang === 'ar' 
                          ? `التنبيه مفعّل: ${formatPrice(priceAlert.targetPrice, currency, lang)}`
                          : `Alert at ${formatPrice(priceAlert.targetPrice, currency, lang)}`}
                        {priceAlert.triggered && (lang === 'ar' ? ' (تحقق الحد!)' : ' (Reached!)')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPriceAlertInput(priceAlert.targetPrice.toString());
                        setShowPriceAlertModal(true);
                      }}
                      className="ml-2 text-[10px] text-amber-300 hover:text-white underline cursor-pointer shrink-0 font-sans font-bold"
                    >
                      {lang === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPriceAlertInput((auction.currentPrice + minIncrementRule * 2).toString());
                      setShowPriceAlertModal(true);
                    }}
                    className="w-full cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Bell className="h-4 w-4 text-amber-400" />
                    <span>{lang === 'ar' ? '🔔 تفعيل تنبيه وصول السعر' : '🔔 Set Price Threshold Alert'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sparkline Trend visualization */}
            <div className="mt-4 rounded bg-[#131315] p-3 border border-white/5 space-y-1.5" id="sparkline-container">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400">
                  {lang === 'ar' ? 'منحنى تصاعد الأسعار التراكمي' : 'Value Escalation Curve'}
                </span>
                <span className="text-amber-500 font-mono">
                  {bids.length > 0 
                    ? `+${(((auction.currentPrice - auction.startPrice) / auction.startPrice) * 100).toFixed(1)}%` 
                    : lang === 'ar' ? 'سعر الافتتاح المعتمد' : 'Opening Price'}
                </span>
              </div>
              <div className="h-14 w-full" id="price-sparkline-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <defs>
                      <linearGradient id="sparkColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value;
                          const name = payload[0].payload.name;
                          const bidder = payload[0].payload.bidder;
                          return (
                            <div className="bg-[#1c1c1e] border border-white/10 p-1.5 rounded text-[10px] text-right" id="spark-tooltip">
                              <p className="font-mono font-bold text-amber-500 leading-none">
                                {formatPrice(Number(val), currency, lang)}
                              </p>
                              <p className="text-[8px] text-slate-400 mt-0.5 leading-none">
                                {name} {bidder ? `(${bidder})` : ''}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: 'rgba(245, 158, 11, 0.2)', strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#sparkColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expire / countdown panel with real-time countdown */}
            <div className="mt-4 rounded border border-white/5 bg-[#161618] p-3.5 space-y-2.5">
              <CountdownTimer endTime={auction.endTime} lang={lang} variant="details" />

              {/* End Time Reference Footer */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-white/5 pt-2">
                <span>{t.endsAt}:</span>
                <span className="font-mono font-bold text-slate-400">
                  {new Date(auction.endTime).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              </div>
            </div>

            {/* Dedicated Native Web Share API & Quick Share Box */}
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 sm:from-amber-500/10 via-[#161618] to-amber-500/10 p-3.5 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 rounded-lg bg-amber-500 text-black shrink-0 shadow">
                    <Share2 className="h-4 w-4 animate-bounce" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-black text-white block truncate">
                      {lang === 'ar' ? 'مشاركة هذا المزاد الفاخر' : 'Share This Luxury Auction'}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate font-mono">
                      {lang === 'ar' ? 'عبر Web Share API أو نسخ الرابط' : 'Via Web Share API or Copy Link'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleShareAction}
                  className="cursor-pointer shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                  id="btn-share-auction-sidebar"
                  title={lang === 'ar' ? 'مشاركة المزاد عبر قائمة الجهاز أو منصات التواصل' : 'Share auction via native OS sheet or social media'}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
                </button>
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="cursor-pointer flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-colors"
                >
                  {copiedShareLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-extrabold">{lang === 'ar' ? 'تم نسخ رابط المزاد!' : 'Auction Link Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'نسخ الرابط المباشر' : 'Copy Direct Link'}</span>
                    </>
                  )}
                </button>
                <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
                  {lang === 'ar' ? 'قوائم مشاركة التواصل الاجتماعي' : 'Native social sharing sheets'}
                </span>
              </div>
            </div>

            {/* Feedback alert cards */}
            {priceAlertBanner && (
              <div className="mt-4 rounded-xl bg-amber-500/15 p-3 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-start justify-between gap-3 shadow-lg animate-pulse">
                <div className="flex items-start gap-2">
                  <BellRing className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">{priceAlertBanner}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPriceAlertBanner(null)}
                  className="text-amber-400 hover:text-white p-1 cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 rounded bg-rose-950/20 p-2.5 border border-rose-900/40 text-rose-400 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {!isOnline && (
              <div className="mt-4 rounded-xl bg-amber-500/10 p-3 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {lang === 'ar'
                    ? '⚠️ تنبيه: تم فقدان الاتصال بالإنترنت. تم تفعيل حماية منع فشل المزايدة أثناء عدم الاتصال.'
                    : '⚠️ Network Offline: Connection lost. Offline bid protection active to prevent failed submissions.'}
                </span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 rounded bg-amber-500/10 p-2.5 border border-amber-500/20 text-amber-400 text-xs font-bold">
                {successMsg}
              </div>
            )}

            {/* Anti snipe notice */}
            {!isAuctionClosed && (
              <div className="mt-3 text-[10px] text-amber-500 leading-relaxed bg-amber-500/5 px-2.5 py-1.5 rounded border border-amber-500/10">
                ⚠️ {t.antiSnipeAlert}
              </div>
            )}

            {/* BIDDING CONTROLS FORM */}
            {!isAuctionClosed ? (
              <form onSubmit={handlePlaceBid} className="mt-5 space-y-3">
                {/* Progressive Increment Display Box */}
                <div className="rounded border border-amber-500/15 bg-amber-500/5 p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                      {lang === 'ar' ? 'معدل الزيادة التقدمية المحسوبة:' : 'Progressive Bid Increment:'}
                    </span>
                    <span className="font-mono text-amber-400 font-black">
                      +{formatPrice(calculateProgressiveIncrement(auction.currentPrice), currency, lang)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-white/5 pt-1.5">
                    <span>
                      {lang === 'ar' ? 'الحد الأدنى التالي للمزايدة المقترحة:' : 'Suggested Next Min Bid:'}
                    </span>
                    <span className="font-mono text-white font-extrabold text-xs">
                      {formatPrice(auction.currentPrice + calculateProgressiveIncrement(auction.currentPrice), currency, lang)}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setBidAmount((auction.currentPrice + calculateProgressiveIncrement(auction.currentPrice)).toString())}
                      className="flex-1 cursor-pointer py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20 rounded bg-amber-500/5 hover:bg-amber-500/10 transition-all text-center"
                    >
                      ⚡ {lang === 'ar' ? 'تعبئة العرض المقترح' : 'Fill Suggested Bid'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowIncrementGuide(!showIncrementGuide)}
                      className="cursor-pointer px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 border border-white/5 rounded bg-white/5 hover:bg-white/10 hover:text-white transition-all text-center flex items-center gap-1"
                    >
                      <HelpCircle className="h-3 w-3 text-slate-400" />
                      <span>{lang === 'ar' ? 'جدول الفئات' : 'Brackets'}</span>
                    </button>
                  </div>

                  {/* Expandable Bracket Guide Table */}
                  <AnimatePresence>
                    {showIncrementGuide && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-white/5 pt-2 mt-1 space-y-1"
                      >
                        <p className="text-[9px] uppercase tracking-wider text-amber-500 font-extrabold mb-1">
                          📊 {lang === 'ar' ? 'جدول فئات المزايدة الرسمية للمنصة' : 'Official Platform Bidding Brackets'}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-400 font-mono">
                          <div className="bg-black/30 p-1.5 rounded flex justify-between border border-white/5">
                            <span>&lt; 100</span>
                            <span className="text-amber-500 font-bold">+10</span>
                          </div>
                          <div className="bg-black/30 p-1.5 rounded flex justify-between border border-white/5">
                            <span>100 - 499</span>
                            <span className="text-amber-500 font-bold">+25</span>
                          </div>
                          <div className="bg-black/30 p-1.5 rounded flex justify-between border border-white/5">
                            <span>500 - 999</span>
                            <span className="text-amber-500 font-bold">+50</span>
                          </div>
                          <div className="bg-black/30 p-1.5 rounded flex justify-between border border-white/5">
                            <span>1,000 - 4,999</span>
                            <span className="text-amber-500 font-bold">+100</span>
                          </div>
                          <div className="bg-black/30 p-1.5 rounded flex justify-between border border-white/5">
                            <span>5,000 - 9,999</span>
                            <span className="text-amber-500 font-bold">+250</span>
                          </div>
                          <div className="bg-black/30 p-1.5 rounded flex justify-between border border-white/5">
                            <span>10,000 - 49,999</span>
                            <span className="text-amber-500 font-bold">+500</span>
                          </div>
                          <div className="bg-black/30 p-1.5 rounded flex justify-between border border-white/5">
                            <span>50,000 - 99,999</span>
                            <span className="text-amber-500 font-bold">+1,000</span>
                          </div>
                          <div className="bg-black/30 p-1.5 rounded flex justify-between border border-white/5">
                            <span>&ge; 100,000</span>
                            <span className="text-amber-500 font-bold">+2,500</span>
                          </div>
                        </div>
                        <p className="text-[8px] text-slate-500 leading-tight mt-1">
                          {lang === 'ar'
                            ? '* الزيادات التقدمية تحمي المزادات من المزايدات الهامشية وتضمن عدالة وسلاسة نمو الأسعار للسلع الفاخرة.'
                            : '* Progressive increments protect auctions from trivial counter-bids and ensure premium assets scale at healthy levels.'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quick Bid Increment Buttons (+50, +100, +250, +500, +1000) */}
                <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-wider font-bold uppercase text-amber-400 flex items-center gap-1.5">
                      ⚡ {lang === 'ar' ? 'خيارات المزايدة السريعة:' : 'Quick Select Increments:'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {lang === 'ar' ? 'انقر لتحديد المبلغ فوراً' : 'Click to select amount'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[50, 100, 250, 500, 1000].map((inc) => {
                      const actualInc = Math.max(inc, minIncrementRule);
                      const targetAmount = auction.currentPrice + actualInc;
                      const isSelected = bidAmount === targetAmount.toString();

                      return (
                        <button
                          key={`quick-inc-${inc}`}
                          type="button"
                          onClick={() => handleQuickBidIncrement(targetAmount)}
                          className={`cursor-pointer group flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all active:scale-95 shadow ${
                            isSelected
                              ? 'bg-amber-500 border-amber-400 text-black font-extrabold ring-2 ring-amber-400/50'
                              : 'bg-[#161618] hover:bg-amber-500/15 border-white/10 hover:border-amber-500/50 text-amber-400'
                          }`}
                          title={lang === 'ar' ? `مزايدة سريعة بمبلغ ${formatPrice(targetAmount, currency, lang)}` : `Quick bid ${formatPrice(targetAmount, currency, lang)}`}
                        >
                          <span className={`text-xs font-mono font-black ${isSelected ? 'text-black' : 'text-amber-400 group-hover:text-amber-300'}`}>
                            +{actualInc}
                          </span>
                          <span className={`text-[9px] font-mono mt-0.5 truncate max-w-full ${isSelected ? 'text-black/80 font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {formatPrice(targetAmount, currency, lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block">
                      {lang === 'ar' ? 'ادخل مبلغ مزايدتك الفردي' : 'Enter custom Bid Amount'}
                    </label>
                    <span className="text-[9px] font-mono text-slate-400">
                      {lang === 'ar' ? 'أعلى سعر:' : 'Top Bid:'} <strong className="text-amber-400">{formatPrice(auction.currentPrice, currency, lang)}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs font-bold text-slate-500 font-mono">
                      {auction.currency}
                    </span>
                    <input
                      type="number"
                      required
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`${minRequiredBid}`}
                      className={`w-full font-mono font-bold border rounded pl-12 pr-28 py-2.5 text-sm outline-none transition-all ${
                        bidValidation.status === 'valid'
                          ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300 focus:border-emerald-500'
                          : bidValidation.status === 'below_current' || bidValidation.status === 'below_increment' || bidValidation.status === 'invalid_number'
                          ? 'border-rose-500/80 bg-rose-500/10 text-rose-300 focus:border-rose-500'
                          : 'border-white/10 bg-[#161618] text-white focus:border-amber-500/50'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={prefillBid}
                      className="absolute right-2 top-2 px-2.5 py-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded hover:opacity-95 cursor-pointer"
                    >
                      {lang === 'ar' ? 'الحد الأدنى' : 'Min Required'}
                    </button>
                  </div>

                  {/* Real-time Bid Validation Status Indicator */}
                  <div className={`mt-2 p-2.5 rounded border text-xs font-medium transition-all flex items-start gap-2 ${
                    bidValidation.status === 'valid'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : bidValidation.status === 'below_current' || bidValidation.status === 'below_increment' || bidValidation.status === 'invalid_number'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                      : 'bg-white/[0.03] border-white/10 text-slate-400'
                  }`} id="realtime-bid-validation-status">
                    {bidValidation.status === 'valid' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : bidValidation.status === 'below_current' || bidValidation.status === 'below_increment' || bidValidation.status === 'invalid_number' ? (
                      <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <Gavel className="h-4 w-4 text-amber-500/70 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-[11px] leading-snug">
                      <p className="font-bold">{bidValidation.message}</p>
                      <p className="text-[10px] opacity-75 mt-0.5 font-mono">
                        {lang === 'ar'
                          ? `القاعدة: أعلى سعر (${formatPrice(auction.currentPrice, currency, lang)}) + الزيادة (+${formatPrice(minIncrementRule, currency, lang)}) = ${formatPrice(minRequiredBid, currency, lang)}`
                          : `Rule: Highest Bid (${formatPrice(auction.currentPrice, currency, lang)}) + Min Increment (+${formatPrice(minIncrementRule, currency, lang)}) = ${formatPrice(minRequiredBid, currency, lang)}`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="submit"
                    disabled={loading || !bidValidation.isValid}
                    className={`flex-1 cursor-pointer flex items-center justify-center gap-1.5 py-2.5 text-xs font-extrabold uppercase tracking-wide rounded transition-all shadow-md ${
                      bidValidation.isValid
                        ? 'text-black bg-amber-500 hover:bg-amber-400 shadow-amber-500/20 active:scale-95'
                        : 'text-slate-500 bg-white/5 border border-white/10 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Gavel className="h-4 w-4" />
                    <span>{t.placeBid}</span>
                  </button>

                  {auction.buyoutPrice && (
                    <button
                      type="button"
                      onClick={handleBuyout}
                      className="cursor-pointer flex items-center justify-center p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-amber-500 rounded"
                      title={t.buyNow}
                    >
                      <DollarSign className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="mt-5 p-4 bg-white/5 rounded text-center border border-white/10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'ar' ? 'المزاد منتهي رسمياً ومغلق للدخول' : 'Auction has officially concluded'}
                </p>
                {auction.highBidder ? (
                  <p className="text-xs font-extrabold text-amber-400 mt-2 text-center">
                    🏆 {lang === 'ar' ? `الرابح بالصفقة:` : `Winning connection:`} {auction.highBidderName} ({formatPrice(auction.currentPrice, currency, lang)})
                  </p>
                ) : (
                  <p className="text-xs text-rose-500 mt-1">{lang === 'ar' ? 'انتهى المزاد من غير عروض شراء' : 'Finished with no bidding'}</p>
                )}
              </div>
            )}

            {/* Dedicated Live Bid History List & Telemetry Table */}
            <div className="mt-5 rounded-xl border border-white/10 bg-[#0d0d10] p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    {lang === 'ar' ? 'سجل المزايدات الحية والمباشرة' : 'Live Bid History Log'}
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {bids.length} {lang === 'ar' ? 'مزايدة' : 'bids'}
                </span>
              </div>

              {bids.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  {lang === 'ar' ? 'لا توجد مزايدات حتى الآن. كن أول المزايدين!' : 'No bids recorded yet. Be the first to bid!'}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {bids.map((b, idx) => {
                    const isHighBidder = idx === 0;
                    const isUserBid = user && b.bidderEmail === user.email;

                    return (
                      <div 
                        key={b.id ? `bid-${b.id}-${idx}` : `bid-${idx}`}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                          isHighBidder 
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' 
                            : isUserBid
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-white/5 border-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isHighBidder ? (
                            <span className="text-amber-400 font-bold text-sm" title={lang === 'ar' ? 'أعلى مزايدة حالياً' : 'Leading Bidder'}>👑</span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[10px]">#{bids.length - idx}</span>
                          )}
                          
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold truncate">
                                {isUserBid ? (lang === 'ar' ? 'أنت (المزايد المباشر)' : 'You (Current User)') : b.bidderName}
                              </span>
                              <BidderReputationBadge
                                bidderEmail={b.bidderEmail}
                                bidderName={b.bidderName}
                                isCurrentUser={isUserBid}
                                userTier={isUserBid ? user?.tier : undefined}
                                lang={lang}
                                size="sm"
                              />
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                              {new Date(b.timestamp).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                              {b.isAutomatic && ` • ${lang === 'ar' ? 'مزايدة تلقائية' : 'Auto Bid'}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-extrabold text-amber-400 text-sm block">
                            {formatPrice(b.amount, currency, lang)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ELECTRONIC GATEWAY CHECKOUT SIMULATOR */}
            {isWinner && !auction.trackingNumber && (
              <div className="mt-6 border-t border-white/5 pt-6">
                <div className="bg-amber-500/10 rounded p-3 border border-amber-500/20 mb-4">
                  <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest font-serif">
                    🏆 {lang === 'ar' ? 'مبارك الفوز بالمزاد!' : 'Congratulations on winning!'}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 font-light">
                    {lang === 'ar' ? 'يرجى استكمال الدفع الإلكتروني لنقل الملكية بالضمان وشحن السلعة.' : 'Complete your direct transaction payload to lock logistics:'}
                  </p>
                </div>

                {!showCheckout ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full cursor-pointer flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider text-black bg-amber-500 hover:bg-amber-400 rounded shadow-md transition-all"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{t.paySecured}</span>
                  </button>
                ) : (
                  <form onSubmit={handleCheckoutSettle} className="space-y-4 rounded-lg bg-black/40 p-4 border border-white/5">
                    {/* Payment Method Selector Grid */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'ar' ? 'اختر وسيلة الدفع المفضلة' : 'Select Payment Method'}
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`flex flex-col items-center justify-center py-2.5 rounded border transition-all cursor-pointer ${
                            paymentMethod === 'card'
                              ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                              : 'border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <CreditCard className="h-4 w-4 mb-1" />
                          <span className="text-[9px] font-bold">{lang === 'ar' ? 'بطاقة' : 'Card'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('paypal')}
                          className={`flex flex-col items-center justify-center py-2.5 rounded border transition-all cursor-pointer ${
                            paymentMethod === 'paypal'
                              ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                              : 'border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Wallet className="h-4 w-4 mb-1" />
                          <span className="text-[9px] font-bold">PayPal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('applepay')}
                          className={`flex flex-col items-center justify-center py-2.5 rounded border transition-all cursor-pointer ${
                            paymentMethod === 'applepay'
                              ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                              : 'border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <span className="font-sans font-bold text-sm leading-none h-4 mb-1 flex items-center"></span>
                          <span className="text-[9px] font-bold">Apple Pay</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('stcpay')}
                          className={`flex flex-col items-center justify-center py-2.5 rounded border transition-all cursor-pointer ${
                            paymentMethod === 'stcpay'
                              ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                              : 'border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Smartphone className="h-4 w-4 mb-1" />
                          <span className="text-[9px] font-bold">STC Pay</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('crypto')}
                          className={`flex flex-col items-center justify-center py-2.5 rounded border transition-all cursor-pointer ${
                            paymentMethod === 'crypto'
                              ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                              : 'border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Coins className="h-4 w-4 mb-1" />
                          <span className="text-[9px] font-bold">{lang === 'ar' ? 'تشفير' : 'Crypto'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Inputs Based on Method */}
                    <div className="pt-2 border-t border-white/5 space-y-3">
                      {paymentMethod === 'card' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-amber-500 font-serif flex items-center gap-1">
                              <CreditCard className="h-3.5 w-3.5" />
                              {lang === 'ar' ? 'الدفع ببطاقة فيزا / ماستر كارد أو مادا كارد' : 'Secure Card Gateway'}
                            </h4>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-1 border border-emerald-500/10 rounded">mada / visa</span>
                          </div>
                          <div>
                            <input
                              type="text"
                              required
                              value={payCardNumber}
                              onChange={(e) => setPayCardNumber(e.target.value)}
                              placeholder={lang === 'ar' ? 'رقم بطاقة الائتمان / بطاقة مادا' : 'Card number'}
                              className="w-full bg-[#161618] text-xs font-mono font-bold border border-white/10 rounded p-2 text-white outline-none focus:border-amber-500/50"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              value={payExpiry}
                              onChange={(e) => setPayExpiry(e.target.value)}
                              placeholder="MM/YY"
                              className="bg-[#161618] text-xs text-center font-mono font-bold border border-white/10 rounded p-2 text-white outline-none focus:border-amber-500/50"
                            />
                            <input
                              type="password"
                              required
                              value={payCVV}
                              onChange={(e) => setPayCVV(e.target.value)}
                              placeholder="CVV"
                              className="bg-[#161618] text-xs text-center font-mono font-bold border border-white/10 rounded p-2 text-white outline-none focus:border-amber-500/50"
                            />
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'paypal' && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-[#0070ba] font-serif flex items-center gap-1">
                            <Wallet className="h-3.5 w-3.5" />
                            {lang === 'ar' ? 'الربط بمحفظة PayPal الإلكترونية' : 'PayPal Wallet Connection'}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {lang === 'ar'
                              ? 'يرجى إدخال البريد الإلكتروني الخاص بـ PayPal لتسجيل المعاملة.'
                              : 'Please enter your PayPal account address to link the transaction.'}
                          </p>
                          <input
                            type="email"
                            required
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            placeholder="paypal.customer@domain.com"
                            className="w-full bg-[#161618] text-xs font-mono font-bold border border-white/10 rounded p-2 text-white outline-none focus:border-[#0070ba]/50"
                          />
                        </div>
                      )}

                      {paymentMethod === 'applepay' && (
                        <div className="space-y-2 text-center py-2 bg-[#161618]/50 border border-white/5 rounded">
                          <p className="font-sans font-extrabold text-[#fff] text-base leading-none flex items-center justify-center gap-1.5 mb-2">
                            <span> Pay</span>
                          </p>
                          <p className="text-[10px] text-slate-400 px-4">
                            {lang === 'ar'
                              ? 'جاهز للاستخدام. بنقرة واحدة سيقوم نظام هاتف Apple أو متصفح Safari الخاص بك بالمصادقة آمنياً عبر Face ID أو Touch ID وسحب المبلغ بالضمان.'
                              : 'Ready for one-click biometrics. Safari and Apple hardware will register authorization escrow directly upon submission.'}
                          </p>
                          <span className="inline-block mt-2 text-[9px] text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/20 px-1.5 py-0.5 rounded font-mono">
                            READY_BIO_MATCH_SECURE
                          </span>
                        </div>
                      )}

                      {paymentMethod === 'stcpay' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-[#e10a0a] font-serif flex items-center gap-1">
                              <Smartphone className="h-3.5 w-3.5" />
                              {lang === 'ar' ? 'الدفع السريع بمحفظة stc pay المحلية' : 'stc pay (KSA Local Wallet)'}
                            </h4>
                            <span className="text-[9px] text-[#fff] bg-[#e10a0a] px-1 rounded uppercase font-bold tracking-widest">stc pay</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={stcPhone}
                              onChange={(e) => setStcPhone(e.target.value)}
                              placeholder="+966 50 123 4567"
                              className="flex-1 bg-[#161618] text-xs font-mono font-bold border border-white/10 rounded p-2 text-white outline-none focus:border-[#e10a0a]/50"
                            />
                            {!stcOtpSent ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setStcOtpSent(true);
                                  alert(lang === 'ar' ? 'تم إرسال رمز التحقق للاتصال الفوري بـ stc pay: "4721" لمحاكاة بروتوكول OTP.' : 'stc pay OTP Verification sent: enter "4721" for checkout simulator.');
                                }}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 rounded text-xs text-amber-500 cursor-pointer font-bold shrink-0"
                              >
                                {lang === 'ar' ? 'إرسال OTP' : 'Send OTP'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setStcOtpSent(false)}
                                className="text-[10px] text-slate-500 cursor-pointer underline flex items-center justify-center"
                              >
                                {lang === 'ar' ? 'إعادة الإرسال' : 'Resend'}
                              </button>
                            )}
                          </div>

                          {stcOtpSent && (
                            <div className="space-y-1 animate-fade-in">
                              <label className="text-[9px] font-bold text-slate-500 block">
                                {lang === 'ar' ? 'أدخل رمز التحقق (OTP) المرسل لهاتفك:' : 'Enter OTP Verification Code:'}
                              </label>
                              <input
                                type="text"
                                required
                                value={stcOtp}
                                onChange={(e) => setStcOtp(e.target.value)}
                                placeholder="رمز التحقق (مثال: 4721)"
                                className="w-full bg-[#161618] text-xs text-center font-mono font-bold border border-white/10 rounded p-2 text-amber-500 outline-none focus:border-[#e10a0a]"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {paymentMethod === 'crypto' && (
                        <div className="space-y-3 bg-[#111] p-3 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-amber-500 font-serif flex items-center gap-1">
                              <Coins className="h-3.5 w-3.5" />
                              {lang === 'ar' ? 'بوابة عقود الضمان المشفرة (Crypto Escrow)' : 'Crypto Secured Escrow'}
                            </h4>
                            <span className="text-[9px] text-[#00ff88] font-bold bg-[#00ff88]/10 px-1 border border-[#00ff88]/10 rounded">Polygon & Bitcoin</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                {lang === 'ar' ? 'الرمز المشفر' : 'Asset Token'}
                              </label>
                              <select
                                value={cryptoToken}
                                onChange={(e) => setCryptoToken(e.target.value as any)}
                                className="w-full bg-[#161618] text-xs font-bold border border-white/10 rounded p-2 text-white outline-none focus:border-amber-500"
                              >
                                <option value="USDT">USDT (Tether USD)</option>
                                <option value="USDC">USDC (USD Coin)</option>
                                <option value="BTC">BTC (Bitcoin)</option>
                                <option value="ETH">ETH (Ethereum)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                {lang === 'ar' ? 'مبلغ التحويل التقريبي' : 'Equivalent Cost'}
                              </label>
                              <div className="bg-[#161618] text-xs font-mono font-bold border border-white/10 rounded p-2 text-white flex items-center justify-center">
                                {cryptoToken === 'USDT' || cryptoToken === 'USDC' 
                                  ? `${(auction.currentPrice / 3.75).toFixed(2)} ${cryptoToken}`
                                  : cryptoToken === 'BTC'
                                    ? `${(auction.currentPrice / 250000).toFixed(5)} BTC`
                                    : `${(auction.currentPrice / 12000).toFixed(4)} ETH`
                                }
                              </div>
                            </div>
                          </div>

                          {/* Escrow Address copy */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 block">
                              {lang === 'ar' ? 'عنوان محفظة الضمان الذكي للمنصة (Escrow Wallet):' : 'Secure Platform Escrow Address:'}
                            </label>
                            <div className="flex items-center gap-1 border border-white/10 bg-[#161618] rounded p-1.5 text-xs">
                              <span className="flex-1 font-mono text-[9px] text-slate-300 select-all truncate">
                                {cryptoToken === 'BTC' ? 'bc1q98fgyhu71c7656ec7ab88b098defb751b7401' : '0xOLDGOLDAucTiOnS88b098defB751B7401B5f6d897'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const textToCopy = cryptoToken === 'BTC' ? 'bc1q98fgyhu71c7656ec7ab88b098defb751b7401' : '0xOLDGOLDAucTiOnS88b098defB751B7401B5f6d897';
                                  navigator.clipboard.writeText(textToCopy);
                                  setCopiedAddress(true);
                                  setTimeout(() => setCopiedAddress(false), 2000);
                                }}
                                className="p-1 cursor-pointer bg-white/5 hover:bg-white/10 text-amber-500 rounded transition-all shrink-0"
                                title="Copy Address"
                              >
                                {copiedAddress ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-bold text-slate-500 block">
                                {lang === 'ar' ? 'معرف المعاملة (TXID) لإثبات الدفع:' : 'Paste Transaction Hash (TxID):'}
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setCryptoTxHash(`0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`);
                                  setWalletConnected(true);
                                }}
                                className="text-[9px] font-bold text-amber-500 animate-pulse hover:text-amber-400"
                              >
                                {lang === 'ar' ? '⚡ توليد TXID وهمي للمطابقة' : '⚡ Simulate Wallet Transfer proof'}
                              </button>
                            </div>
                            <input
                              type="text"
                              required
                              value={cryptoTxHash}
                              onChange={(e) => setCryptoTxHash(e.target.value)}
                              placeholder="0x..."
                              className="w-full bg-[#161618] text-[10px] font-mono font-bold border border-white/10 rounded p-2 text-white outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Section */}
                    <div className="pt-2 border-t border-white/5">
                      <button
                        type="submit"
                        disabled={checkoutLoading || (paymentMethod === 'stcpay' && !stcOtp)}
                        className={`w-full cursor-pointer py-2.5 text-xs font-bold uppercase tracking-wider text-black rounded transition-all flex items-center justify-center gap-1.5 ${
                          paymentMethod === 'stcpay' && !stcOtp
                            ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-white/5'
                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                        }`}
                      >
                        {checkoutLoading ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Lock className="h-3.5 w-3.5" />
                            <span>
                              {lang === 'ar'
                                ? `تأكيد الدفع بالضمان (Escrow) - ${formatPrice(auction.currentPrice, currency, lang)}`
                                : `Confirm Secure Escrow - ${formatPrice(auction.currentPrice, currency, lang)}`}
                            </span>
                          </>
                        )}
                      </button>
                      <p className="text-[9px] text-center text-slate-500 mt-2">
                        🔒 {lang === 'ar'
                          ? 'بوابة الضمان (Escrow) مشفرة ومؤمنة بالكامل لحماية أموال المشتري حتى تأكيد الاستلام.'
                          : 'Secure smart escrow vault. Funds are locked with the platform until you explicitly release them upon delivery validation.'}
                      </p>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Live Bid History Feed */}
            <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-500 font-serif flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  {lang === 'ar' ? 'سجل المزايدة المباشر' : 'Live Bid Feed'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  {bids.length} {t.bids}
                </span>
              </div>

              {bids.length === 0 ? (
                <p className="text-center py-4 text-xs italic text-slate-500">
                  {lang === 'ar' ? 'لا توجد عروض مزايدة بعد. كن أول المزايدين!' : 'No bidding offers yet. Bid first!'}
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {bids.map((b, bIdx) => (
                    <div 
                      key={b.id ? `mbid-${b.id}-${bIdx}` : `mbid-${bIdx}`}
                      className={`flex items-center justify-between p-2 rounded transition-all duration-300 border ${
                        bIdx === 0 
                          ? 'bg-amber-500/10 border-amber-500/20 shadow-md shadow-amber-500/5' 
                          : 'bg-[#161618] border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {bIdx === 0 && (
                          <span className="text-[10px] font-black text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded uppercase">
                            {lang === 'ar' ? 'المتصدر' : 'Lead'}
                          </span>
                        )}
                        <span className="text-xs font-bold font-serif text-white truncate max-w-[110px]">
                          {b.bidderName || b.bidderEmail.split('@')[0]}
                        </span>
                        <BidderReputationBadge
                          bidderEmail={b.bidderEmail}
                          bidderName={b.bidderName}
                          isCurrentUser={!!(user && b.bidderEmail === user.email)}
                          userTier={user && b.bidderEmail === user.email ? user?.tier : undefined}
                          lang={lang}
                          size="sm"
                          compact={true}
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-amber-400 block leading-none">
                          {formatPrice(b.amount, currency, lang)}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                          {new Date(b.timestamp).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Secure Held Transactions Escrow info */}
          {escrow && (
            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 font-serif">
                  ⛓️ {lang === 'ar' ? 'حالة حماية الضمان (Escrow):' : 'Escrow State:'}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded ${
                  escrow.status === 'held' ? 'bg-amber-500 text-black shadow-lg' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {escrow.status === 'held' ? t.escrowHeld : t.escrowReleased}
                </span>
              </div>
              <p className="text-[11px] font-mono font-bold text-slate-500 leading-relaxed text-center">
                Ref: {escrow.id} &bull; Security Block Active
              </p>

              {(escrow.paymentMethod || escrow.paymentDetails) && (
                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1 text-[11px]">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>{lang === 'ar' ? 'وسيلة الدفع المعالجة:' : 'Processed Method:'}</span>
                    <span className="font-extrabold text-amber-400 bg-amber-500/10 px-1 border border-amber-500/5 rounded">
                      {escrow.paymentMethod}
                    </span>
                  </div>
                  {escrow.paymentDetails && (
                    <div className="flex flex-col text-slate-400 text-left">
                      <span>{lang === 'ar' ? 'تفاصيل السداد والمعرف:' : 'Payment Identifier / Hash:'}</span>
                      <span className="font-mono text-[9px] text-[#00ff88] bg-[#00ff88]/5 p-1 border border-[#00ff88]/10 rounded mt-1 select-all break-all overflow-hidden max-w-full">
                        {escrow.paymentDetails}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Mobile-Optimized Floating Quick-Action Bar for Fast-Paced Bidding */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0f]/95 backdrop-blur-xl border-t border-amber-500/30 p-2.5 pb-4 shadow-[0_-10px_25px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between gap-2">
          {/* Price & Min Next Info */}
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-mono uppercase text-slate-400 font-semibold tracking-wider truncate">
              {lang === 'ar' ? 'أعلى سعر حالي' : 'Current Price'}
            </span>
            <span className="text-base font-black font-mono text-amber-400 drop-shadow truncate">
              {formatPrice(auction.currentPrice, currency, lang)}
            </span>
            <span className="text-[9px] text-slate-400 font-mono truncate">
              {lang === 'ar' ? 'الحد الأدنى:' : 'Min:'} <strong className="text-emerald-400">{formatPrice(minRequiredBid, currency, lang)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Fill Minimum Bid Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                  try { navigator.vibrate(10); } catch(_) {}
                }
                setBidAmount(minRequiredBid.toString());
              }}
              className="px-2.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95 text-[10px] font-bold font-mono transition-all cursor-pointer"
              title={lang === 'ar' ? 'ضبط الحد الأدنى المطلوب' : 'Set minimum required bid'}
            >
              +{formatPrice(minIncrementRule, currency, lang)}
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                  try { navigator.vibrate(15); } catch(_) {}
                }
                handleShareAction();
              }}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
              title={lang === 'ar' ? 'مشاركة المزاد' : 'Share Auction'}
            >
              <Share2 className="h-4 w-4" />
            </button>

            {/* Sticky Primary Place Bid Action Button */}
            <button
              type="button"
              onClick={(e) => {
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                  try { navigator.vibrate([20, 30, 20]); } catch(_) {}
                }
                if (!bidValidation.isValid) {
                  // If amount not valid yet, prefill with min required bid first
                  setBidAmount(minRequiredBid.toString());
                  // Scroll into view gently so user sees validation status
                  const elem = document.getElementById('realtime-bid-validation-status');
                  if (elem) {
                    elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                } else {
                  handlePlaceBid(e);
                }
              }}
              className="h-10 px-3.5 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs tracking-wide uppercase shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
              id="mobile-sticky-place-bid-btn"
            >
              <Gavel className="h-4 w-4 shrink-0" />
              <span>{lang === 'ar' ? 'تأكيد المزايدة' : 'Place Bid'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Fullscreen Viewer Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Panel bar */}
          <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between text-white z-10">
            <span className="font-serif italic font-semibold text-sm sm:text-base text-amber-500/90 tracking-wide select-none">
              {lang === 'ar' ? auction.titleAr : auction.titleEn}
            </span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-slate-400 select-none">
                {currentImageIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-rose-500 hover:text-white transition-all duration-200 cursor-pointer"
                title={lang === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Core high-resolution Display Frame */}
          <div className="w-full max-w-5xl flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
            {/* Prev Image Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all duration-200 cursor-pointer shrink-0"
                title={lang === 'ar' ? 'السابق' : 'Previous'}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Selected High-Res Image */}
            <div className="relative max-h-[75vh] max-w-full overflow-hidden rounded border border-white/5 bg-[#0a0a0b] flex items-center justify-center">
              <img
                src={images[currentImageIndex]}
                alt={lang === 'ar' ? auction.titleAr : auction.titleEn}
                className="max-h-[75vh] w-auto object-contain object-center scale-95 hover:scale-100 transition-transform duration-300"
              />
            </div>

            {/* Next Image Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all duration-200 cursor-pointer shrink-0"
                title={lang === 'ar' ? 'التالي' : 'Next'}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Horizontal Grid of Thumbnails inside the Lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-6 flex flex-wrap items-center justify-center gap-2 px-4 select-none z-10" onClick={(e) => e.stopPropagation()}>
              {images.map((img, idx) => (
                <button
                  key={`lb-thumb-${auction.id}-${idx}`}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative aspect-[16/10] w-12 sm:w-16 overflow-hidden rounded bg-black transition-all cursor-pointer ${
                    idx === currentImageIndex
                      ? 'ring-2 ring-amber-500 border-none scale-105 opacity-100'
                      : 'border border-white/10 opacity-40 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bid Confirmation Modal */}
      <BidConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={submitConfirmedBid}
        bidAmount={confirmValue}
        currentPrice={auction.currentPrice}
        auctionTitle={lang === 'ar' ? auction.titleAr : auction.titleEn}
        auctionImage={auction.image}
        currency={currency}
        lang={lang}
        loading={loading}
      />

      {/* Share Auction Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0f] p-6 shadow-2xl shadow-black"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto text-amber-500">
                <Share2 className="h-6 w-6" />
              </div>

              {/* Title */}
              <h3 className="mt-4 text-center text-lg font-serif font-bold text-white tracking-wide">
                {lang === 'ar' ? 'مشاركة المزاد الفاخر' : 'Share Luxury Auction'}
              </h3>
              <p className="mt-1 text-center text-xs text-slate-400">
                {lang === 'ar' ? 'ادعُ المهتمين وهواة الاقتناء للمشاركة في المزايدة' : 'Invite collectors and enthusiasts to join the bidding'}
              </p>

              {/* Tab Switcher: Share Link vs QR Code */}
              <div className="mt-4 flex rounded-lg bg-black/60 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setShareTab('link')}
                  className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                    shareTab === 'link'
                      ? 'bg-amber-500 text-black shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'رابط ومشاركة' : 'Link & Social'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShareTab('qr')}
                  className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                    shareTab === 'qr'
                      ? 'bg-amber-500 text-black shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'رمز QR للمسح' : 'QR Code Scanner'}</span>
                </button>
              </div>

              {/* TAB 1: LINK & SOCIAL SHARE */}
              {shareTab === 'link' && (
                <div className="animate-fade-in">
                  {/* Preview Card */}
                  <div className="mt-5 flex items-center gap-3 rounded-lg bg-[#131315] p-3 border border-white/5">
                    <img
                      src={images[0]}
                      alt={lang === 'ar' ? auction.titleAr : auction.titleEn}
                      className="h-14 w-14 rounded object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-serif font-bold text-white truncate">
                        {lang === 'ar' ? auction.titleAr : auction.titleEn}
                      </h4>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {lang === 'ar' ? 'السعر الحالي:' : 'Current Bid:'}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-500">
                          {formatPrice(auction.currentPrice, currency, lang)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Unique Sharable Link Input Box */}
                  <div className="mt-5 space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {lang === 'ar' ? 'رابط المزاد المباشر المخصص' : 'Unique Sharable Link'}
                    </label>
                    <div className="flex items-center gap-2 rounded-lg bg-black/60 border border-white/10 p-1.5 focus-within:border-amber-500/50 transition-colors">
                      <input
                        type="text"
                        readOnly
                        value={getShareUrl()}
                        className="w-full bg-transparent px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="cursor-pointer shrink-0 flex items-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-black uppercase tracking-wider transition-all shadow"
                      >
                        {copiedShareLink ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? 'نسخ الرابط' : 'Copy Link'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Social Share Buttons */}
                  <div className="mt-5">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      {lang === 'ar' ? 'مشاركة سريعة عبر المنصات' : 'Quick Share Platforms'}
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = getShareUrl();
                          const text = lang === 'ar' ? `شاهد هذا المزاد الفاخر: ${auction.titleAr}` : `Check out this luxury auction: ${auction.titleEn}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
                        }}
                        className="cursor-pointer flex flex-col items-center justify-center gap-1 rounded-lg bg-[#18181b] hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/5 p-2 transition-all group"
                      >
                        <MessageSquare className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-300">WhatsApp</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = getShareUrl();
                          const text = lang === 'ar' ? `شاهد هذا المزاد الفاخر: ${auction.titleAr}` : `Check out this luxury auction: ${auction.titleEn}`;
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
                        }}
                        className="cursor-pointer flex flex-col items-center justify-center gap-1 rounded-lg bg-[#18181b] hover:bg-sky-500/10 hover:border-sky-500/30 border border-white/5 p-2 transition-all group"
                      >
                        <Send className="h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-300">X (Twitter)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = getShareUrl();
                          const text = lang === 'ar' ? `شاهد هذا المزاد الفاخر: ${auction.titleAr}` : `Check out this luxury auction: ${auction.titleEn}`;
                          window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="cursor-pointer flex flex-col items-center justify-center gap-1 rounded-lg bg-[#18181b] hover:bg-blue-500/10 hover:border-blue-500/30 border border-white/5 p-2 transition-all group"
                      >
                        <Link className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-300">Telegram</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = getShareUrl();
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                        }}
                        className="cursor-pointer flex flex-col items-center justify-center gap-1 rounded-lg bg-[#18181b] hover:bg-blue-600/10 hover:border-blue-600/30 border border-white/5 p-2 transition-all group"
                      >
                        <Facebook className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-300">Facebook</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = getShareUrl();
                          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
                        }}
                        className="cursor-pointer flex flex-col items-center justify-center gap-1 rounded-lg bg-[#18181b] hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-white/5 p-2 transition-all group"
                      >
                        <Linkedin className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-300">LinkedIn</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = getShareUrl();
                          const title = lang === 'ar' ? auction.titleAr : auction.titleEn;
                          const text = lang === 'ar' ? `شاهد هذا المزاد الفاخر على أنتيكاوي: ${auction.titleAr}\n\nالرابط:` : `Check out this luxury auction on أنتيكاوي: ${auction.titleEn}\n\nLink:`;
                          window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + ' ' + shareUrl)}`;
                        }}
                        className="cursor-pointer flex flex-col items-center justify-center gap-1 rounded-lg bg-[#18181b] hover:bg-amber-500/10 hover:border-amber-500/30 border border-white/5 p-2 transition-all group"
                      >
                        <Mail className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-300">Email</span>
                      </button>
                    </div>
                  </div>

                  {/* Trigger Native Share Button (Web Share API) */}
                  <button
                    type="button"
                    onClick={async () => {
                      const shareUrl = getShareUrl();
                      const title = lang === 'ar' ? auction.titleAr : auction.titleEn;
                      const text = lang === 'ar' ? `شاهد هذا المزاد الفاخر: ${auction.titleAr}` : `Check out this luxury auction: ${auction.titleEn}`;
                      if (typeof navigator !== 'undefined' && navigator.share && typeof navigator.share === 'function') {
                        try {
                          await navigator.share({ title, text, url: shareUrl });
                          return;
                        } catch (e: any) {
                          if (e.name !== 'AbortError') console.error(e);
                        }
                      }
                      handleCopyLink();
                    }}
                    className="mt-4 w-full cursor-pointer flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 bg-gradient-to-r from-amber-500/20 via-white/5 to-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg transition-all shadow-md"
                  >
                    <Share2 className="h-4 w-4 text-amber-400 animate-pulse" />
                    <span>{lang === 'ar' ? 'استخدام قائمة المشاركة في جهازك (Web Share API)' : 'Use Native Device Share Sheet (Web Share API)'}</span>
                  </button>
                </div>
              )}

              {/* TAB 2: QR CODE SCANNER */}
              {shareTab === 'qr' && (
                <div className="mt-5 space-y-5 animate-fade-in text-center">
                  <div className="mx-auto inline-block p-4 bg-white rounded-2xl shadow-xl border-4 border-amber-500/20 transition-transform hover:scale-105">
                    <QRCode
                      value={getShareUrl() || 'https://old-is-gold.com'}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="Q"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-white font-serif tracking-wide">
                      {lang === 'ar' ? 'امسح الرمز عبر كاميرا هاتفك المحمول' : 'Scan via Mobile Camera'}
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      {lang === 'ar'
                        ? 'وجه كاميرا هاتفك الذكي أو تطبيق مسح الرموز نحو هذا الرمز لفتح صفحة المزاد مباشرة والمزايدة فوراً من أي جهاز.'
                        : 'Point your smartphone camera or QR scanner at this code to open the auction instantly on your mobile device.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareModal(false);
                        setShowScannerModal(true);
                      }}
                      className="cursor-pointer w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <Scan className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'تشغيل الكاميرا لمسح بطاقة أو ملصق مزاد' : 'Launch Camera Scanner'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all w-full active:scale-95 shadow"
                    >
                      {copiedShareLink ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400">{lang === 'ar' ? 'تم نسخ رابط المزاد!' : 'Auction Link Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-amber-500" />
                          <span>{lang === 'ar' ? 'نسخ الرابط المباشر للمزاد' : 'Copy Direct Auction Link'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ─── Auto-Bid Section ─────────────────────────── */}
        {!isAuctionClosed && user && (
          <div className="mt-8">
            <AutoBid
              auctionId={auction.id}
              currentPrice={auction.currentPrice}
              lang={lang}
              user={user}
              highBidder={auction.highBidder}
              onAutoBid={(amount) => {
                // trigger bid placement at the auto-bid amount
                console.log('Auto-bid triggered at:', amount);
              }}
            />
          </div>
        )}

        {/* ─── Comments & Questions Section ──────────────── */}
        <div className="mt-8">
          <AuctionComments
            auctionId={auction.id}
            lang={lang}
            user={user}
          />
        </div>

        {/* Seller Public Profile Modal */}
        {showSellerProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-2xl bg-[#121214] border border-amber-500/30 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setShowSellerProfileModal(false)}
                className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Seller Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start border-b border-white/10 pb-5">
                {auction.seller.logo ? (
                  <img
                    src={auction.seller.logo}
                    alt={auction.seller.name}
                    className="h-20 w-20 rounded-full object-cover border-2 border-amber-500 shadow-xl shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-serif font-black text-2xl shadow-xl shrink-0">
                    {auction.seller.name.substring(0, 2)}
                  </div>
                )}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      {lang === 'ar' ? 'بائع معتمد وفاحص موثوق' : 'Verified Consignor'}
                    </span>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {lang === 'ar' ? 'ضمان الأصالة 100%' : '100% Authentic Guarantee'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-serif">{auction.seller.name}</h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar'
                      ? `عضو فعال منذ عام ${auction.seller.memberSince || '2021'} • موثق لدى هيئة الرقابة والمزادات`
                      : `Active Member Since ${auction.seller.memberSince || '2021'} • Certified Auction Body`}
                  </p>
                </div>
              </div>

              {/* Store Stats Banner */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-amber-400 text-lg font-bold">
                    <span>★ {auction.seller.rating || 5.0}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">{lang === 'ar' ? 'التقييم العام (ممتاز)' : 'Overall Rating'}</p>
                </div>
                <div className="space-y-1 border-x border-white/10 px-2">
                  <div className="text-white text-lg font-bold">
                    {auction.seller.totalSold ?? Math.max(14, (auction.seller.name.length * 7) % 120 + 18)}
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">{lang === 'ar' ? 'مزاد مكتمل بنجاح' : 'Auctions Sold'}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-emerald-400 text-lg font-bold">100%</div>
                  <p className="text-[10px] text-slate-400 font-sans">{lang === 'ar' ? 'نسبة رضا العملاء' : 'Satisfaction Rate'}</p>
                </div>
              </div>

              {/* Bio / About section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  {lang === 'ar' ? 'نبذة عن صاحب المزاد والمتجر' : 'About the Seller & Storefront'}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed font-light bg-black/40 p-3.5 rounded-xl border border-white/5">
                  {lang === 'ar'
                    ? (auction.seller.description || 'جهة موثقة رسمياً ومعتمدة لعرض المزادات الفاخرة والسلع النادرة بضمان الفحص والاختبار الشامل. نلتزم بأعلى معايير الشفافية والتوثيق الفني لكافة المقتنيات المعروضة في منصتنا، مع توفير خيارات معاينة مباشرة قبل المزايدة وشحن آمن لجميع مناطق المملكة والخليج.')
                    : (auction.seller.descriptionEn || 'Officially certified and verified consignor specializing in luxury auctions and rare assets with complete appraisal guarantee. We adhere to the highest international standards of technical verification and transparency, offering direct private viewing options and insured regional delivery.')}
                </p>
              </div>

              {/* Store URL Box */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  {lang === 'ar' ? 'رابط المتجر والملف العام' : 'Public Store Profile URL'}
                </h4>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-slate-300 font-mono">
                  <Link className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="truncate flex-1">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://old-is-gold.com'}
                    {auction.seller.storeUrl || `/store/${encodeURIComponent(auction.seller.name)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://old-is-gold.com'}${auction.seller.storeUrl || `/store/${encodeURIComponent(auction.seller.name)}`}`;
                      navigator.clipboard?.writeText(url);
                      setCopiedStoreUrl(true);
                      setTimeout(() => setCopiedStoreUrl(false), 3000);
                    }}
                    className="cursor-pointer px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold font-sans transition-colors shrink-0 flex items-center gap-1"
                  >
                    {copiedStoreUrl ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'نسخ الرابط' : 'Copy URL'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sample Reviews */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  {lang === 'ar' ? 'آراء وتقييمات المزايدين والمشترين' : 'Verified Buyer Reviews'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>عبد الله السالم</span>
                      <span className="text-amber-400">★★★★★</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'ar' ? '"مصداقية عالية وتوثيق دقيق لكل تفاصيل السلعة. استلمت الساعة بحالة ممتازة كما هو موصوف بالضبط."' : '"High credibility and precise documentation. Received the watch in immaculate condition."'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>سارة الشمري</span>
                      <span className="text-amber-400">★★★★★</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'ar' ? '"خدمة راقية وسرعة في إجراءات نقل الملكية والإفراج المالي عبر نظام الضمان. أوصي بشدة بالتعامل معهم."' : '"Professional service and smooth ownership transfer through the escrow system. Highly recommended."'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSellerProfileModal(false)}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                >
                  {lang === 'ar' ? 'إغلاق النافذة' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Quick Bid Floating Bar */}
      <div className="fixed bottom-14 left-0 right-0 z-40 md:hidden bg-[#0c0c10]/95 backdrop-blur-lg border-t border-amber-500/30 p-3 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'السعر الحالي:' : 'Current Bid:'}</div>
          <div className="text-base font-black text-amber-400 font-mono leading-none">
            {formatPrice(auction.currentPrice, currency, lang)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProvenanceModal(true)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10"
            title={lang === 'ar' ? 'شهادة التوثيق' : 'Provenance Seal'}
          >
            <Award className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => {
              const nextBid = auction.currentPrice + auction.minIncrement;
              setBidAmount(nextBid.toString());
              setConfirmValue(nextBid);
              setShowConfirmModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Gavel className="h-4 w-4" />
            <span>{lang === 'ar' ? 'زايد الآن' : 'Quick Bid'} (+{formatPrice(auction.minIncrement, currency, lang)})</span>
          </button>
        </div>
      </div>

      {/* Render Provenance Inspector Modal */}
      {showProvenanceModal && (
        <ProvenanceInspectorModal
          auction={auction}
          lang={lang}
          onClose={() => setShowProvenanceModal(false)}
        />
      )}

      {/* Render Official Certificate of Ownership Modal */}
      {showCertModal && (
        <OwnershipCertificateModal
          auction={auction}
          user={user}
          lang={lang}
          currency={currency}
          onClose={() => setShowCertModal(false)}
        />
      )}

      {/* Render 3D & AR Artifact Viewer Showcase Modal */}
      {show3DModal && (
        <Artifact3DViewerModal
          auction={auction}
          lang={lang}
          onClose={() => setShow3DModal(false)}
        />
      )}

      {/* Render AI Forensic Condition & Restoration Scanner Modal */}
      {showConditionScannerModal && (
        <ArtifactConditionScannerModal
          auction={auction}
          lang={lang}
          onClose={() => setShowConditionScannerModal(false)}
        />
      )}

      {/* Render Social WhatsApp & Telegram Exporter Modal */}
      {showSocialExporterModal && (
        <SocialExporterModal
          auction={auction}
          lang={lang}
          currency={currency}
          onClose={() => setShowSocialExporterModal(false)}
        />
      )}

      {/* Render Interactive QR Code & Tag Scanner Modal */}
      <QrCodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        lang={lang}
        currency={currency}
        allAuctions={allAuctions}
        onSelectAuction={onSelectAuction}
      />

      {/* PRICE THRESHOLD ALERT MODAL */}
      <AnimatePresence>
        {showPriceAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#121216] p-6 shadow-2xl text-white space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <BellRing className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {lang === 'ar' ? 'تحديد تنبيه السعر للمزاد' : 'Set Price Threshold Alert'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ar' ? 'احصل على إشعار فور وصول سعر المزاد للحد المفضل' : 'Get notified as soon as the auction price hits your target'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPriceAlertModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Current price reference */}
              <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">{lang === 'ar' ? 'السعر الحالي للمزاد:' : 'Current Auction Price:'}</span>
                <span className="font-mono font-black text-amber-400 text-sm">{formatPrice(auction.currentPrice, currency, lang)}</span>
              </div>

              {/* Preset options */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'ar' ? 'خيارات مستهدفة سريعة:' : 'Quick Target Presets:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '+10%', val: Math.round(auction.currentPrice * 1.1) },
                    { label: '+25%', val: Math.round(auction.currentPrice * 1.25) },
                    { label: '+50%', val: Math.round(auction.currentPrice * 1.5) },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPriceAlertInput(preset.val.toString())}
                      className="cursor-pointer py-2 px-2 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-xs font-mono font-bold text-amber-400 text-center transition-all active:scale-95"
                    >
                      <div>{preset.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{formatPrice(preset.val, currency, lang)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom price input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'ar' ? 'أدخل مستهدف السعر للتنبيه:' : 'Target Price Threshold:'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold font-mono text-slate-500">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={priceAlertInput}
                    onChange={(e) => setPriceAlertInput(e.target.value)}
                    placeholder={(auction.currentPrice + minIncrementRule).toString()}
                    className="w-full font-mono font-bold border border-white/10 focus:border-amber-500 bg-[#18181c] rounded-xl pl-12 pr-4 py-2.5 text-sm text-white outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {lang === 'ar' ? 'سيتم تنبيهك عند تجاوز أو تساوي سعر المزاد بهذا الرقم.' : 'Alert triggers when current price matches or exceeds this value.'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                {priceAlert ? (
                  <button
                    type="button"
                    onClick={handleRemovePriceAlert}
                    className="cursor-pointer px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <BellOff className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'إلغاء التنبيه' : 'Remove Alert'}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPriceAlertModal(false)}
                    className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetVal = Number(priceAlertInput);
                      if (!isNaN(targetVal) && targetVal > 0) {
                        handleSavePriceAlert(targetVal);
                      }
                    }}
                    disabled={!priceAlertInput || Number(priceAlertInput) <= 0}
                    className="cursor-pointer px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {lang === 'ar' ? 'حفظ التنبيه' : 'Save Alert'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
