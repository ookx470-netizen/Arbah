import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Trash2, 
  MessageCircle, 
  ShieldAlert, 
  Zap, 
  Clock, 
  Users 
} from 'lucide-react';
import { User, GroupMessage } from '../types';
import { 
  sendGroupMessage, 
  subscribeToGroupMessages, 
  deleteGroupMessage 
} from '../firebaseService';

interface VipGroupChatProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VipGroupChat({ currentUser, isOpen, onClose }: VipGroupChatProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time group chat messages
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToGroupMessages((msgs) => {
      setMessages(msgs);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !currentUser) return;

    const textToSend = textInput.trim();
    setTextInput('');
    setSending(true);

    try {
      const userTier = currentUser.role === 'admin' ? 'مدير المنصة' : (currentUser.vipTier || 'الباقة العادية');
      await sendGroupMessage(
        currentUser.id,
        currentUser.username || 'عضو VIP',
        currentUser.phone,
        textToSend,
        userTier
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (currentUser?.role !== 'admin') return;
    try {
      await deleteGroupMessage(msgId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const getBadgeStyle = (tier: string) => {
    const t = (tier || '').trim();
    if (t.includes('مدير') || t.includes('admin') || t.includes('المدير')) {
      return 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold border border-rose-500 shadow-sm';
    }
    if (t === 'light') return 'bg-slate-100 text-slate-800 border border-slate-200';
    if (t === 'A1') return 'bg-blue-50 text-blue-600 border border-blue-200';
    if (t === 'A2') return 'bg-indigo-50 text-indigo-600 border border-indigo-200';
    if (t === 'B1') return 'bg-purple-50 text-purple-600 border border-purple-200';
    if (t === 'B2') return 'bg-violet-50 text-violet-600 border border-violet-200';
    if (t === 'C1') return 'bg-pink-50 text-pink-600 border border-pink-200';
    if (t === 'C2') return 'bg-rose-50 text-rose-600 border border-rose-200';
    if (t === 'D1') return 'bg-amber-50 text-amber-600 border border-amber-200';
    if (t === 'D2') return 'bg-yellow-50 text-yellow-600 border border-yellow-200';
    if (t === 'business') return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border border-amber-400 font-extrabold shadow-sm';
    
    return 'bg-stone-100 text-stone-600 border border-stone-200';
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md h-full sm:h-[600px] bg-stone-50 flex flex-col shadow-2xl overflow-hidden sm:rounded-2xl border border-stone-200"
          >
            {/* Header */}
            <div className="bg-white border-b border-stone-200 px-4 py-3.5 flex items-center justify-between shadow-sm">
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-right">
                <div>
                  <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5 justify-end">
                    <span>كروب دردشة المشتركين VIP</span>
                    <MessageCircle className="w-4 h-4 text-blue-600 fill-blue-100" />
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold flex items-center gap-1 justify-end mt-0.5">
                    <span>مساحة نقاش آمنة ومغلقة للأعضاء والمدير</span>
                    <Users className="w-3 h-3 text-stone-400" />
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Header for Normal view */}
            <div className="bg-blue-50/70 border-b border-blue-100 px-4 py-2 text-center text-[10px] font-bold text-blue-700 flex items-center justify-center gap-1.5">
              <span>تنبيه: الكروب خاص بالمشتركين فقط للتحدث وتبادل الخبرات</span>
              <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-200 animate-pulse" />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-stone-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                  <MessageCircle className="w-12 h-12 text-stone-300 stroke-[1.5]" />
                  <p className="text-xs font-bold text-stone-400">لا توجد رسائل حالياً</p>
                  <p className="text-[10px] text-stone-400">كن أول من يرسل رسالة في الكروب الجماعي!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMyMessage = msg.userId === currentUser?.id;
                  const isAdminMessage = msg.vipTier.includes('مدير') || msg.vipTier.includes('admin') || msg.vipTier.includes('المدير');

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isMyMessage ? 'items-start' : 'items-end'}`}
                    >
                      {/* Message Bubble Container */}
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm border relative group ${
                        isMyMessage 
                          ? 'bg-blue-600 text-white border-blue-600 rounded-tl-none text-left' 
                          : isAdminMessage
                            ? 'bg-rose-50 text-stone-900 border-rose-200 rounded-tr-none text-right'
                            : 'bg-white text-stone-900 border-stone-200 rounded-tr-none text-right'
                      }`}>
                        
                        {/* Header Details (sender & tier) */}
                        <div className="flex items-center gap-1.5 mb-1 flex-row-reverse">
                          <span className={`text-[9px] font-black ${isMyMessage ? 'text-blue-100' : 'text-stone-800'}`}>
                            {msg.username}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black scale-90 ${getBadgeStyle(msg.vipTier)}`}>
                            {msg.vipTier}
                          </span>
                        </div>

                        {/* Message Text */}
                        <p className={`text-xs leading-relaxed whitespace-pre-wrap font-medium break-words ${
                          isMyMessage ? 'text-white' : 'text-stone-800'
                        }`}>
                          {msg.text}
                        </p>

                        {/* Timestamp & Actions */}
                        <div className={`mt-1.5 flex items-center gap-2 text-[8px] font-bold justify-end ${
                          isMyMessage ? 'text-blue-200' : 'text-stone-400'
                        }`}>
                          {formatTime(msg.timestamp)}
                          <Clock className="w-2.5 h-2.5 scale-90" />
                          
                          {/* Trash button for Admins */}
                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-full transition-all border border-rose-100 active:scale-90 ml-1"
                              title="حذف الرسالة من قبل الإدارة"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Footer */}
            <form 
              onSubmit={handleSendMessage}
              className="bg-white border-t border-stone-200 p-3 flex gap-2 items-center"
            >
              <button
                type="submit"
                disabled={sending || !textInput.trim()}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-stone-100 disabled:text-stone-300 text-white rounded-xl transition-all active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="اكتب رسالتك للأعضاء هنا..."
                className="flex-1 px-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-600 text-right text-stone-900"
                maxLength={500}
                disabled={sending}
              />
            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
