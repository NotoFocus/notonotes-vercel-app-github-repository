import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Brain, MessageSquare, Send, Compass, Check, Plus, Coins, Activity, Loader2, ChevronRight, Copy, ArrowLeft, Trash2, HelpCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { generateId } from '../utils';
import { Task } from '../types';

interface AICompanionScreenProps {
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface SuggestedTask {
  title: string;
  notes: string;
  repeat: 'daily' | 'once';
  isDiscipline: boolean;
}

export default function AICompanionScreen({ onBack }: AICompanionScreenProps) {
  const { notes, tasks, moods, streak, lang, addTask, savingsTarget, savingsBalance, transactions } = useAppStore();
  
  // Local screen states: 'chat' | 'advisor' | 'planner'
  const [activeTab, setActiveTab] = useState<'chat' | 'advisor' | 'planner'>('chat');
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('noto_ai_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Advisor States
  const [insight, setInsight] = useState<string>(() => {
    return localStorage.getItem('noto_ai_saved_insight') || '';
  });
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [advisorSection, setAdvisorSection] = useState<'eval' | 'mind' | 'challenge'>('eval');

  // Planner States
  const [plannerGoal, setPlannerGoal] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [isPlannerLoading, setIsPlannerLoading] = useState(false);
  const [addedTasksIds, setAddedTasksIds] = useState<string[]>([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save chat to localStorage
  useEffect(() => {
    localStorage.setItem('noto_ai_chat_history', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Trigger quick toast
  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to parse markdown-like strings from Gemini simply and beautifully
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null;
    
    // Split lines
    const lines = text.split('\n');
    return (
      <div className="space-y-2.5 text-slate-300 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          let trimmed = line.trim();
          
          // Headers
          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} className="text-sm font-extrabold text-indigo-400 mt-4 mb-2 tracking-tight flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-400 shrink-0" />
                {trimmed.replace('###', '').trim()}
              </h4>
            );
          }
          if (trimmed.startsWith('##')) {
            return (
              <h3 key={idx} className="text-base font-black text-slate-100 mt-5 mb-2 tracking-tight border-b border-slate-800/60 pb-1">
                {trimmed.replace('##', '').trim()}
              </h3>
            );
          }
          if (trimmed.startsWith('#')) {
            return (
              <h2 key={idx} className="text-lg font-black text-slate-50 mt-6 mb-3 tracking-tight">
                {trimmed.replace('#', '').trim()}
              </h2>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1 my-1 text-slate-300">
                <li>{parseBoldText(content)}</li>
              </ul>
            );
          }

          // Number lists
          const numMatch = trimmed.match(/^\d+\.\s(.*)/);
          if (numMatch) {
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-1 my-1 text-slate-300">
                <li>{parseBoldText(numMatch[1])}</li>
              </ol>
            );
          }

          // Empty line
          if (trimmed === '') return <div key={idx} className="h-2" />;

          // Default paragraph
          return <p key={idx}>{parseBoldText(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Helper to parse bold syntax **text** inside line
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-indigo-300">{part}</strong>;
      }
      return part;
    });
  };

  // Helper to structure context for advisor analysis
  const getAppStatistics = () => {
    const notesCount = notes.filter(n => !n.isArchived).length;
    const tasksCount = tasks.filter(t => !t.deleted).length;
    const completedCount = tasks.filter(t => !t.deleted && t.completed).length;
    
    // Last 5 moods
    const sortedMoods = [...moods]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(m => m.mood)
      .filter(Boolean) as string[];

    // Savings ratio
    let savingsPercent = 0;
    if (savingsTarget && savingsTarget > 0) {
      savingsPercent = Math.min(100, Math.round((savingsBalance / savingsTarget) * 100));
    }

    return {
      notesCount,
      tasksCount,
      streak,
      completedCount,
      recentMoods: sortedMoods,
      savingsPercent
    };
  };

  // 1. Send Chat message
  const handleSendChat = async (inputStr = chatInput) => {
    const textToSend = inputStr.trim();
    if (!textToSend || isChatLoading) return;

    setChatInput('');
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          lang
        })
      });

      const data = await response.json();
      if (data.reply) {
        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          role: 'model',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, aiMsg]);
      } else if (data.error === 'missing_api_key') {
        showLocalToast(lang === 'id' ? '⚠️ API Key Gemini belum dipasang di Secrets!' : '⚠️ Gemini API Key not set in Secrets!');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (e) {
      console.error(e);
      showLocalToast(lang === 'id' ? '❌ Gagal menghubungi asisten AI' : '❌ Failed to reach AI Companion');
    } finally {
      setIsChatLoading(false);
    }
  };

  // 2. Generate Personal Insights
  const handleGenerateInsight = async () => {
    setIsInsightLoading(true);
    try {
      const response = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userContext: getAppStatistics(),
          lang
        })
      });

      const data = await response.json();
      if (data.insight) {
        setInsight(data.insight);
        localStorage.setItem('noto_ai_saved_insight', data.insight);
        showLocalToast(lang === 'id' ? '✨ Refleksi hidup baru berhasil dibuat!' : '✨ New lifestyle insight created!');
      } else if (data.error === 'missing_api_key') {
        showLocalToast(lang === 'id' ? '⚠️ API Key Gemini belum dipasang di Secrets!' : '⚠️ Gemini API Key not set in Secrets!');
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error(e);
      showLocalToast(lang === 'id' ? '❌ Gagal menghasilkan refleksi harian' : '❌ Failed to generate daily reflection');
    } finally {
      setIsInsightLoading(false);
    }
  };

  // 3. Brainstorm Suggested Tasks
  const handleSuggestTasks = async () => {
    if (!plannerGoal.trim() || isPlannerLoading) return;
    setIsPlannerLoading(true);
    setSuggestedTasks([]);
    setAddedTasksIds([]);

    try {
      const response = await fetch('/api/ai/suggest-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: plannerGoal.trim(),
          lang
        })
      });

      const data = await response.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        setSuggestedTasks(data.tasks);
      } else if (data.error === 'missing_api_key') {
        showLocalToast(lang === 'id' ? '⚠️ API Key Gemini belum dipasang di Secrets!' : '⚠️ Gemini API Key not set in Secrets!');
      } else {
        throw new Error(data.error || 'Failed to parse suggestions');
      }
    } catch (e) {
      console.error(e);
      showLocalToast(lang === 'id' ? '❌ Gagal memikirkan saran kebiasaan' : '❌ Failed to think of habit suggestions');
    } finally {
      setIsPlannerLoading(false);
    }
  };

  // 4. Actually Add Generated Tasks to Real App List
  const handleAddAllTasks = () => {
    if (suggestedTasks.length === 0) return;

    suggestedTasks.forEach((st) => {
      const todayIso = new Date().toISOString().split('T')[0];
      const newTask: Task = {
        id: 'ai-task-' + Math.random().toString(36).substring(2, 9),
        title: st.title,
        time: '08:00',
        date: lang === 'id' ? 'Hari ini' : 'Today',
        priority: st.isDiscipline ? 'Tinggi' : 'Sedang',
        completed: false,
        pinned: st.isDiscipline,
        repeat: st.repeat,
        completedDates: [],
        isDiscipline: st.isDiscipline,
        disciplineData: st.isDiscipline ? {
          dailyCheckins: [],
          journeyLog: [],
          milestones: [],
          startDate: todayIso
        } : undefined,
        createdAt: new Date().toISOString()
      };
      addTask(newTask);
    });

    showLocalToast(lang === 'id' 
      ? `✅ Berhasil menambahkan ${suggestedTasks.length} tugas ke Noto!` 
      : `✅ Added ${suggestedTasks.length} tasks to Noto!`);
    
    // Clear list to prevent re-adding
    setSuggestedTasks([]);
    setPlannerGoal('');
  };

  // Clear Chat History
  const clearChatHistory = () => {
    if (window.confirm(lang === 'id' ? 'Hapus semua riwayat percakapan?' : 'Clear all conversation history?')) {
      setChatMessages([]);
      localStorage.removeItem('noto_ai_chat_history');
    }
  };

  // Segment insight text if needed or just display complete formatted markdown
  // Let's divide the generated insight into 3 sections if we want tabbed viewing, or just render it all nicely.
  // Actually, rendering it all in a beautiful scrollable card is highly professional and easy to read! Let's do that.

  const stats = getAppStatistics();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-12 left-12 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-900 z-10 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-all active:scale-95 border border-slate-800/40"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Bot size={20} className="text-indigo-400 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-100">Noto AI Companion</h1>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {lang === 'id' ? 'Sahabat hidup & asisten kecerdasan pribadimu' : 'Your empathetic personal life companion'}
            </p>
          </div>
        </div>

        {activeTab === 'chat' && chatMessages.length > 0 && (
          <button 
            onClick={clearChatHistory}
            className="p-2 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
            title={lang === 'id' ? 'Bersihkan Chat' : 'Clear Chat'}
          >
            <Trash2 size={16} />
          </button>
        )}
      </header>

      {/* Dashboard Sub-Stats Banner (Horizontal & sleek) */}
      <div className="flex-none px-4 sm:px-6 py-2.5 bg-indigo-500/5 border-b border-slate-900/60 flex items-center justify-between text-xs overflow-x-auto gap-4 no-scrollbar z-10 select-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <Activity size={14} className="text-emerald-400" />
          <span className="text-slate-400">{lang === 'id' ? 'Streak:' : 'Streak:'}</span>
          <span className="font-extrabold text-slate-200">{stats.streak} {lang === 'id' ? 'hari' : 'days'} 🔥</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Check size={14} className="text-indigo-400" />
          <span className="text-slate-400">{lang === 'id' ? 'Selesai:' : 'Done:'}</span>
          <span className="font-extrabold text-slate-200">{stats.completedCount} / {stats.tasksCount}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Coins size={14} className="text-amber-400" />
          <span className="text-slate-400">{lang === 'id' ? 'Tabungan:' : 'Saved:'}</span>
          <span className="font-extrabold text-slate-200">{stats.savingsPercent}%</span>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex-none p-3 border-b border-slate-900/60 z-10 flex gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'chat' 
              ? 'bg-indigo-600 text-slate-50 shadow-lg shadow-indigo-600/10' 
              : 'bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/20'
          }`}
        >
          <MessageSquare size={14} />
          <span>{lang === 'id' ? 'Teman Diskusi' : 'Chat Companion'}</span>
        </button>

        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'advisor' 
              ? 'bg-indigo-600 text-slate-50 shadow-lg shadow-indigo-600/10' 
              : 'bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/20'
          }`}
        >
          <Brain size={14} />
          <span>{lang === 'id' ? 'Refleksi Hidup' : 'Life Reflection'}</span>
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'planner' 
              ? 'bg-indigo-600 text-slate-50 shadow-lg shadow-indigo-600/10' 
              : 'bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/20'
          }`}
        >
          <Compass size={14} />
          <span>{lang === 'id' ? 'Rencana Aksi' : 'Action Planner'}</span>
        </button>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 flex flex-col justify-between">
        
        {/* TAB 1: INTERACTIVE CHAT COMPANION */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col justify-between h-full">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto select-none">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                  <Bot size={32} className="animate-bounce" />
                </div>
                <h3 className="text-base font-extrabold text-slate-100 tracking-tight">
                  {lang === 'id' ? 'Mulai Percakapan Hangat' : 'Start a Warm Conversation'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                  {lang === 'id' 
                    ? 'Tanyakan apa saja, mulailah berdiskusi mengenai target hidup, atau sekadar bagikan keluh kesah harianmu bersama Noto.'
                    : 'Ask anything, brainstorm life targets, or simply vent about your day. Noto AI is always here to listen.'}
                </p>

                {/* Suggestions triggers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full mt-6">
                  {[
                    lang === 'id' ? 'Bantu susun rencana olahraga pagi 🏃' : 'Help plan a morning workout routine 🏃',
                    lang === 'id' ? 'Tips hemat uang agar tabunganku cepat penuh 💸' : 'Money-saving tips for my target balance 💸',
                    lang === 'id' ? 'Cara disiplin menulis jurnal harian 📝' : 'How to stay consistent with journaling 📝',
                    lang === 'id' ? 'Berikan kata-kata motivasi penambah semangat ✨' : 'Give me a powerful motivational quote ✨'
                  ].map((suggest, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChat(suggest)}
                      className="text-left text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800/60 hover:border-indigo-500/40 p-3 rounded-xl text-slate-300 hover:text-indigo-300 transition-all text-ellipsis overflow-hidden"
                    >
                      {suggest}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-4 flex-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-200`}
                  >
                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-3.5 ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-slate-50 rounded-br-none shadow-md shadow-indigo-600/10' 
                        : 'bg-slate-900 border border-slate-850/80 text-slate-100 rounded-bl-none'
                    }`}>
                      <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className="mt-1 flex justify-end">
                        <span className={`text-[9px] ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'} font-bold`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl rounded-bl-none p-3.5 flex items-center gap-2">
                      <Loader2 size={14} className="text-indigo-400 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Noto AI is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Chat Input Footer */}
            <div className="mt-auto flex-none flex gap-2 pt-2 bg-slate-950">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChat();
                }}
                placeholder={lang === 'id' ? 'Tulis pesan untuk Noto AI...' : 'Type a message to Noto AI...'}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                disabled={isChatLoading}
              />
              <button
                onClick={() => handleSendChat()}
                disabled={isChatLoading || !chatInput.trim()}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                  chatInput.trim() && !isChatLoading 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-slate-50 cursor-pointer active:scale-95' 
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800/40'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: AI ADVISOR & DAILY REFLECTION */}
        {activeTab === 'advisor' && (
          <div className="flex-1 flex flex-col justify-between h-full">
            <div className="space-y-4 flex-1">
              {/* Context Summary card */}
              <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <h3 className="text-xs font-extrabold text-slate-100 tracking-tight">
                    {lang === 'id' ? 'Analisis Data Produktivitas & Mood' : 'Productivity & Mood Data Analyzer'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-md">
                    {lang === 'id' 
                      ? 'Gemini akan membaca jumlah catatan, streak harian, suasana hati terkini, dan progres keuangan untuk meramu refleksi harian eksklusif.'
                      : 'Gemini reviews your active notes count, habits streak, recent moods, and budget performance to generate an exclusive life reflection.'}
                  </p>
                </div>

                <button
                  onClick={handleGenerateInsight}
                  disabled={isInsightLoading}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-50 rounded-xl font-bold text-xs transition-colors active:scale-95 disabled:bg-slate-850 disabled:text-slate-600"
                >
                  {isInsightLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-slate-50" />
                      <span>{lang === 'id' ? 'Menganalisis...' : 'Analyzing...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>{lang === 'id' ? 'Ramu Refleksi Baru' : 'Generate Reflection'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Insight Render */}
              {isInsightLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center select-none bg-slate-900/10 border border-slate-900 border-dashed rounded-2xl">
                  <Loader2 size={24} className="text-indigo-400 animate-spin mb-4" />
                  <h4 className="text-xs font-bold text-slate-300">
                    {lang === 'id' ? 'Noto sedang membaca jurnal dan statistikmu...' : 'Noto is reading your journal and stats...'}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {lang === 'id' ? 'Membuat saran terbaik untuk hidupmu...' : 'Drafting the best mindfulness suggestions for you...'}
                  </p>
                </div>
              ) : insight ? (
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-inner relative">
                  {/* Decorative corner tag */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                    <Sparkles size={8} />
                    <span>Gemini Optimized</span>
                  </div>

                  <div className="prose max-w-none">
                    {renderFormattedMarkdown(insight)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 select-none border border-slate-900 border-dashed rounded-2xl">
                  <HelpCircle size={32} className="text-slate-600 mb-3" />
                  <h4 className="text-xs font-extrabold text-slate-300">
                    {lang === 'id' ? 'Belum Ada Refleksi Terbuat' : 'No Reflection Generated Yet'}
                  </h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-normal">
                    {lang === 'id'
                      ? 'Klik tombol di atas untuk memerintahkan AI Noto menganalisis data hidupmu hari ini.'
                      : 'Click the button above to command Noto AI to synthesize your lifestyle data today.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SMART GOAL & ACTION PLANNER */}
        {activeTab === 'planner' && (
          <div className="flex-1 flex flex-col justify-between h-full">
            <div className="space-y-4 flex-1">
              {/* Pitch input field */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl relative">
                <label className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block mb-2">
                  {lang === 'id' ? 'Apa impian atau target yang ingin dicapai?' : 'What is your current dream or goal?'}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={plannerGoal}
                    onChange={(e) => setPlannerGoal(e.target.value)}
                    placeholder={lang === 'id' ? 'e.g. Bangun jam 5 pagi, berhemat kopi, meditasi...' : 'e.g. Wake up at 5am, spend less on coffee, study more...'}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
                    disabled={isPlannerLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSuggestTasks();
                    }}
                  />
                  <button
                    onClick={handleSuggestTasks}
                    disabled={isPlannerLoading || !plannerGoal.trim()}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                      plannerGoal.trim() && !isPlannerLoading 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-slate-50 cursor-pointer active:scale-95' 
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {isPlannerLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin text-slate-50" />
                        <span>{lang === 'id' ? 'Rancang...' : 'Planning...'}</span>
                      </>
                    ) : (
                      <>
                        <Compass size={12} />
                        <span>{lang === 'id' ? 'Rancang Rencana' : 'Plan Actions'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestions results rendering */}
              {isPlannerLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/10 border border-slate-900 border-dashed rounded-2xl">
                  <Loader2 size={24} className="text-indigo-400 animate-spin mb-4" />
                  <h4 className="text-xs font-bold text-slate-300">
                    {lang === 'id' ? 'Merancang kebiasaan mikro untuk targetmu...' : 'Designing micro-habits for your target...'}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {lang === 'id' ? 'Membuat daftar tugas disiplin yang realistis...' : 'Formulating realistic discipline tasks...'}
                  </p>
                </div>
              ) : suggestedTasks.length > 0 ? (
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-xs font-extrabold text-slate-300">
                      {lang === 'id' ? 'Rekomendasi Kebiasaan Disiplin' : 'Recommended Discipline Habits'}
                    </h3>
                    <button
                      onClick={handleAddAllTasks}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-50 rounded-xl font-bold text-xs transition-colors active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/10"
                    >
                      <Plus size={12} />
                      <span>{lang === 'id' ? 'Ambil Semua ke Daftar Tugas' : 'Adopt All to My Tasks'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {suggestedTasks.map((t, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl relative overflow-hidden">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                              {t.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{t.notes}</p>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 items-end shrink-0">
                            <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md font-bold text-indigo-400 uppercase tracking-wider">
                              {t.repeat === 'daily' ? (lang === 'id' ? 'Harian' : 'Daily') : (lang === 'id' ? 'Satu Kali' : 'Once')}
                            </span>
                            {t.isDiscipline && (
                              <span className="text-[9px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md font-bold text-red-400 uppercase tracking-wider">
                                {lang === 'id' ? 'Disiplin Tinggi' : 'High Discipline'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 select-none border border-slate-900 border-dashed rounded-2xl">
                  <Compass size={32} className="text-slate-600 mb-3 animate-spin" style={{ animationDuration: '6s' }} />
                  <h4 className="text-xs font-extrabold text-slate-300">
                    {lang === 'id' ? 'Rancang Kebiasaan Suksesmu' : 'Plan Your Success Habits'}
                  </h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-normal">
                    {lang === 'id'
                      ? 'Tulis target impianmu di atas (misal: "kurangi makan junk food", "olahraga kardio") untuk dipecah oleh AI menjadi tugas harian konkret.'
                      : 'Input your target above (e.g. "stop junk food", "cardio workout") for the AI to break down into bite-sized daily tasks.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Local success Toast notification */}
      {toastMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 max-w-sm w-[90%] md:w-auto">
          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Check size={10} />
          </div>
          <p className="text-[11px] font-bold text-slate-200 leading-normal">
            {toastMessage}
          </p>
        </div>
      )}

    </div>
  );
}
