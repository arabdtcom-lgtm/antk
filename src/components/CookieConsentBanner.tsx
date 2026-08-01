import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consentChoice = localStorage.getItem('antkawy_cookie_consent');
    if (!consentChoice) {
      setShowBanner(true);
    } else if (consentChoice === 'granted') {
      updateConsent(true);
    } else {
      updateConsent(false);
    }
  }, []);

  const updateConsent = (granted: boolean) => {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: granted ? 'granted' : 'denied',
        ad_user_data: granted ? 'granted' : 'denied',
        ad_personalization: granted ? 'granted' : 'denied',
        analytics_storage: granted ? 'granted' : 'denied',
      });
    }
  };

  const handleAcceptAll = () => {
    localStorage.setItem('antkawy_cookie_consent', 'granted');
    updateConsent(true);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem('antkawy_cookie_consent', 'denied');
    updateConsent(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/30 backdrop-blur-xl shadow-2xl shadow-black/80 text-white transition-all duration-300 animate-fade-in dir-rtl" dir="rtl">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 002-2H4a2 2 0 00-2 2v6a2 2 0 002 2zm8-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-base text-amber-400 font-serif mb-1">
            إعدادات الخصوصية وملفات الكوكيز 🍪
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            نحن نستخدم ملفات تعريف الارتباط وتقنيات التحليل لتحسين تجربتك في منصة <span className="text-amber-300 font-semibold">مزادات أنتيكاوي</span> وتقديم خدمات مخصصة تناسب تطلعاتك.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800/80">
        <button
          onClick={handleAcceptAll}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
        >
          موافقة على الكل
        </button>
        <button
          onClick={handleRejectAll}
          className="flex-1 py-2.5 px-4 bg-zinc-800/90 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs rounded-xl border border-zinc-700/60 transition-all active:scale-[0.98]"
        >
          رفض غير الضروري
        </button>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
