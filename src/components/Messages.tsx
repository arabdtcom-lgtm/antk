import React, { useState, useEffect } from 'react';
import { User, Auction } from '../types';
import { Mail, Edit, Inbox, ArrowLeft, Send } from 'lucide-react';

export interface Message {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  auctionId?: string;
}

interface MessagesProps {
  user: User;
  lang: 'ar' | 'en';
  auctions: Auction[];
}

export default function Messages({ user, lang, auctions }: MessagesProps) {
  const isRTL = lang === 'ar';
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  
  // Compose form state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('antkawy_messages');
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse messages', e);
      }
    }
  }, []);

  const saveMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem('antkawy_messages', JSON.stringify(newMessages));
  };

  const userMessages = messages.filter(m => m.toEmail === user.email || m.fromEmail === user.email).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const handleSelectMessage = (id: string) => {
    setSelectedMsgId(id);
    setIsComposing(false);
    
    // Mark as read
    const msgIndex = messages.findIndex(m => m.id === id);
    if (msgIndex !== -1 && !messages[msgIndex].read && messages[msgIndex].toEmail === user.email) {
      const updated = [...messages];
      updated[msgIndex] = { ...updated[msgIndex], read: true };
      saveMessages(updated);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      fromEmail: user.email,
      fromName: user.name,
      toEmail: composeTo,
      subject: composeSubject,
      body: composeBody,
      timestamp: new Date().toISOString(),
      read: false,
    };

    saveMessages([newMessage, ...messages]);
    setIsComposing(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setSelectedMsgId(newMessage.id);
  };

  const selectedMsg = userMessages.find(m => m.id === selectedMsgId);

  // Extract unique sellers from auctions to use as recipients
  const defaultSellers = ['arabdt.com@gmail.com', 'taher@antkawy.com', 'admin@antkawy.com'];
  const auctionSellers = auctions.map(a => a.sellerEmail || (a.seller as any)?.email).filter((e): e is string => Boolean(e));
  const sellers = Array.from(new Set([...auctionSellers, ...defaultSellers])).filter(email => email !== user.email);

  return (
    <div className={`mx-auto max-w-5xl px-4 py-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Inbox className="w-6 h-6 text-amber-500" />
          {isRTL ? 'الرسائل الخاصة' : 'Private Messages'}
        </h2>
        <button
          onClick={() => { setIsComposing(true); setSelectedMsgId(null); }}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Edit className="w-4 h-4" />
          {isRTL ? 'رسالة جديدة' : 'New Message'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-[600px]">
        {/* Left Panel: Inbox List */}
        <div className={`w-full md:w-1/3 bg-[#0d0d0f] border border-white/10 rounded-xl overflow-hidden flex flex-col ${selectedMsgId || isComposing ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-white/10 bg-[#161618]">
            <h3 className="text-white font-semibold">{isRTL ? 'البريد الوارد' : 'Inbox'}</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {userMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{isRTL ? 'لا توجد رسائل' : 'No messages'}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {userMessages.map((msg, idx) => (
                  <button
                    key={`msg-${msg.id}-${idx}`}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`w-full text-start p-4 hover:bg-white/5 transition-colors ${selectedMsgId === msg.id ? 'bg-white/10' : ''} ${!msg.read && msg.toEmail === user.email ? 'border-l-2 border-l-amber-500' : ''}`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`font-medium truncate pr-2 ${!msg.read && msg.toEmail === user.email ? 'text-white' : 'text-slate-300'}`}>
                        {msg.fromEmail === user.email ? (isRTL ? 'إلى: ' : 'To: ') + msg.toEmail : msg.fromName || msg.fromEmail}
                      </span>
                      <span className="text-xs text-slate-500 shrink-0">
                        {new Date(msg.timestamp).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className={`text-sm truncate ${!msg.read && msg.toEmail === user.email ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>
                      {msg.subject}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Content / Compose */}
        <div className={`w-full md:w-2/3 bg-[#0d0d0f] border border-white/10 rounded-xl flex flex-col ${!selectedMsgId && !isComposing ? 'hidden md:flex' : 'flex'}`}>
          {!selectedMsgId && !isComposing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
              <Mail className="w-16 h-16 mb-4 opacity-20" />
              <p>{isRTL ? 'حدد رسالة للقراءتها' : 'Select a message to read'}</p>
            </div>
          ) : isComposing ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-white/10 bg-[#161618] flex items-center gap-3">
                <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsComposing(false)}>
                  <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
                <h3 className="text-white font-semibold">{isRTL ? 'رسالة جديدة' : 'New Message'}</h3>
              </div>
              <form onSubmit={handleSendMessage} className="p-6 flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">{isRTL ? 'إلى' : 'To'}</label>
                  <select 
                    value={composeTo} 
                    onChange={e => setComposeTo(e.target.value)}
                    className="w-full bg-[#161618] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    required
                  >
                    <option value="">{isRTL ? 'اختر مستلم...' : 'Select recipient...'}</option>
                    {sellers.map((email, idx) => (
                      <option key={`${email}-${idx}`} value={email}>{email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">{isRTL ? 'الموضوع' : 'Subject'}</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    className="w-full bg-[#161618] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-slate-400 text-sm mb-1">{isRTL ? 'الرسالة' : 'Message'}</label>
                  <textarea
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                    className="w-full flex-1 bg-[#161618] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
                    required
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors">
                    <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                    {isRTL ? 'إرسال' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedMsg ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-white/10 bg-[#161618] flex items-center gap-3">
                <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSelectedMsgId(null)}>
                  <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{selectedMsg.subject}</h3>
                  <div className="text-sm text-slate-400 mt-1 flex justify-between">
                    <span>
                      {selectedMsg.fromEmail === user.email ? 
                        <>{isRTL ? 'إلى: ' : 'To: '} <span className="text-amber-500">{selectedMsg.toEmail}</span></> : 
                        <>{isRTL ? 'من: ' : 'From: '} <span className="text-amber-500">{selectedMsg.fromName || selectedMsg.fromEmail}</span></>}
                    </span>
                    <span>{new Date(selectedMsg.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 text-slate-300 whitespace-pre-wrap flex-1 overflow-y-auto">
                {selectedMsg.body}
              </div>
              {selectedMsg.fromEmail !== user.email && (
                <div className="p-4 border-t border-white/10 bg-[#161618]">
                  <button 
                    onClick={() => {
                      setComposeTo(selectedMsg.fromEmail);
                      setComposeSubject((isRTL ? 'رد: ' : 'Re: ') + selectedMsg.subject);
                      setIsComposing(true);
                      setSelectedMsgId(null);
                    }}
                    className="border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    {isRTL ? 'رد' : 'Reply'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
