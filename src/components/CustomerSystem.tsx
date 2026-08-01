/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Sparkles, 
  Phone, 
  Mail, 
  DollarSign, 
  Globe, 
  UserCheck, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Mic, 
  Image as ImageIcon, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  HelpCircle, 
  ShieldCheck, 
  Activity, 
  RefreshCw, 
  Volume2, 
  Copy,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { User, SupportTicket } from '../types';
import { formatPrice } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerSystemProps {
  currentUser: User | null;
  onRefreshUser: () => void;
  lang: 'ar' | 'en';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function CustomerSystem({ currentUser, onRefreshUser, lang }: CustomerSystemProps) {
  const isAr = lang === 'ar';
  
  // Tab/Mode state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(currentUser?.role === 'admin');
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'tickets' | 'multimodal'>('chat'); // For customer portal
  const [adminSubTab, setAdminSubTab] = useState<'clients' | 'tickets' | 'campaigns'>('clients'); // For admin CRM

  // Loading and feedback states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // CRM: Clients database list
  const [clients, setClients] = useState<User[]>([]);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [crmNotes, setCrmNotes] = useState<string>('');
  
  // CRM: Add New Client State
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'user' | 'admin',
    balance: 5000,
    preferredCurrency: 'SAR' as 'SAR' | 'USD' | 'EGP',
    preferredLanguage: 'ar' as 'ar' | 'en',
    notes: ''
  });

  // Helpdesk Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [newTicketCategory, setNewTicketCategory] = useState<string>('ضمان');
  const [newTicketMessage, setNewTicketMessage] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // AI Chat Assistant state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      text: isAr 
        ? 'مرحباً بك في مركز الدعم الذكي لمنصة أنتيكاوي! أنا مساعدك المدعوم بنظام Gemini الذكي لخدمتك وحماية ودائعك. كيف يمكنني إرشادك اليوم؟' 
        : 'Welcome to the أنتيكاوي Smart Helpdesk! I am your assistant, powered by Gemini. How can I assist you with bids, escrow, or shipping inquiries today?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Audio transcription features
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Multimodal image analyzer state
  const [appraisalImage, setAppraisalImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('');
  const [appraisalPrompt, setAppraisalPrompt] = useState<string>('');
  const [appraisalResult, setAppraisalResult] = useState<string>('');
  const [imageSizePreference, setImageSizePreference] = useState<'1K' | '2K' | '4K'>('1K');

  // AI Marketing Campaign generator state
  const [campaignSegment, setCampaignSegment] = useState<string>('عشاق الساعات الفاخرة والتحف الملوكية');
  const [campaignGoal, setCampaignGoal] = useState<string>('مشاركة وصول تشكيلة مزادات جديدة وحث العملاء على حجز ودائعهم والمزايدة');
  const [campaignDraft, setCampaignDraft] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Load clients and tickets on mount and interval
  useEffect(() => {
    fetchClients();
    fetchTickets();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/crm/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
      } else if (data.tickets) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  // Helper to show temporal notifications
  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const triggerError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

  // CRM: Save notes on selected client
  const handleSaveClientNotes = async (clientId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/crm/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: crmNotes })
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(isAr ? 'تم حفظ الملاحظات الإدارية للعميل بنجاح!' : 'Administrative notes updated successfully!');
        fetchClients();
        if (selectedClient && selectedClient.id === clientId) {
          setSelectedClient({ ...selectedClient, notes: crmNotes });
        }
      }
    } catch (err) {
      triggerError(isAr ? 'فشل تحديث السجل.' : 'Failed to save notes.');
    } finally {
      setIsLoading(false);
    }
  };

  // CRM: Add custom user
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/crm/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(isAr ? 'تم تسجيل ملف العميل الجديد بالنجاح!' : 'New client record created successfully!');
        fetchClients();
        setShowAddClientModal(false);
        setNewClientData({
          name: '',
          email: '',
          phone: '',
          role: 'user',
          balance: 5000,
          preferredCurrency: 'SAR',
          preferredLanguage: 'ar',
          notes: ''
        });
      } else {
        triggerError(data.messageAr || 'Error adding client');
      }
    } catch (err) {
      triggerError(isAr ? 'حدث خطأ بالاتصال.' : 'Communication error.');
    } finally {
      setIsLoading(false);
    }
  };

  // CRM: Remove client
  const handleDeleteClient = async (id: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من رغبتك في حذف هذا العميل من سجلات الـ CRM؟' : 'Are you sure you want to remove this client from CRM?')) return;
    try {
      const res = await fetch(`/api/crm/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(isAr ? 'تم إزالة سجل العميل.' : 'Client record removed.');
        if (selectedClient?.id === id) setSelectedClient(null);
        fetchClients();
      }
    } catch (err) {
      triggerError('Error deleting client');
    }
  };

  // Support: Submit Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketMessage) {
      triggerError(isAr ? 'يرجى كتابة الموضوع وشرح التفاصيل' : 'Please provide subject and message details');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        subject: `[${newTicketCategory}] - ${newTicketSubject}`,
        message: newTicketMessage,
        name: currentUser?.name || 'زائر العميل الفاخر',
        email: currentUser?.email || 'guest@client.com'
      };

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(isAr ? 'تم فتح تذكرة دعم فني جديدة بنجاح! يرجى انتظار رد المستشار.' : 'Helpdesk ticket generated successfully! Our admins will respond shortly.');
        setNewTicketSubject('');
        setNewTicketMessage('');
        fetchTickets();
      }
    } catch (err) {
      triggerError('Failed to generate ticket');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Helpdesk: Send Reply
  const handleSendTicketReply = async (ticketId: string) => {
    if (!replyText) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText })
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(isAr ? 'تم إرسال الرد وتحديث حالة تذكرة الدعم بنجاح!' : 'Ticket reply dispatched and status closed successfully!');
        setReplyText('');
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err) {
      triggerError('Error sending ticket reply');
    } finally {
      setIsLoading(false);
    }
  };

  // AI Chatbot: Send user query
  const handleSendChat = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    const userMsgId = `m_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setIsLoading(true);

    try {
      // Build conversation history to send to Gemini
      const conversationHistory = [...chatMessages, userMsg].slice(-8).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/crm/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          lang
        } )
      });
      const data = await res.json();
      
      const assistantMsg: ChatMessage = {
        id: `m_${Date.now()}_reply`,
        role: 'assistant',
        text: data.reply || (isAr ? 'تأخر الرد الفيدرالي لمركز الذكاء.' : 'Server connection delay.'),
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // AI Multimodal Appraiser: Process Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        setAppraisalImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunAppraisal = async () => {
    if (!appraisalImage) return;
    setIsLoading(true);
    setAppraisalResult('');
    try {
      const res = await fetch('/api/crm/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: appraisalImage,
          mimeType: imageMime,
          prompt: appraisalPrompt,
          imageSize: imageSizePreference,
          lang
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppraisalResult(data.analysis);
      } else {
        setAppraisalResult(data.analysis || 'Analysis failed');
      }
    } catch (err) {
      setAppraisalResult(isAr ? 'حدث خطأ أثناء فحص الصورة.' : 'Failed to inspect image.');
    } finally {
      setIsLoading(false);
    }
  };

  // AI Campaign: Generate promotional email template
  const handleGenerateCampaign = async () => {
    setIsLoading(true);
    setCampaignDraft('');
    try {
      const res = await fetch('/api/crm/ai-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment: campaignSegment,
          campaignGoal,
          lang
        })
      });
      const data = await res.json();
      if (data.success) {
        setCampaignDraft(data.text);
      } else {
        setCampaignDraft('Campaign generation failed.');
      }
    } catch (err) {
      setCampaignDraft('Error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            const base64Audio = reader.result.split(',')[1];
            setIsLoading(true);
            try {
              const res = await fetch('/api/crm/transcribe-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  base64Audio,
                  mimeType: 'audio/wav',
                  lang
                })
              });
              const data = await res.json();
              if (data.success && data.transcription) {
                setChatInput(data.transcription);
                triggerSuccess(isAr ? 'تم نسخ تسجيلك الصوتي بنجاح!' : 'Voice message transcribed successfully!');
              } else {
                triggerError(isAr ? 'لم نتمكن من التعرف على الصوت.' : 'Could not recognize voice.');
              }
            } catch (err) {
              triggerError('Transcription error');
            } finally {
              setIsLoading(false);
            }
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      triggerError(isAr ? 'يرجى منح صلاحية الميكروفون للنسخ الصوتي اللحظي.' : 'Please allow microphone permissions for live transcription.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCopyCampaign = () => {
    navigator.clipboard.writeText(campaignDraft);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // CRM Search filter
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4" id="crm_portal_main">
      
      {/* Upper Mode Switcher Banner */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl mb-8 shadow-xl">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="p-3 bg-amber-500 rounded-xl text-slate-900 shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isAr ? 'بوابة إدارة علاقات العملاء والدعم الفني الذكي' : 'Intelligent Client Hub & Helpdesk (CRM)'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'مركز موحد لخدمة العملاء، الودائع، الضمان والتسويق المدعوم بـ Gemini AI' : 'Unified customer support, escrow protections & AI-assisted campaign builder'}
            </p>
          </div>
        </div>

        {/* Portal Switching Controls */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setIsAdminMode(false)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${!isAdminMode ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            id="btn_mode_customer"
          >
            {isAr ? 'بوابة العميل الفاخر' : 'Premium Client Portal'}
          </button>
          <button
            onClick={() => {
              setIsAdminMode(true);
              fetchClients();
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${isAdminMode ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            id="btn_mode_admin"
          >
            {isAr ? 'لوحة تحكم CRM الإدارية' : 'Admin CRM Dashboard'}
          </button>
        </div>
      </div>

      {/* Action Toast Notifications */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-emerald-900/40 border border-emerald-500 text-emerald-100 rounded-xl flex items-center gap-3 text-sm"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
        {actionError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-rose-900/40 border border-rose-500 text-rose-100 rounded-xl flex items-center gap-3 text-sm"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= PORTAL VIEW 1: PREMIUM CUSTOMER PORTAL ======================= */}
      {!isAdminMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="client_portal_view">
          
          {/* Sidebar / Quick Navigation */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">
                {isAr ? 'أدوات المساعدة المباشرة' : 'Direct Assistance Tools'}
              </h3>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveSubTab('chat')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${activeSubTab === 'chat' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? 'مستشار المساعدة الذكي' : 'Gemini AI Assistant'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveSubTab('multimodal')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${activeSubTab === 'multimodal' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? 'تقييم الصور ومعاينة السلع' : 'Multimodal Image appraisal'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveSubTab('tickets')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${activeSubTab === 'tickets' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>{isAr ? 'تذاكر الدعم والطلبات' : 'Tickets & Inquiries'}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {tickets.filter(t => t.email === currentUser?.email).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Shield and Escrow Info Card */}
            <div className="bg-gradient-to-br from-amber-500/5 to-amber-600/15 border border-amber-500/20 rounded-2xl p-5 shadow-sm text-slate-800">
              <div className="flex items-center gap-2 text-amber-700 font-bold mb-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h4 className="text-sm">{isAr ? 'مظلة حماية الضمان (Escrow)' : 'Escrow Protection Shield'}</h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                {isAr 
                  ? 'جميع المشتريات ومبالغ المزادات يتم حجزها وتأمينها تلقائياً بالكامل في صندوق ودائع المنصة لضمان شحن السلعة واستلامها بحالتها المعاينة قبل تحريرها للبائع.'
                  : 'All buyout amounts & auction payments are strictly secured in an independent escrow deposit holding center to verify condition before releasing to the seller.'}
              </p>
            </div>
          </div>

          {/* Main Workspace Area (Sub-Tabs) */}
          <div className="lg:col-span-9">
            
            {/* SUB-TAB: CHAT ASSISTANT */}
            {activeSubTab === 'chat' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[650px]" id="client_support_chat">
                
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-400">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {isAr ? 'مستشار الدعم الفني والضمان الذكي' : 'Smart Gemini Helpdesk Specialist'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isAr ? 'نشط ومدرب للإجابة الفورية' : 'Active and certified for support'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setChatMessages([
                        {
                          id: 'init',
                          role: 'assistant',
                          text: isAr 
                            ? 'مرحباً بك مجدداً! كيف يمكنني مساعدتك اليوم؟' 
                            : 'Welcome back! How may I assist you with your luxury auctions today?',
                          timestamp: new Date()
                        }
                      ])}
                      className="p-2 text-slate-400 hover:text-slate-600 transition-all rounded-lg hover:bg-slate-100"
                      title={isAr ? 'مسح المحادثة' : 'Clear Chat'}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-50/40">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={`chat-${msg.id}-${idx}`}
                      className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${msg.role === 'user' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-400'}`}>
                        {msg.role === 'user' ? (currentUser?.name?.substring(0, 2) || 'Me') : 'AI'}
                      </div>
                      
                      <div className="flex flex-col">
                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'}`}>
                          {msg.text}
                        </div>
                        <span className={`text-[10px] text-slate-400 mt-1 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 self-start max-w-[80%]">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none text-slate-500 text-sm flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-150"></span>
                        <span>{isAr ? 'يقوم المستشار بصياغة الرد...' : 'Gemini is drafting an answer...'}</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Prompts Suggestions */}
                <div className="px-4 py-2 border-t border-slate-100 bg-white flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleSendChat(isAr ? 'كيف يعمل الضمان المالي في الموقع؟' : 'How does secure financial escrow work here?')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-all border border-slate-200"
                  >
                    💡 {isAr ? 'كيف يعمل الضمان المالي؟' : 'Escrow details'}
                  </button>
                  <button 
                    onClick={() => handleSendChat(isAr ? 'حدثني عن نظام تمديد الوقت ومكافحة القنص' : 'Tell me about anti-sniping bid timer extensions')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-all border border-slate-200"
                  >
                    ⏱️ {isAr ? 'تمديد المزاد ومكافحة القنص' : 'Anti-sniping defense'}
                  </button>
                  <button 
                    onClick={() => handleSendChat(isAr ? 'كيف يمكنني سداد قيمة السلعة المشحونة؟' : 'How can I checkout my won item?')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-all border border-slate-200"
                  >
                    💳 {isAr ? 'طريقة السداد والشحن' : 'Shipping and payment'}
                  </button>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex items-center gap-2">
                  
                  {/* Microphone Recorder Transcription */}
                  <button
                    type="button"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`p-3.5 rounded-xl transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    title={isAr ? 'اضغط مطولاً للتحدث' : 'Hold to speak (transcribe)'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder={isRecording ? (isAr ? 'جاري الاستماع لصوتك...' : 'Listening to your voice...') : (isAr ? 'اكتب استفسارك هنا...' : 'Type your support question...')}
                    disabled={isRecording}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                  />
                  
                  <button
                    onClick={() => handleSendChat()}
                    className="bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl transition-all font-semibold flex items-center justify-center shrink-0"
                  >
                    <Send className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* SUB-TAB: MULTIMODAL IMAGE APPRAISAL */}
            {activeSubTab === 'multimodal' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6" id="client_support_appraisal">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      {isAr ? 'الفحص المجهري المساعد وتقييم الصور (Gemini Multi-Modal)' : 'Physical Inspection Assistant (Multimodal Appraisal)'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr 
                        ? 'ارفع بوليصة الشحن، صورة السلعة المستلمة، أو تفاصيل العيوب لتقوم خوارزميات الذكاء الاصطناعي بفحص سلامتها وتقديم تقرير رصين.'
                        : 'Upload receipt, delivery package or item details to audit physical authenticity, verify state, and log appraisal metadata.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Controls */}
                  <div className="flex flex-col gap-4">
                    
                    {/* Size and Aspect presets */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <label className="text-xs font-bold text-slate-600 block mb-2">
                        {isAr ? 'دقة الصورة ومستوى الفحص' : 'Analysis Granularity / Size'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['1K', '2K', '4K'] as const).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setImageSizePreference(sz)}
                            className={`p-2 text-xs font-bold rounded-lg border text-center transition-all ${imageSizePreference === sz ? 'bg-slate-900 border-slate-900 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            {sz === '4K' ? `4K (Ultra)` : sz === '2K' ? `2K (HD)` : `1K (Speed)`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Drag and Drop Box */}
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-amber-500 transition-all relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {appraisalImage ? (
                        <div className="flex flex-col items-center">
                          <img 
                            src={`data:${imageMime};base64,${appraisalImage}`} 
                            alt="Preview" 
                            className="max-h-40 rounded-lg shadow-md mb-2 object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-xs text-amber-600 font-bold">
                            {isAr ? 'تم تحميل الصورة للمعاينة!' : 'Image loaded successfully!'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                          <p className="text-sm font-semibold text-slate-600">
                            {isAr ? 'اسحب الصورة هنا أو اضغط للتصفح' : 'Drag image here or click to browse'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {isAr ? 'يدعم الصور حتى دقة 4K للفحص الدقيق للسلع' : 'Supports item receipts or physical package images'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Instruction Prompt */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {isAr ? 'توجيه محدد للمستشار (اختياري)' : 'Custom Appraisal Direction (Optional)'}
                      </label>
                      <textarea
                        value={appraisalPrompt}
                        onChange={(e) => setAppraisalPrompt(e.target.value)}
                        placeholder={isAr ? 'مثال: افحص ساعة رولكس هذه وتأكد من سلامة العقارب وتطابق ألوان الميناء...' : 'e.g. Inspect this Rolex crown and dial for defects or authentication checks...'}
                        rows={3}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <button
                      onClick={handleRunAppraisal}
                      disabled={!appraisalImage || isLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{isAr ? 'جاري الفحص المجهري بالذكاء...' : 'Auditing photo parameters...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>{isAr ? 'إجراء فحص السلعة المعروضة' : 'Analyze Physical Integrity'}</span>
                        </>
                      )}
                    </button>

                  </div>

                  {/* Right Appraisal Result */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col min-h-[300px]">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b">
                      {isAr ? 'التقرير الفني ومستند التقييم المباشر' : 'AI Inspection & Appraisal Certificate'}
                    </h4>
                    
                    {appraisalResult ? (
                      <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line flex-1 overflow-y-auto">
                        {appraisalResult}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                        <FileText className="w-8 h-8" />
                        <p className="text-xs">
                          {isAr 
                            ? 'بانتظار رفع صورتك والنقر على زر بدء فحص السلعة...' 
                            : 'Awaiting image selection and appraisal execution.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: TICKETS MANAGEMENT */}
            {activeSubTab === 'tickets' && (
              <div className="flex flex-col gap-6" id="client_support_tickets">
                
                {/* Submit Ticket Section */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? 'إنشاء تذكرة دعم مالي أو شكوى جديدة' : 'Submit a Support Ticket / Dispute'}</span>
                  </h3>
                  
                  <form onSubmit={handleSubmitTicket} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        {isAr ? 'موضوع الاستفسار أو الشكوى' : 'Inquiry / Problem Subject'}
                      </label>
                      <input
                        type="text"
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        placeholder={isAr ? 'مثال: مشكلة في استلام شحنة رولكس...' : 'e.g. Issue retrieving Rolex shipment'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        {isAr ? 'تصنيف الطلب الفيدرالي' : 'Support Segment Category'}
                      </label>
                      <select
                        value={newTicketCategory}
                        onChange={(e) => setNewTicketCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="ضمان">{isAr ? 'حماية الضمان والودائع (Escrow)' : 'Escrow Deposit Protection'}</option>
                        <option value="شحن">{isAr ? 'تتبع اللوجستيات والشحن' : 'Logistics and Shipping'}</option>
                        <option value="مزايدة">{isAr ? 'المزايدات وقوانين المنصة' : 'Bidding Rules and Constraints'}</option>
                        <option value="تقنية">{isAr ? 'صعوبات تقنية بالمحفظة' : 'Technical / Wallet Malfunction'}</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        {isAr ? 'التفاصيل والشرح الوافي' : 'Detailed Narrative Statement'}
                      </label>
                      <textarea
                        value={newTicketMessage}
                        onChange={(e) => setNewTicketMessage(e.target.value)}
                        placeholder={isAr ? 'اشرح بالتفصيل ليقوم المشرف والذكاء الفني بمطابقة طلبك...' : 'Describe in full details...'}
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-xl text-xs transition-all flex items-center gap-2"
                      >
                        {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isAr ? 'إرسال التذكرة للأمانة الإدارية' : 'Submit Secured Ticket'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Tickets list */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">
                    {isAr ? 'تذاكري وطلباتي المقدمة السابقة' : 'My Filed Helpdesk Tickets'}
                  </h3>

                  {tickets.filter(t => t.email === currentUser?.email).length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">{isAr ? 'ليس لديك تذاكر دعم مفتوحة حالياً.' : 'No helpdesk tickets generated for this user.'}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {tickets
                        .filter(t => t.email === currentUser?.email)
                        .map((ticket, tIdx) => (
                          <div 
                            key={`usrtkt-${ticket.id}-${tIdx}`}
                            className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-all flex flex-col md:flex-row justify-between gap-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-slate-800 text-xs">
                                  {ticket.subject}
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${ticket.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : ticket.status === 'closed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>
                                  {ticket.status === 'answered' ? (isAr ? 'تم الرد والاستجابة' : 'Answered') : ticket.status === 'closed' ? (isAr ? 'مغلق ومؤرشف' : 'Archived') : (isAr ? 'قيد المراجعة الإدارية' : 'Open for review')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {ticket.message}
                              </p>
                              
                              {ticket.reply && (
                                <div className="mt-3 bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                                  <div className="flex items-center gap-1.5 text-slate-900 font-bold mb-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{isAr ? 'رد الأمانة الإدارية والمستشار:' : 'Admin & Helpdesk Response:'}</span>
                                  </div>
                                  <p>{ticket.reply}</p>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 self-end md:self-start">
                              {new Date(ticket.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      ) : (
        /* ======================= PORTAL VIEW 2: ADMIN CRM DASHBOARD ======================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="admin_crm_view">
          
          {/* CRM Upper metrics bar */}
          <div className="lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase">{isAr ? 'إجمالي العملاء' : 'Total CRM Leads'}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{clients.length}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase">{isAr ? 'تذاكر مفتوحة' : 'Active Tickets'}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {tickets.filter(t => t.status === 'open').length}
                </h3>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase">{isAr ? 'معدل الرضا' : 'Satisfaction Rate'}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">98.4%</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase">{isAr ? 'زمن الاستجابة' : 'Avg Reply Speed'}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">~5 {isAr ? 'دقائق' : 'mins'}</h3>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Left Panel: Administration Navigation */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3 uppercase border-b border-slate-800 pb-2">
                {isAr ? 'قنوات تتبع الإدارة والعملاء' : 'CRM Outlets'}
              </h3>
              
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setAdminSubTab('clients')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${adminSubTab === 'clients' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{isAr ? 'سجلات العملاء والملفات الشخصية' : 'Manage Client Profiles'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setAdminSubTab('tickets')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${adminSubTab === 'tickets' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{isAr ? 'طابور تذاكر الدعم والشكاوى' : 'Resolve Tickets queue'}</span>
                  </div>
                  <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">
                    {tickets.filter(t => t.status === 'open').length}
                  </span>
                </button>

                <button
                  onClick={() => setAdminSubTab('campaigns')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${adminSubTab === 'campaigns' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? 'صياغة حملات تسويقية (Gemini)' : 'Smart AI Outreach Campaigns'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Audit Tips */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs leading-relaxed text-slate-500">
              <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'تثقيف لوحة التحكم الإدارية' : 'CRM Operational Tip'}</span>
              </h4>
              <p>
                {isAr 
                  ? 'يمكنك فحص ملف العميل وتحديث رصيد محفظته لمزايدة أعلى، كما يمكنك تسجيل ملاحظات CRM خاصة بالعميل مثل "عميل متميز يحب الأنتيك" لتظهر عند تقديم الدعم.'
                  : 'Update customer balances, check communication logs and update administrative behavioral CRM notes (like VIP status) to align better during resolution processes.'}
              </p>
            </div>
          </div>

          {/* Right Panel: Workspace content */}
          <div className="lg:col-span-9">
            
            {/* SUB-TAB 1: MANAGE CLIENTS */}
            {adminSubTab === 'clients' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6" id="admin_crm_clients">
                
                {/* Search & Add Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 border-b pb-4">
                  <div className="relative w-full md:w-72">
                    <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={isAr ? 'البحث بالاسم، البريد أو الهاتف...' : 'Search by name, email, phone...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'تسجيل عميل جديد' : 'Register New Client'}</span>
                  </button>
                </div>

                {/* Clients Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right md:text-right border-collapse">
                    <thead>
                      <tr className="border-b text-xs font-bold text-slate-400 text-right">
                        <th className="pb-3 text-right">{isAr ? 'العميل' : 'Client Identity'}</th>
                        <th className="pb-3 text-right">{isAr ? 'معلومات الاتصال' : 'Contacts'}</th>
                        <th className="pb-3 text-right">{isAr ? 'الرصيد المحفظي' : 'Wallet Balance'}</th>
                        <th className="pb-3 text-right">{isAr ? 'ملاحظات الأمان الإدارية' : 'CRM Notes'}</th>
                        <th className="pb-3 text-left">{isAr ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs text-slate-700">
                      {filteredClients.map((client, cIdx) => (
                        <tr key={`cli-${client.id}-${cIdx}`} className="hover:bg-slate-50/60 transition-all">
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <img 
                                src={client.avatar || 'https://images.unsplash.com/photo-1535713875000?w=150'} 
                                alt={client.name} 
                                className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-100"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold text-slate-900 text-sm block">{client.name}</span>
                                <span className="text-[10px] text-amber-600 font-bold tracking-wider uppercase">{client.role}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1 text-slate-600">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {client.email}
                              </span>
                              {client.phone && (
                                <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {client.phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 font-bold text-slate-900">
                            {formatPrice(client.balance, client.preferredCurrency, lang)}
                          </td>
                          <td className="py-3.5 text-slate-500 max-w-xs truncate">
                            {client.notes ? (
                              <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
                                {client.notes}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">{isAr ? 'لا توجد ملاحظات' : 'No notes'}</span>
                            )}
                          </td>
                          <td className="py-3.5 text-left">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedClient(client);
                                  setCrmNotes(client.notes || '');
                                }}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                title={isAr ? 'تحديث الملاحظات والملف' : 'Edit profile notes'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                title={isAr ? 'إزالة السجل' : 'Delete client'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Selected client detailed view drawer */}
                <AnimatePresence>
                  {selectedClient && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="mt-8 border border-amber-200 bg-amber-50/40 p-5 rounded-2xl relative"
                    >
                      <button
                        onClick={() => setSelectedClient(null)}
                        className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 text-sm font-bold"
                      >
                        × {isAr ? 'إغلاق' : 'Close'}
                      </button>

                      <div className="flex items-center gap-3 mb-4">
                        <img 
                          src={selectedClient.avatar} 
                          className="w-12 h-12 rounded-full object-cover" 
                          alt={selectedClient.name}
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">{selectedClient.name}</h4>
                          <p className="text-xs text-slate-400">{selectedClient.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mb-4">
                        <label className="text-xs font-bold text-slate-700 block">
                          {isAr ? 'تحديث الملاحظات الإدارية والسلوكية للعميل' : 'Update Customer Behavioral / CRM Notes'}
                        </label>
                        <textarea
                          value={crmNotes}
                          onChange={(e) => setCrmNotes(e.target.value)}
                          placeholder={isAr ? 'مثال: عميل عالي الأهمية، يفضل ساعات رولكس الذهبية، يتأخر بالدفع أحياناً...' : 'e.g. VIP client interested in luxury watches...'}
                          rows={3}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedClient(null)}
                          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          onClick={() => handleSaveClientNotes(selectedClient.id)}
                          disabled={isLoading}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-all flex items-center gap-1.5"
                        >
                          {isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                          <span>{isAr ? 'حفظ الملاحظات الإدارية' : 'Save CRM parameters'}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* SUB-TAB 2: DISPATCH TICKETS QUEUE */}
            {adminSubTab === 'tickets' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6" id="admin_crm_tickets">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      {isAr ? 'طابور مراجعة وحل تذاكر الدعم والنزاعات' : 'Resolving Helpdesk Tickets Queue'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr ? 'استعرض تذاكر العملاء المفتوحة، قدم الردود الإدارية ومكّن بروتوكول حماية الشحنات.' : 'Process submitted tickets, issue official resolution statements & update statuses.'}
                    </p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                    {tickets.filter(t => t.status === 'open').length} {isAr ? 'تذاكر معلقة' : 'Open'}
                  </span>
                </div>

                {tickets.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">{isAr ? 'لا توجد تذاكر دعم بالنظام حالياً.' : 'No support requests filed.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Tickets List on Left */}
                    <div className="md:col-span-5 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                      {tickets.map((t, tIdx) => (
                        <button
                          key={`admtkt-${t.id}-${tIdx}`}
                          onClick={() => {
                            setSelectedTicket(t);
                            setReplyText(t.reply || '');
                          }}
                          className={`w-full text-right p-3.5 rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${selectedTicket?.id === t.id ? 'bg-amber-500/10 border-amber-500 text-slate-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          <div className="flex justify-between items-center w-full gap-2">
                            <span className="font-bold text-slate-800 truncate max-w-[120px]">{t.subject}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${t.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {t.status === 'answered' ? (isAr ? 'تم الحل' : 'Resolved') : (isAr ? 'مفتوح' : 'Open')}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate w-full">{t.message}</p>
                          <span className="text-[9px] text-slate-400 self-start mt-1 font-mono">{t.name} ({t.email})</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Resolution Desk on Right */}
                    <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col min-h-[300px]">
                      {selectedTicket ? (
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{selectedTicket.subject}</h4>
                                <span className="text-[10px] text-slate-400">
                                  {isAr ? 'العميل المشتكي:' : 'Complainant identity:'} {selectedTicket.name} ({selectedTicket.email})
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">{new Date(selectedTicket.timestamp).toLocaleString()}</span>
                            </div>

                            <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 leading-relaxed mb-4">
                              {selectedTicket.message}
                            </div>

                            {/* Client profile note reference if present */}
                            {clients.find(c => c.email === selectedTicket.email)?.notes && (
                              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-900 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <div>
                                  <strong className="block">{isAr ? 'مذكرة الأمانة الإدارية (CRM Notes) لهذا العميل:' : 'Administrative Client Profile Notes:'}</strong>
                                  <span>{clients.find(c => c.email === selectedTicket.email)?.notes}</span>
                                </div>
                              </div>
                            )}

                            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                              {isAr ? 'اكتب قرار حل الشكوى / الرد الرسمي' : 'Write Official Resolution / Admin Statement'}
                            </label>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={isAr ? 'اكتب الرد الرسمي الذي سيتم إشعاره وتحديث حسابه به...' : 'Type support response...'}
                              rows={4}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>

                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                            <button
                              onClick={() => setSelectedTicket(null)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                            >
                              {isAr ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                              onClick={() => handleSendTicketReply(selectedTicket.id)}
                              disabled={isLoading || !replyText}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-all flex items-center gap-1.5"
                            >
                              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                              <span>{isAr ? 'إرسال الرد وحل الطلب' : 'Dispatch Resolution'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                          <MessageSquare className="w-8 h-8" />
                          <p className="text-xs">
                            {isAr 
                              ? 'يرجى تحديد تذكرة دعم معلقة من القائمة اليسرى للبدء بالحل والمراجعة...' 
                              : 'Select a pending helpdesk ticket from the left queue to resolve.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: AI OUTREACH CAMPAIGNS */}
            {adminSubTab === 'campaigns' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6" id="admin_crm_campaigns">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      {isAr ? 'صانع الحملات والرسائل الترويجية الذكي (Gemini AI Campaigns)' : 'Intelligent Outbound Campaigns Copywriter (Gemini AI)'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr 
                        ? 'استخدم قوة الذكاء الاصطناعي لصياغة مراسلات تسويقية وعروض ترويجية فخمة لعملائك المميّزين ومستثمري المزاد بضغطة زر.'
                        : 'Generate highly personalized, high-value outreach email draft configurations for specific client tiers.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Parameter Inputs */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {isAr ? 'فئة العملاء المستهدفة (CRM Segmentation)' : 'Target Client Segment'}
                      </label>
                      <input
                        type="text"
                        value={campaignSegment}
                        onChange={(e) => setCampaignSegment(e.target.value)}
                        placeholder={isAr ? 'مثال: عشاق الساعات السويسرية والتحف الفخمة...' : 'e.g. VIP clients interested in Swiss Watches'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {isAr ? 'الهدف التسويقي من الحملة' : 'Campaign Conversion Goal'}
                      </label>
                      <textarea
                        value={campaignGoal}
                        onChange={(e) => setCampaignGoal(e.target.value)}
                        placeholder={isAr ? 'مثال: دعوتهم للمزايدة على رولكس عسلي والتعريف بنظام حماية الضمان والودائع لدينا...' : 'e.g. Invite them to bid on the Rolex with secured escrow highlight'}
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <button
                      onClick={handleGenerateCampaign}
                      disabled={isLoading || !campaignSegment || !campaignGoal}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{isAr ? 'جاري صياغة الحملة بالذكاء الفيدرالي...' : 'Writing luxury outreach draft...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>{isAr ? 'توليد مسودة الحملة التسويقية' : 'Generate Campaign outreach copy'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Draft Workspace */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {isAr ? 'المسودة التسويقية الفاخرة' : 'Luxurious Campaign Draft Output'}
                      </h4>
                      {campaignDraft && (
                        <button
                          onClick={handleCopyCampaign}
                          className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-all"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy')}</span>
                        </button>
                      )}
                    </div>

                    {campaignDraft ? (
                      <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line flex-1 overflow-y-auto font-sans">
                        {campaignDraft}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                        <p className="text-xs">
                          {isAr 
                            ? 'بانتظار تهيئة البارامترات والضغط لتوليد المسودة بالذكاء...' 
                            : 'Adjust parameters and click Generate to construct a luxury outreach campaign copy.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* MODAL: ADD CLIENT MODAL */}
      <AnimatePresence>
        {showAddClientModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">
                {isAr ? 'تسجيل حساب وملف عميل جديد بـ CRM' : 'Register New CRM Client Profile'}
              </h3>

              <form onSubmit={handleAddClient} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">{isAr ? 'الاسم بالكامل' : 'Client Full Name'}</label>
                    <input
                      type="text"
                      required
                      value={newClientData.name}
                      onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                    <input
                      type="email"
                      required
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
                    <input
                      type="text"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                      placeholder="+9665..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">{isAr ? 'الرصيد الافتتاحي المحفظي' : 'Initial Wallet Balance'}</label>
                    <input
                      type="number"
                      value={newClientData.balance}
                      onChange={(e) => setNewClientData({ ...newClientData, balance: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">{isAr ? 'رول / رتبة' : 'System Role'}</label>
                    <select
                      value={newClientData.role}
                      onChange={(e) => setNewClientData({ ...newClientData, role: e.target.value as 'user' | 'admin' })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none"
                    >
                      <option value="user">{isAr ? 'مشتري / مستخدم عادي' : 'Standard User'}</option>
                      <option value="admin">{isAr ? 'مشرف إداري' : 'Administrator'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">{isAr ? 'العملة المفضلة' : 'Currency'}</label>
                    <select
                      value={newClientData.preferredCurrency}
                      onChange={(e) => setNewClientData({ ...newClientData, preferredCurrency: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none"
                    >
                      <option value="SAR">SAR</option>
                      <option value="USD">USD</option>
                      <option value="EGP">EGP</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">{isAr ? 'اللغة المفضلة' : 'Language'}</label>
                    <select
                      value={newClientData.preferredLanguage}
                      onChange={(e) => setNewClientData({ ...newClientData, preferredLanguage: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">{isAr ? 'الملاحظات الأولية للـ CRM' : 'Initial CRM notes'}</label>
                  <textarea
                    value={newClientData.notes}
                    onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-all flex items-center gap-1.5"
                  >
                    {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isAr ? 'إضافة عميل جديد' : 'Register CRM Lead'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
