/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Upload, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Tag, 
  Search,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react';
import { Auction } from '../types';
import { formatPrice, Language, Currency } from '../utils/translations';
import { audioSynth } from '../utils/audio';

interface QrCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currency: Currency;
  allAuctions?: Auction[];
  onSelectAuction?: (auction: Auction) => void;
  onOpenAuctionId?: (auctionId: string) => void;
}

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  isOpen,
  onClose,
  lang,
  currency,
  allAuctions = [],
  onSelectAuction,
  onOpenAuctionId
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<{
    rawText: string;
    auctionId: string | null;
    matchedAuction: Auction | null;
  } | null>(null);

  const [manualIdInput, setManualIdInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Start camera stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setScannedResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          lang === 'ar'
            ? 'متصفحك لا يدعم الوصول المباشر لكاميرا الجهاز.'
            : 'Your browser does not support camera stream access.'
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera access status:', err?.message || err);
      setIsScanning(false);
      const isDismissed = err?.name === 'NotAllowedError' || String(err?.message || err).toLowerCase().includes('dismissed') || String(err?.message || err).toLowerCase().includes('permission');
      setCameraError(
        isDismissed
          ? (lang === 'ar' 
              ? 'تم رفض إذن الكاميرا أو تجاهله. يمكنكرفع صورة الكود أو إدخال رقم المعرف يدوياً.' 
              : 'Camera permission was dismissed or denied. You can upload an image or enter the Auction ID manually.')
          : (err?.message || (lang === 'ar' ? 'تعذر فتح الكاميرا. يرجى التأكد من إعطاء الإذن.' : 'Failed to access camera. Please check permissions.'))
      );
    }
  };

  // Process a raw scanned string to extract auction ID and match with list
  const handleScannedRawString = (text: string) => {
    let extractedId: string | null = null;

    // Check if URL contains auctionId parameter
    if (text.includes('auctionId=')) {
      try {
        const urlObj = new URL(text.startsWith('http') ? text : `https://${text}`);
        extractedId = urlObj.searchParams.get('auctionId');
      } catch (_) {
        const match = text.match(/auctionId=([^&]+)/);
        if (match) extractedId = match[1];
      }
    } else if (text.trim().length > 0) {
      // Direct auction ID match attempt
      const trimmed = text.trim();
      extractedId = trimmed;
    }

    let matched: Auction | null = null;
    if (extractedId) {
      matched = allAuctions.find(a => a.id.toLowerCase() === extractedId!.toLowerCase()) || null;
    }

    setScannedResult({
      rawText: text,
      auctionId: extractedId,
      matchedAuction: matched
    });

    // Feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([40, 80, 40]); } catch (_) {}
    }
    if (soundEnabled) {
      try { audioSynth.playBidPlacedSound(); } catch (_) {}
    }
  };

  // Canvas loop scanning video frame
  const tickScan = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(tickScan);
      return;
    }

    const video = videoRef.current;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        stopCamera();
        handleScannedRawString(code.data);
        return;
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tickScan);
  };

  // Process uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            handleScannedRawString(code.data);
          } else {
            alert(
              lang === 'ar'
                ? 'لم يتم العثور على رمز QR واضح في الصورة المحددة. يرجى محاولة صورة أخرى.'
                : 'No valid QR code found in selected image. Please try another image.'
            );
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const isRTL = lang === 'ar';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/30 bg-[#0d0d0f] p-5 sm:p-6 shadow-2xl shadow-black text-white"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Scan className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white tracking-wide flex items-center gap-2">
                  <span>{isRTL ? 'ماسح الرمز التفاعلي للمزادات' : 'Interactive Auction Tag Scanner'}</span>
                  <span className="text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isRTL ? 'امسح رمز القطعة أو الملصق الإعلاني للانتقال للمزاد فوراً' : 'Scan physical tag or printed poster to open auction instantly'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-amber-400 transition-colors"
                title={soundEnabled ? (isRTL ? 'كتم الصوت' : 'Mute sound') : (isRTL ? 'تفعيل الصوت' : 'Enable sound')}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="mt-4 grid grid-cols-3 gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setScannedResult(null);
                setActiveTab('camera');
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-amber-500 text-black shadow font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>{isRTL ? 'الكاميرا الحية' : 'Live Camera'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setScannedResult(null);
                setActiveTab('upload');
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-amber-500 text-black shadow font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{isRTL ? 'رفع صورة' : 'Upload Image'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setScannedResult(null);
                setActiveTab('manual');
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-amber-500 text-black shadow font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>{isRTL ? 'رقم المعرف' : 'Enter ID'}</span>
            </button>
          </div>

          {/* MAIN BODY AREA */}
          <div className="mt-4">
            {/* Scanned Success Match Overlay Result */}
            {scannedResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-4"
              >
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold font-serif">
                      {isRTL ? 'تم القراءة بنجاح!' : 'QR Code Successfully Scanned!'}
                    </h4>
                    <p className="text-[11px] opacity-80 font-mono break-all">
                      {scannedResult.rawText}
                    </p>
                  </div>
                </div>

                {scannedResult.matchedAuction ? (
                  <div className="p-3 rounded-lg bg-[#141416] border border-white/10 flex items-center gap-3">
                    <img
                      src={scannedResult.matchedAuction.image}
                      alt={isRTL ? scannedResult.matchedAuction.titleAr : scannedResult.matchedAuction.titleEn}
                      className="h-16 w-16 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono font-bold">
                        <Tag className="h-3 w-3" />
                        <span>ID: {scannedResult.matchedAuction.id}</span>
                      </div>
                      <h5 className="text-xs font-serif font-bold text-white truncate">
                        {isRTL ? scannedResult.matchedAuction.titleAr : scannedResult.matchedAuction.titleEn}
                      </h5>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{isRTL ? 'السعر الحالي:' : 'Current Bid:'}</span>
                        <span className="text-xs font-black font-mono text-amber-400">
                          {formatPrice(scannedResult.matchedAuction.currentPrice, currency, lang)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    {isRTL
                      ? `تم استخراج المعرف (${scannedResult.auctionId || scannedResult.rawText}) ولكن لم يتم العثور على مزاد مطابق في القائمة الحالية.`
                      : `Extracted ID (${scannedResult.auctionId || scannedResult.rawText}) - no matching auction in active directory.`}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {scannedResult.matchedAuction && (onSelectAuction || onOpenAuctionId) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (scannedResult.matchedAuction && onSelectAuction) {
                          onSelectAuction(scannedResult.matchedAuction);
                        } else if (scannedResult.auctionId && onOpenAuctionId) {
                          onOpenAuctionId(scannedResult.auctionId);
                        }
                        onClose();
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>{isRTL ? 'الانتقال لصفحة المزاد' : 'Open Auction Page'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setScannedResult(null);
                      if (activeTab === 'camera') startCamera();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>{isRTL ? 'مسح رمز آخر' : 'Scan Again'}</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* TAB 1: CAMERA SCANNER */}
                {activeTab === 'camera' && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-white/10 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover"
                    />

                    {/* Viewfinder Target Reticle Overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl border-2 border-amber-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                          {/* Corner Markers */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

                          {/* Animated Laser Scanning Line */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse shadow-[0_0_12px_rgba(245,158,11,1)] top-1/2 relative" />
                        </div>
                      </div>
                    )}

                    {/* Error State or Loading State */}
                    {cameraError && (
                      <div className="absolute inset-0 bg-[#0d0d0f]/95 p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <AlertCircle className="h-10 w-10 text-rose-500 animate-bounce" />
                        <p className="text-xs text-rose-300 max-w-xs">{cameraError}</p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>{isRTL ? 'إعادة المحاولة' : 'Retry Camera'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: UPLOAD IMAGE SCANNER */}
                {activeTab === 'upload' && (
                  <div className="p-8 border-2 border-dashed border-white/20 hover:border-amber-500/50 rounded-xl bg-white/[0.02] transition-colors text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-serif font-bold text-white">
                        {isRTL ? 'اختر صورة الملصق أو ملصق المزاد' : 'Choose Tag or Poster Image'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        {isRTL ? 'ارفع صورة تحتوي على رمز QR مدمج لفك تشفير الرابط فوراً' : 'Upload an image containing a QR code to read the auction target.'}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                      <Upload className="h-4 w-4" />
                      <span>{isRTL ? 'استعراض الصور' : 'Browse Files'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* TAB 3: MANUAL ID LOOKUP */}
                {activeTab === 'manual' && (
                  <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {isRTL ? 'أدخل رقم المعرف للقطعة المطبوع تحت الرمز' : 'Enter Printed Tag ID'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualIdInput}
                        onChange={(e) => setManualIdInput(e.target.value)}
                        placeholder="e.g. a1, a2, a3..."
                        className="flex-1 bg-black/60 border border-white/10 focus:border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (manualIdInput.trim()) {
                            handleScannedRawString(manualIdInput.trim());
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
                      >
                        <Search className="h-4 w-4" />
                        <span>{isRTL ? 'بحث' : 'Search'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Guidance Footer */}
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isRTL ? 'ماسح ضوئي آمن ومعتمد' : 'Encrypted Tag Verifier'}</span>
            </span>
            <span>{isRTL ? 'أنتيكاوي v2.6' : 'Antikawi v2.6'}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QrCodeScannerModal;
