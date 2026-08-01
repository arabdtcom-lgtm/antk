/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { translations, Language, Currency } from '../utils/translations';
import { SupportTicket, User } from '../types';
import { MessageSquare, FileText, CheckCircle, Clock, ShieldCheck, CornerDownLeft } from 'lucide-react';

interface SupportPanelProps {
  lang: Language;
  user: User | null;
}

export default function SupportPanel({ lang, user }: SupportPanelProps) {
  const t = translations[lang];

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch only this current user tickets
  const fetchMyTickets = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        if (user) {
          // Filter tickets filed by this specific email
          const filtered = data.tickets.filter((tick: SupportTicket) => tick.email === user.email);
          setTickets(filtered);
        } else {
          setTickets([]);
        }
      }
    } catch (e) {
      console.warn('Support tickets query deferred:', e);
    }
  };

  useEffect(() => {
    if (!user) {
      setTickets([]);
      return;
    }
    fetchMyTickets();
    const interval = setInterval(fetchMyTickets, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Submit new ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لتتمكن من تقديم تذكرة دعم فني.' : 'Please authenticate before submitting support tickets.');
      return;
    }

    setLoading(true);
    setSuccess(false);
    setErrorMsg('');

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message })
      });
      if (res.ok) {
        setSubject('');
        setMessage('');
        setSuccess(true);
        fetchMyTickets();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setErrorMsg(lang === 'ar' ? 'فشل إرسال التذكرة. يرجى المحاولة لاحقاً.' : 'Ticket transmission failed.');
      }
    } catch (e) {
      setErrorMsg(lang === 'ar' ? 'فشل الاتصال بالشبكة.' : 'Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      
      {/* Title Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <span>{t.supportCenter}</span>
        </h2>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {lang === 'ar' ? 'يمكنك تقديم الشكاوى، طلبات الاستفسار، ومطالب فك حجز الضمان لحل النزاعات مباشرة' : 'File complaints, ask inquiries, or dispute escrows directly'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left view: File new ticket form */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-emerald-500" />
            <span>{t.openNewTicket}</span>
          </h3>

          {success && (
            <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-100 text-emerald-700 text-xs font-bold text-right mb-4">
              ✓ تم إرسال تذكرة دعمك الفني بنجاح! سوف يجيب المستشار في الدقائق القادمة.
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-rose-50 p-2.5 border border-rose-100 text-rose-700 text-xs font-bold text-right mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div>
              <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                {t.ticketSubject}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: مشكلة في دفع قيمة السلعة، تتبع شحنة تائهة..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                {t.ticketMessage}
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب شرحاً وافياً للمشكلة أو الرمز المرجعي للمزاد المعني..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none font-medium leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              {loading ? '...' : t.submitTicket}
            </button>
          </form>
        </div>

        {/* Right view: Dynamic Listing of personal support incidents of this logged in index */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 shadow-sm">
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span>مزاداتي ودفاتر تذاكر الدعم الفني ({tickets.length})</span>
          </h3>

          {!user ? (
            <p className="text-xs text-center py-12 text-slate-400 font-bold">
              يرجى تسجيل الدخول لعرض تذاكر دعمك الفني المسجلة لدينا بالمنصة.
            </p>
          ) : tickets.length === 0 ? (
            <p className="text-xs text-center py-12 text-slate-400">
              {t.noTickets}
            </p>
          ) : (
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {tickets.map((tick, tIdx) => (
                <div key={`supp-tick-${tick.id}-${tIdx}`} className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 dark:border-slate-800 dark:bg-slate-850/40 space-y-3">
                  
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {tick.subject}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      tick.status === 'open' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {tick.status === 'open' ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <ShieldCheck className="h-3 w-3" />
                      )}
                      <span>{tick.status === 'open' ? t.openStatus : t.answeredStatus}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                    {tick.message}
                  </p>

                  <div className="text-[9px] text-slate-400 font-mono">
                    ID: {tick.id} &bull; {new Date(tick.timestamp).toLocaleString('ar-EG')}
                  </div>

                  {/* Reply container if replied */}
                  {tick.reply && (
                    <div className="mt-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 p-3 text-xs leading-relaxed space-y-1">
                      <p className="text-[10px] uppercase font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                        <CornerDownLeft className="h-3.5 w-3.5" />
                        <span>{t.adminReply}</span>
                      </p>
                      <p className="text-emerald-900 dark:text-emerald-300 font-extrabold leading-relaxed">
                        {tick.reply}
                      </p>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
