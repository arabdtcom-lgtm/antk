import React, { useState, useEffect } from 'react';
import { MessageCircle, HelpCircle, Send, Clock, Reply } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  isQuestion: boolean;
  reply?: string;
}

interface AuctionCommentsProps {
  auctionId: string;
  lang: 'ar' | 'en';
  user: User | null;
}

export default function AuctionComments({ auctionId, lang, user }: AuctionCommentsProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'questions'>('questions');
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  
  const STORAGE_KEY = 'antkawy_comments';

  useEffect(() => {
    loadComments();
  }, [auctionId]);

  const loadComments = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[auctionId]) {
          setComments(parsed[auctionId]);
        }
      }
    } catch (e) {
      console.error('Failed to load comments', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(lang === 'ar' ? 'يجب تسجيل الدخول لإضافة تعليق' : 'You must log in to post');
      return;
    }
    if (!inputText.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substring(2, 9),
      userId: user.id,
      userName: user.name || (lang === 'ar' ? 'مستخدم' : 'User'),
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      isQuestion: activeTab === 'questions'
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      
      const auctionComments = parsed[auctionId] || [];
      const updatedComments = [newComment, ...auctionComments];
      
      parsed[auctionId] = updatedComments;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      
      setComments(updatedComments);
      setInputText('');
    } catch (error) {
      console.error('Failed to save comment', error);
    }
  };

  const filteredComments = comments.filter(c => 
    activeTab === 'questions' ? c.isQuestion : !c.isQuestion
  );

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div dir={dir} className="bg-[#161618] border border-white/10 rounded-2xl overflow-hidden mt-8">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-lg transition-colors ${
            activeTab === 'questions' 
              ? 'bg-amber-500/10 text-amber-500 border-b-2 border-amber-500' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          {lang === 'ar' ? 'الأسئلة' : 'Questions'}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-lg transition-colors ${
            activeTab === 'comments' 
              ? 'bg-amber-500/10 text-amber-500 border-b-2 border-amber-500' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          {lang === 'ar' ? 'التعليقات' : 'Comments'}
        </button>
      </div>

      <div className="p-5">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeTab === 'questions' 
                  ? (lang === 'ar' ? 'اسأل البائع سؤالاً...' : 'Ask the seller a question...') 
                  : (lang === 'ar' ? 'اكتب تعليقك هنا...' : 'Write your comment here...')
              }
              className="w-full bg-[#0d0d0f] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 pr-12 rtl:pr-4 rtl:pl-12 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute top-1/2 -translate-y-1/2 right-2 rtl:right-auto rtl:left-2 p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-400 text-black rounded-lg transition-colors"
            >
              <Send className="w-5 h-5 rtl:-scale-x-100" />
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {lang === 'ar' 
                ? (activeTab === 'questions' ? 'لا توجد أسئلة بعد. كن أول من يسأل!' : 'لا توجد تعليقات بعد. كن أول من يعلق!') 
                : (activeTab === 'questions' ? 'No questions yet. Be the first to ask!' : 'No comments yet. Be the first to comment!')}
            </div>
          ) : (
            filteredComments.map((comment, index) => (
              <div key={`cmnt-${comment.id}-${index}`} className="bg-[#0d0d0f] rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-white">{comment.userName}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(comment.timestamp)}
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {comment.text}
                </p>

                {comment.reply && (
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Reply className="w-4 h-4 text-amber-500 rtl:-scale-x-100" />
                      <span className="font-bold text-amber-500 text-sm">
                        {lang === 'ar' ? 'رد البائع' : 'Seller Reply'}
                      </span>
                    </div>
                    <p className="text-amber-500/90 text-sm leading-relaxed">
                      {comment.reply}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
