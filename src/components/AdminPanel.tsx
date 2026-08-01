/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { translations, Language, Currency, formatPrice } from '../utils/translations';
import { Auction, SupportTicket, Shipment, EscrowTransaction, BackupLog, ApiKey, SystemSettings, Bid } from '../types';
import { 
  BarChart as RechartsBarChart, 
  Bar as RechartsBar, 
  XAxis as RechartsXAxis, 
  YAxis as RechartsYAxis, 
  Tooltip as RechartsTooltip, 
  PieChart as RechartsPieChart, 
  Pie as RechartsPie, 
  Cell as RechartsCell, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Database, 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  Lock, 
  CheckCircle, 
  Settings as SettingsIcon, 
  FileText, 
  Key, 
  Download, 
  MessageSquare, 
  RefreshCw, 
  Truck,
  Trash2,
  FileSpreadsheet,
  Gavel,
  Eye,
  Edit,
  Pause,
  Play,
  XCircle,
  AlertTriangle,
  Check,
  Search,
  Sliders,
  Bell,
  ShieldCheck,
  Award,
  UserCheck
} from 'lucide-react';
import TrustScoreProgressBar from './TrustScoreProgressBar';
import { DEMO_USERS } from '../utils/firebase';

interface AdminPanelProps {
  lang: Language;
  currency: Currency;
  onRefreshData?: () => void;
}

export default function AdminPanel({ lang, currency, onRefreshData }: AdminPanelProps) {
  const t = translations[lang];

  // Primary navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'trust_scores' | 'settings'>('overview');

  // Raw dashboard state
  const [metrics, setMetrics] = useState<any>({
    activeAuctions: 0,
    completedAuctions: 0,
    activeUsers: 0,
    escrowHeld: 0,
    escrowReleased: 0,
    totalSuccessfulSales: 0,
    categoryStats: [],
    bidTrends: []
  });

  const [settings, setSettings] = useState<SystemSettings>({
    autoBackupIntervalHours: 12,
    systemNotificationEmail: 'support@souqauction.com',
    escrowReleaseTimeoutDays: 7,
    allowManualBidApproval: false,
    maintenanceMode: false,
    requireAdminApproval: false
  });

  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Moderation state
  const [moderationFilter, setModerationFilter] = useState<'all' | 'pending_approval' | 'active' | 'completed' | 'cancelled' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Dialogs
  const [rejectModalAuction, setRejectModalAuction] = useState<Auction | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  
  const [editModalAuction, setEditModalAuction] = useState<Auction | null>(null);
  const [editForm, setEditForm] = useState({
    titleAr: '',
    titleEn: '',
    descAr: '',
    descEn: '',
    category: '',
    startPrice: 0,
    minIncrement: 0,
    buyoutPrice: ''
  });

  const [inspectBidsAuction, setInspectBidsAuction] = useState<Auction | null>(null);
  const [inspectedBids, setInspectedBids] = useState<Bid[]>([]);
  const [inspectedBidsLoading, setInspectedBidsLoading] = useState(false);

  // Interactive local states
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [apiKeyClient, setApiKeyClient] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch all administrative lists
  const fetchAdminData = async () => {
    try {
      const rm = await fetch('/api/admin/metrics');
      if (rm.ok) {
        const dm = await rm.json();
        setMetrics(dm.metrics);
      }

      const rs = await fetch('/api/settings');
      if (rs.ok) {
        const ds = await rs.json();
        setSettings(ds.settings);
      }

      const ra = await fetch('/api/auctions');
      if (ra.ok) {
        const da = await ra.json();
        setAllAuctions(da.auctions || []);
      }

      const rt = await fetch('/api/support/tickets');
      if (rt.ok) {
        const dt = await rt.json();
        setTickets(dt.tickets);
      }

      const rb = await fetch('/api/backups');
      if (rb.ok) {
        const db = await rb.json();
        setBackups(db.backups);
      }

      const rk = await fetch('/api/api-keys');
      if (rk.ok) {
        const dk = await rk.json();
        setApiKeys(dk.apiKeys);
      }

      const rsh = await fetch('/api/shipments');
      if (rsh.ok) {
        const dsh = await rsh.json();
        setShipments(dsh.shipments);
      }

      const rl = await fetch('/api/logs');
      if (rl.ok) {
        const dl = await rl.json();
        setLogs(dl.logs);
      }
    } catch (e) {
      console.warn('Error loading admin details', e);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Update Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Moderation Handlers
  const handleApproveAuction = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/auctions/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        showToast(t.auctionApprovedToast || 'تمت الموافقة على المزاد ونشره بنجاح!');
        fetchAdminData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalAuction) return;
    try {
      const res = await fetch(`/api/admin/auctions/${rejectModalAuction.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReasonInput })
      });
      if (res.ok) {
        showToast(t.auctionRejectedToast || 'تم رفض المزاد وإبلاغ البائع بالسبب.');
        setRejectModalAuction(null);
        setRejectionReasonInput('');
        fetchAdminData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePause = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/auctions/${id}/toggle-pause`, { method: 'POST' });
      if (res.ok) {
        fetchAdminData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelAuction = async (id: string) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت تأكد من إلغاء هذا المزاد إدارياً؟' : 'Are you sure you want to force-cancel this auction?')) return;
    try {
      const res = await fetch(`/api/admin/auctions/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'إلغاء إداري مباشر' })
      });
      if (res.ok) {
        fetchAdminData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditModal = (auction: Auction) => {
    setEditModalAuction(auction);
    setEditForm({
      titleAr: auction.titleAr,
      titleEn: auction.titleEn,
      descAr: auction.descAr,
      descEn: auction.descEn,
      category: auction.category,
      startPrice: auction.startPrice,
      minIncrement: auction.minIncrement,
      buyoutPrice: auction.buyoutPrice ? String(auction.buyoutPrice) : ''
    });
  };

  const handleSaveEditAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalAuction) return;
    try {
      const res = await fetch(`/api/admin/auctions/${editModalAuction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleAr: editForm.titleAr,
          titleEn: editForm.titleEn,
          descAr: editForm.descAr,
          descEn: editForm.descEn,
          category: editForm.category,
          startPrice: Number(editForm.startPrice),
          minIncrement: Number(editForm.minIncrement),
          buyoutPrice: editForm.buyoutPrice ? Number(editForm.buyoutPrice) : undefined
        })
      });
      if (res.ok) {
        showToast(lang === 'ar' ? 'تم تحديث بيانات المزاد بنجاح' : 'Auction details updated successfully');
        setEditModalAuction(null);
        fetchAdminData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInspectBids = async (auction: Auction) => {
    setInspectBidsAuction(auction);
    setInspectedBidsLoading(true);
    try {
      const res = await fetch(`/api/auctions/${auction.id}/bids`);
      if (res.ok) {
        const data = await res.json();
        setInspectedBids(data.bids || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInspectedBidsLoading(false);
    }
  };

  const handleInvalidateBid = async (bidId: string) => {
    if (!inspectBidsAuction) return;
    if (!window.confirm(t.confirmInvalidateBid || 'هل أنت تأكد من إبطال هذه المزايدة؟')) return;
    try {
      const res = await fetch(`/api/admin/auctions/${inspectBidsAuction.id}/bids/${bidId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(t.bidInvalidatedToast || 'تم إبطال المزايدة بنجاح');
        handleInspectBids(inspectBidsAuction);
        fetchAdminData();
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reply to support ticket
  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !adminReplyText.trim()) return;

    try {
      const res = await fetch(`/api/support/tickets/${selectedTicketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: adminReplyText })
      });
      if (res.ok) {
        setAdminReplyText('');
        setSelectedTicketId(null);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate outgoing API Key
  const handleGenerateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyClient.trim()) return;

    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: apiKeyClient })
      });
      if (res.ok) {
        setApiKeyClient('');
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Revoke API Key
  const handleRevokeApiKey = async (id: string) => {
    try {
      await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger manual system database backup
  const handleTriggerBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backups', { method: 'POST' });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBackupLoading(false);
    }
  };

  // Simulated spreadsheet downloader (Export reports)
  const handleExportSpreadsheet = () => {
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      "MetricName,Value\n" + 
      `Active Auctions,${metrics.activeAuctions}\n` + 
      `Total Users,${metrics.activeUsers}\n` + 
      `Total Sales (SAR),${metrics.totalSuccessfulSales}\n` + 
      `Escrow Held (SAR),${metrics.escrowHeld}\n` + 
      `Escrow Released (SAR),${metrics.escrowReleased}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `souq_auction_metrics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color constants for Pie Cells
  const CHART_COLORS = ['#d97706', '#92400e', '#f59e0b', '#b45309', '#78350f', '#f59e0b'];

  const pendingAuctionsCount = allAuctions.filter(a => a.status === 'pending_approval').length;

  const filteredAuctions = allAuctions.filter(a => {
    if (moderationFilter !== 'all' && a.status !== moderationFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = (a.titleAr && a.titleAr.toLowerCase().includes(term)) || (a.titleEn && a.titleEn.toLowerCase().includes(term));
      const matchSeller = a.seller?.name?.toLowerCase().includes(term) || a.sellerEmail?.toLowerCase().includes(term);
      return matchTitle || matchSeller;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black font-bold text-xs px-5 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="h-5 w-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-white flex items-center gap-2">
            <Lock className="h-6 w-6 text-amber-500" />
            <span>{t.adminPanelTitle}</span>
          </h2>
          <p className="text-xs font-bold text-slate-400">
            {lang === 'ar' ? 'البوابة السيادية لرصد المعاملات، تذاكر الدعم، النسخ الاحتياطي، وإدارة المزادات' : 'Sovereign center for logs, tickets, backups, and auction moderation'}
          </p>
        </div>

        <button
          onClick={handleExportSpreadsheet}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded border border-amber-500/25 transition-all cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>{t.exportToExcel}</span>
        </button>
      </div>

      {/* PRIMARY NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded cursor-pointer transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#161618] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>{lang === 'ar' ? 'مؤشرات الأداء العامة' : 'Metrics & Support'}</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded cursor-pointer transition-all relative ${
            activeTab === 'moderation'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#161618] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
          }`}
        >
          <Gavel className="h-4 w-4" />
          <span>{t.moderationTab || 'إدارة المزادات والمراجعة'}</span>
          {pendingAuctionsCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {pendingAuctionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('trust_scores')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded cursor-pointer transition-all ${
            activeTab === 'trust_scores'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#161618] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>{lang === 'ar' ? 'سجل موثوقية الأعضاء (Trust Scores)' : 'Member Trust Directory'}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded cursor-pointer transition-all ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#161618] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
          }`}
        >
          <SettingsIcon className="h-4 w-4" />
          <span>{t.databaseSettings}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* METRICS ROW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.totalUsers}</span>
                <Users className="h-5 w-5 text-amber-500/60" />
              </div>
              <p className="mt-2 text-2xl font-bold text-white font-mono">{metrics.activeUsers}</p>
              <div className="text-[10px] text-amber-400 font-bold mt-1">↑ 100% {lang === 'ar' ? 'حسابات نشطة' : 'Active'}</div>
            </div>

            <div className="rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.totalSales}</span>
                <TrendingUp className="h-5 w-5 text-amber-500/60" />
              </div>
              <p className="mt-2 text-2xl font-bold text-white font-mono">{formatPrice(metrics.totalSuccessfulSales, currency, lang)}</p>
              <div className="text-[10px] text-slate-400 font-bold mt-1">{lang === 'ar' ? 'المبيعات الكلية المغلقة' : 'Closed transactions value'}</div>
            </div>

            <div className="rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.heldEscrow}</span>
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-500 font-mono">{formatPrice(metrics.escrowHeld, currency, lang)}</p>
              <div className="text-[10px] text-amber-500/80 font-bold mt-1">● {lang === 'ar' ? 'محجوزة بحساب الضمان المانع' : 'Held under Escrow protection'}</div>
            </div>

            <div className="rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.releasedEscrow}</span>
                <CheckCircle className="h-5 w-5 text-amber-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-400 font-mono">{formatPrice(metrics.escrowReleased, currency, lang)}</p>
              <div className="text-[10px] text-slate-400 font-bold mt-1">{lang === 'ar' ? 'محررة ومحولة للبائعين' : 'Released funds total'}</div>
            </div>

          </div>

          {/* RECHARTS CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <h3 className="text-sm font-serif font-semibold text-white mb-4">
                📊 {t.categoryDistribution}
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <RechartsPie
                      data={metrics.categoryStats || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(metrics.categoryStats || []).map((entry: any, index: number) => (
                        <RechartsCell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </RechartsPie>
                    <RechartsTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <h3 className="text-sm font-serif font-semibold text-white mb-4">
                📈 {t.recentBidsActivity}
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={metrics.bidTrends || []}>
                    <RechartsXAxis dataKey="time" stroke="#64748b" fontSize={10} />
                    <RechartsYAxis stroke="#64748b" fontSize={10} />
                    <RechartsTooltip />
                    <RechartsBar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SUPPORT TICKETS & REPLY BOX */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <h3 className="text-sm font-serif font-semibold text-white mb-4 flex items-center justify-between">
                <span>💬 {t.supportTickets}</span>
                <span className="text-[10px] text-slate-400 font-mono">{tickets.length} تذكرة</span>
              </h3>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {tickets.map((tk, tkIdx) => (
                  <div
                    key={`adm-tk-${tk.id}-${tkIdx}`}
                    onClick={() => setSelectedTicketId(tk.id)}
                    className={`p-3 rounded border text-xs cursor-pointer transition-all ${
                      selectedTicketId === tk.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-white/5 bg-[#161618] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{tk.name} ({tk.email})</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        tk.status === 'open' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {tk.status === 'open' ? t.openStatus : t.answeredStatus}
                      </span>
                    </div>
                    <p className="text-slate-300 font-semibold mb-1">{tk.subject}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{tk.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <h3 className="text-sm font-serif font-semibold text-white mb-4">
                💬 تقديم الرد الإداري المباشر للعميل
              </h3>

              {selectedTicketId ? (
                <form onSubmit={handleReplyTicket} className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-450 font-bold mb-1">رسالة تذكرة العميل المحددة:</p>
                    <div className="bg-[#161618] rounded p-3 text-xs text-slate-300 italic font-mono leading-relaxed border border-white/5">
                      {tickets.find(t => t.id === selectedTicketId)?.message}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] tracking-wider font-bold uppercase text-slate-400 block mb-1">الرد الإداري المقترح</label>
                    <textarea
                      rows={4}
                      required
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      placeholder="اكتب ردك للمشكلة الفنية بأمان للعميل..."
                      className="w-full bg-[#161618] border border-white/10 rounded p-3 text-xs text-white outline-none focus:border-amber-500/50 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full cursor-pointer py-2 text-xs font-bold uppercase tracking-wider text-black bg-amber-500 hover:bg-amber-400 rounded transition-all"
                  >
                    إرسال الرد وتعديل الحالة لـ "تم الرد"
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-550 py-12 text-center font-light">
                  اختر تذكرة دعم فني معلقة من القائمة المقابلة لبدء صياغة الرد وتحرير الحلول.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUCTION MODERATION & APPROVALS */}
      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Moderation summary header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0d0d0f] border border-amber-500/30 rounded p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">طلبات المعاينة المعلقة</span>
                <span className="text-2xl font-mono font-black text-white">{pendingAuctionsCount}</span>
              </div>
              <ShieldAlert className="h-8 w-8 text-amber-500/80" />
            </div>

            <div className="bg-[#0d0d0f] border border-white/10 rounded p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">المزادات النشطة بالموقع</span>
                <span className="text-2xl font-mono font-black text-white">
                  {allAuctions.filter(a => a.status === 'active' && !a.isPaused).length}
                </span>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/80" />
            </div>

            <div className="bg-[#0d0d0f] border border-white/10 rounded p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">المزادات الموقوفة أو المرفوضة</span>
                <span className="text-2xl font-mono font-black text-white">
                  {allAuctions.filter(a => a.status === 'rejected' || a.isPaused || a.status === 'cancelled').length}
                </span>
              </div>
              <AlertTriangle className="h-8 w-8 text-rose-500/80" />
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-[#0d0d0f] border border-white/10 rounded p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'pending_approval', 'active', 'completed', 'cancelled', 'rejected'] as const).map(flt => (
                <button
                  key={flt}
                  onClick={() => setModerationFilter(flt)}
                  className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${
                    moderationFilter === flt
                      ? 'bg-amber-500 text-black'
                      : 'bg-[#161618] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {flt === 'all' && (lang === 'ar' ? 'الكل' : 'All')}
                  {flt === 'pending_approval' && (t.pending_approval || 'قيد المراجعة')}
                  {flt === 'active' && (t.active || 'نشط')}
                  {flt === 'completed' && (t.completed || 'مغلق')}
                  {flt === 'cancelled' && (t.cancelled || 'ملغى')}
                  {flt === 'rejected' && (t.rejected || 'مرفوض')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث باسم المزاد أو البائع...' : 'Search title or seller...'}
                className="w-full bg-[#161618] border border-white/10 rounded pr-9 pl-3 py-1.5 text-xs text-white outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Pending Approval Highlight Section */}
          {pendingAuctionsCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-5 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="h-5 w-5" />
                <span>يوجد {pendingAuctionsCount} طلب إدراج مزاد جديد بانتظار مراجعتك وقبولك قبل الظهور للعامة:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allAuctions.filter(a => a.status === 'pending_approval').map((auc, idx) => (
                  <div key={`pnd-${auc.id}-${idx}`} className="bg-[#0d0d0f] border border-amber-500/20 rounded p-4 flex gap-4">
                    <img src={auc.image} alt={auc.titleAr} className="h-20 w-20 object-cover rounded border border-white/10" />
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{lang === 'ar' ? auc.titleAr : auc.titleEn}</h4>
                      <p className="text-[10px] text-slate-400">البائع: <span className="text-white font-bold">{auc.seller.name}</span></p>
                      <p className="text-[10px] text-slate-400">السعر الافتتاحي: <span className="text-amber-400 font-mono font-bold">{formatPrice(auc.startPrice, currency, lang)}</span></p>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleApproveAuction(auc.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded cursor-pointer transition-all flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{t.approveListing || 'موافقة ونشر'}</span>
                        </button>
                        <button
                          onClick={() => setRejectModalAuction(auc)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded cursor-pointer transition-all flex items-center gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{t.rejectListing || 'رفض'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auctions List Table */}
          <div className="bg-[#0d0d0f] border border-white/10 rounded p-5 shadow-2xl">
            <h3 className="text-sm font-serif font-semibold text-white mb-4 flex items-center justify-between">
              <span>{t.moderationTab || 'سجل المزادات والتحكم الرقابي'}</span>
              <span className="text-xs text-slate-400 font-mono">{filteredAuctions.length} مزاد</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-[10px] font-black uppercase">
                    <th className="py-3 px-2">المزاد</th>
                    <th className="py-3 px-2">الفئة</th>
                    <th className="py-3 px-2">البائع</th>
                    <th className="py-3 px-2">الحالة</th>
                    <th className="py-3 px-2">السعر والمزايدات</th>
                    <th className="py-3 px-2 text-center">العمليات الإدارية</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuctions.map((auc, idx) => (
                    <tr key={`adm-tbl-${auc.id}-${idx}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <img src={auc.image} alt={auc.titleAr} className="h-10 w-10 object-cover rounded border border-white/10" />
                          <div>
                            <p className="font-bold text-white line-clamp-1 max-w-xs">{lang === 'ar' ? auc.titleAr : auc.titleEn}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{auc.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2 text-slate-300 font-medium">{auc.category}</td>

                      <td className="py-3 px-2">
                        <p className="font-bold text-white">{auc.seller.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{auc.sellerEmail || 'مستخدم معتمد'}</p>
                      </td>

                      <td className="py-3 px-2">
                        {auc.status === 'pending_approval' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {t.pending_approval || 'قيد المراجعة'}
                          </span>
                        )}
                        {auc.status === 'active' && !auc.isPaused && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {t.active || 'نشط'}
                          </span>
                        )}
                        {auc.status === 'active' && auc.isPaused && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {t.paused || 'موقوف مؤقتاً'}
                          </span>
                        )}
                        {auc.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {t.completed || 'مغلق'}
                          </span>
                        )}
                        {auc.status === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                            {t.cancelled || 'ملغى'}
                          </span>
                        )}
                        {auc.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {t.rejected || 'مرفوض'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2 font-mono">
                        <p className="font-bold text-amber-400">{formatPrice(auc.currentPrice, currency, lang)}</p>
                        <p className="text-[10px] text-slate-400">{auc.bidsCount} مزايدات</p>
                      </td>

                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {auc.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleApproveAuction(auc.id)}
                                className="p-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded transition-all cursor-pointer"
                                title="موافقة ونشر"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setRejectModalAuction(auc)}
                                className="p-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded transition-all cursor-pointer"
                                title="رفض المزاد"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {auc.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleTogglePause(auc.id)}
                                className={`p-1.5 rounded transition-all cursor-pointer ${
                                  auc.isPaused
                                    ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                                    : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white'
                                }`}
                                title={auc.isPaused ? (t.resumeBidding || 'استئناف') : (t.pauseBidding || 'إيقاف مؤقت')}
                              >
                                {auc.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleInspectBids(auc)}
                            className="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-all cursor-pointer"
                            title={t.inspectBidsBtn || 'سجل المزايدات'}
                          >
                            <Gavel className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(auc)}
                            className="p-1.5 bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-all cursor-pointer"
                            title="تعديل المزاد"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {auc.status !== 'cancelled' && auc.status !== 'rejected' && (
                            <button
                              onClick={() => handleCancelAuction(auc.id)}
                              className="p-1.5 bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded transition-all cursor-pointer"
                              title={t.cancelAuctionBtn || 'إلغاء المزاد'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MEMBER TRUST SCORES DIRECTORY */}
      {activeTab === 'trust_scores' && (
        <div className="space-y-6 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {/* Header Summary */}
          <div className="rounded-xl bg-[#0d0d0f] border border-amber-500/20 p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span>{lang === 'ar' ? 'دليل موثوقية وتقييم درجات الأمان للمزايدين' : 'Member Trust Score & Reputation Registry'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar'
                    ? 'نظام تحليلي ذكي يحسب موثوقية الحسابات بناءً على إتمام المعاملات، الالتزام بالوديعة، وتاريخ المزادات المغلقة.'
                    : 'Real-time trust score engine tracking escrow fulfillment, verified purchases, and dispute records.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                  {lang === 'ar' ? 'معدل الأمان الفيدرالي: 98.6%' : 'Network Trust Rating: 98.6%'}
                </span>
              </div>
            </div>
          </div>

          {/* User Trust Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEMO_USERS.map((usr, uIdx) => (
              <div key={`usr-${usr.id}-${uIdx}`} className="rounded-xl bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl space-y-4 hover:border-amber-500/30 transition-all">
                {/* User Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={usr.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                      alt={usr.name}
                      className="w-12 h-12 rounded-full object-cover border border-amber-500/30"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{usr.name}</span>
                        {usr.role === 'admin' && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">
                            Admin
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">{usr.email}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                    usr.tier === 'vip' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    usr.tier === 'verified_seller' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {usr.tier || 'Standard'}
                  </span>
                </div>

                {/* Trust Score Progress Component */}
                <TrustScoreProgressBar
                  user={usr}
                  auctions={allAuctions}
                  lang={lang}
                  variant="card"
                  showDetails={true}
                />

                {/* Footer Metrics */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5 font-mono">
                  <span>{lang === 'ar' ? 'الرصيد المتاح:' : 'Available Balance:'} <strong className="text-amber-400">{formatPrice(usr.balance, currency, lang)}</strong></span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {lang === 'ar' ? 'سجل نظيف' : 'Zero Disputes'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-8 animate-fade-in">
          {/* SYSTEM OPERATIONS CONFIGURATION SETTINGS */}
          <div className="rounded bg-[#0d0d0f] border border-white/10 p-6 shadow-2xl">
            <h3 className="text-sm font-serif font-semibold text-white mb-4 flex items-center gap-1.5 border-b border-white/10 pb-3">
              <SettingsIcon className="h-4 w-4 text-amber-500" />
              <span>{t.databaseSettings}</span>
            </h3>

            {settingsSuccess && (
              <div className="mb-4 rounded bg-[#0d0d0f] p-3 border border-amber-500/30 text-amber-400 text-xs font-bold text-right flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>✓ تم حفظ الإعدادات بنجاح ومزامنتها بالفيرستور!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-bold text-slate-400">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] tracking-wider uppercase text-slate-500 font-black mb-1">{t.autoBackupInterval}</label>
                  <input
                    type="number"
                    value={settings.autoBackupIntervalHours}
                    onChange={(e) => setSettings({ ...settings, autoBackupIntervalHours: Number(e.target.value) })}
                    className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-white outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-wider uppercase text-slate-500 font-black mb-1">{t.systemNotificationEmail}</label>
                  <input
                    type="email"
                    value={settings.systemNotificationEmail}
                    onChange={(e) => setSettings({ ...settings, systemNotificationEmail: e.target.value })}
                    className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-white outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-wider uppercase text-slate-500 font-black mb-1">{t.escrowReleaseTimeout}</label>
                  <input
                    type="number"
                    value={settings.escrowReleaseTimeoutDays}
                    onChange={(e) => setSettings({ ...settings, escrowReleaseTimeoutDays: Number(e.target.value) })}
                    className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-white outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>
              </div>

              {/* Toggles & Checkboxes */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">ضوابط النشر والرقابة السيادية</h4>

                <div className="flex items-center gap-3 p-3 bg-[#161618] border border-amber-500/20 rounded">
                  <input
                    type="checkbox"
                    id="reqAdminApproval"
                    checked={settings.requireAdminApproval}
                    onChange={(e) => setSettings({ ...settings, requireAdminApproval: e.target.checked })}
                    className="h-4 w-4 bg-[#161618] border-white/10 rounded text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="reqAdminApproval" className="cursor-pointer font-bold text-white text-xs">
                    🛡️ {t.requireAdminApproval || 'اشتراط المراجعة الإدارية المسبقة للمزادات الجديدة قبل النشر'}
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#161618] border border-white/5 rounded">
                  <input
                    type="checkbox"
                    id="manualBids"
                    checked={settings.allowManualBidApproval}
                    onChange={(e) => setSettings({ ...settings, allowManualBidApproval: e.target.checked })}
                    className="h-4 w-4 bg-[#161618] border-white/10 rounded text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="manualBids" className="cursor-pointer font-bold text-slate-300 text-xs">
                    {t.allowManualBidApproval}
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#161618] border border-rose-500/20 rounded">
                  <input
                    type="checkbox"
                    id="mMode"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="h-4 w-4 bg-[#161618] border-white/10 rounded text-rose-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="mMode" className="cursor-pointer font-bold text-rose-500 text-xs">
                    ⚠️ {t.maintenanceMode}
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full sm:w-auto px-8 cursor-pointer py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase tracking-wider rounded transition-colors shadow-lg shadow-amber-500/20"
                >
                  {settingsLoading ? '...' : t.saveSettingsBtn}
                </button>
              </div>

            </form>
          </div>

          {/* BACKUPS & API KEYS SYSTEM */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-4 mb-4 border-b border-white/10 pb-3">
                <h3 className="text-sm font-serif font-semibold text-white flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-amber-500" />
                  <span>{t.backupsList}</span>
                </h3>

                <button
                  onClick={handleTriggerBackup}
                  disabled={backupLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black bg-amber-500 hover:bg-amber-400 rounded transition-transform cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${backupLoading ? 'animate-spin' : ''}`} />
                  <span>{t.runBackupBtn}</span>
                </button>
              </div>

              <div className="space-y-3">
                {backups.map((b, bIdx) => (
                  <div key={`bk-${b.id || 'bk'}-${bIdx}`} className="flex items-center justify-between p-3 rounded bg-[#161618] border border-white/5 text-xs">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-amber-500/60" />
                      <div>
                        <p className="font-mono font-bold text-white">{b.file}</p>
                        <p className="text-[10px] text-slate-500">تاريخ النسخ: {new Date(b.timestamp).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">{b.size}</span>
                      <span className="text-[10px] text-amber-400 font-bold">✓ آمن ومشفر</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 rounded bg-[#0d0d0f] border border-white/10 p-5 shadow-2xl">
              <h3 className="text-sm font-serif font-semibold text-white mb-4">
                📜 {t.systemLogs}
              </h3>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {logs.map((l, lIdx) => (
                  <div key={`log-${l.id || 'log'}-${lIdx}`} className="text-[11px] font-medium leading-relaxed p-2 rounded bg-white/5 text-slate-300">
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
                      <span className="font-bold uppercase text-[8px] px-1.5 py-0.5 bg-white/5 rounded">
                        {l.type}
                      </span>
                      <span className="font-mono">{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400">{l.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS OVERLAY --- */}

      {/* 1. REJECT AUCTION REASON MODAL */}
      {rejectModalAuction && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0d0d0f] border border-rose-500/40 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between text-rose-400 font-bold border-b border-white/10 pb-3">
              <span className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span>{t.rejectListing || 'رفض أو إلغاء المزاد'}</span>
              </span>
              <button onClick={() => setRejectModalAuction(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              أنت على وشك رفض المزاد: <span className="font-bold text-white">{rejectModalAuction.titleAr}</span>
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t.rejectionReasonPrompt || 'سبب الرفض (سيتم إرساله في تنبيه للبائع):'}
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder={t.rejectionReasonPlaceholder || 'اكتب السبب لتأكيد إرسال تنبيه للبائع...'}
                className="w-full bg-[#161618] border border-white/10 rounded p-3 text-xs text-white outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded transition-all cursor-pointer"
              >
                تأكيد الرفض والإشعار
              </button>
              <button
                onClick={() => setRejectModalAuction(null)}
                className="py-2 px-4 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT AUCTION DETAILS MODAL */}
      {editModalAuction && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d0d0f] border border-amber-500/40 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scale-in my-8">
            <div className="flex items-center justify-between text-amber-400 font-bold border-b border-white/10 pb-3">
              <span className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                <span>{t.editAuctionModalTitle || 'تعديل بيانات المزاد الإدارية'}</span>
              </span>
              <button onClick={() => setEditModalAuction(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditAuction} className="space-y-4 text-xs font-bold text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1">عنوان المزاد (عربي)</label>
                <input
                  type="text"
                  required
                  value={editForm.titleAr}
                  onChange={(e) => setEditForm({ ...editForm, titleAr: e.target.value })}
                  className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-white outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">عنوان المزاد (English)</label>
                <input
                  type="text"
                  required
                  value={editForm.titleEn}
                  onChange={(e) => setEditForm({ ...editForm, titleEn: e.target.value })}
                  className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-white outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">الفئة</label>
                  <input
                    type="text"
                    required
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-white outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">السعر الافتتاحي</label>
                  <input
                    type="number"
                    required
                    value={editForm.startPrice}
                    onChange={(e) => setEditForm({ ...editForm, startPrice: Number(e.target.value) })}
                    className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-white outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">أقل قيمة زيادة</label>
                  <input
                    type="number"
                    required
                    value={editForm.minIncrement}
                    onChange={(e) => setEditForm({ ...editForm, minIncrement: Number(e.target.value) })}
                    className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-white outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">سعر الشراء الفوري (اختياري)</label>
                  <input
                    type="number"
                    value={editForm.buyoutPrice}
                    onChange={(e) => setEditForm({ ...editForm, buyoutPrice: e.target.value })}
                    placeholder="ترك فارغ للتعطيل"
                    className="w-full bg-[#161618] border border-white/10 rounded p-2.5 text-white outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded transition-all cursor-pointer"
                >
                  حفظ وتطبيق التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalAuction(null)}
                  className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. INSPECT BIDS MODAL */}
      {inspectBidsAuction && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d0d0f] border border-blue-500/40 rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-scale-in my-8">
            <div className="flex items-center justify-between text-blue-400 font-bold border-b border-white/10 pb-3">
              <span className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                <span>{t.inspectBidsBtn || 'سجل المزايدات والمراجعة الإدارية'}</span>
              </span>
              <button onClick={() => setInspectBidsAuction(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              مزاد: <span className="font-bold text-white">{inspectBidsAuction.titleAr}</span> — السعر الحالي: <span className="text-amber-400 font-bold font-mono">{formatPrice(inspectBidsAuction.currentPrice, currency, lang)}</span>
            </p>

            {inspectedBidsLoading ? (
              <p className="text-xs text-slate-400 py-8 text-center animate-pulse">جاري تحميل سجل المزايدات التفاعلي...</p>
            ) : inspectedBids.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">لا توجد مزايدات مسجلة على هذا المزاد بعد.</p>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-white/10 rounded">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-[#161618] sticky top-0">
                    <tr className="border-b border-white/10 text-slate-400 text-[10px] font-bold">
                      <th className="py-2.5 px-3">المزايد</th>
                      <th className="py-2.5 px-3">مبلغ العطاء</th>
                      <th className="py-2.5 px-3">التاريخ والوقت</th>
                      <th className="py-2.5 px-3 text-center">إبطال المزايدة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectedBids.map((b, idx) => (
                      <tr key={b.id ? `insp-${b.id}-${idx}` : `insp-${idx}`} className={`border-b border-white/5 ${idx === 0 ? 'bg-amber-500/10' : ''}`}>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-white">{b.bidderName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{b.bidderEmail}</p>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          {formatPrice(b.amount, currency, lang)}
                          {idx === 0 && <span className="mr-1 text-[9px] bg-amber-500 text-black px-1 rounded font-bold">الأعلى</span>}
                        </td>
                        <td className="py-2.5 px-3 text-[10px] font-mono text-slate-400">
                          {new Date(b.timestamp).toLocaleString('ar-EG')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleInvalidateBid(b.id)}
                            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1 mx-auto"
                            title="إبطال المزايدة وإعادة السعر"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>إبطال</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectBidsAuction(null)}
                className="py-2 px-6 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
