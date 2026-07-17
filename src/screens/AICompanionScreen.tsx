import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Trash2, ArrowLeft, ShieldAlert, Sparkles, AlertCircle, Check, HelpCircle, Lock, Shield, Eye, Flame, Wallet, CheckSquare, Smile, FileText, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { generateId } from '../utils';

interface AICompanionProps {
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isSystemPrompt?: boolean;
}

export default function AICompanionScreen({ onBack }: AICompanionProps) {
  const { notes, moods, transactions, tasks, streak, savingsBalance, savingsTarget, lang, tempNoteContext, setTempNoteContext, geminiApiKey } = useAppStore();
  const t = useTranslation(lang);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNoteAttachModal, setShowNoteAttachModal] = useState(false);

  // Daily AI Credits State
  const [creditsLeft, setCreditsLeft] = useState(10);
  const [todayStr] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Consent Modal State
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentType, setConsentType] = useState<'mood' | 'finance' | 'tasks' | null>(null);
  const [consentPayload, setConsentPayload] = useState<string>('');
  const [pendingPrompt, setPendingPrompt] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load and Reset Credits
  useEffect(() => {
    try {
      const storedDate = localStorage.getItem('noto_ai_credits_date');
      const storedCredits = localStorage.getItem('noto_ai_credits_left');

      if (storedDate === todayStr && storedCredits !== null) {
        setCreditsLeft(Number(storedCredits));
      } else {
        localStorage.setItem('noto_ai_credits_date', todayStr);
        localStorage.setItem('noto_ai_credits_left', '10');
        setCreditsLeft(10);
      }
    } catch (e) {
      console.error("Failed to load credits:", e);
    }
  }, [todayStr]);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('noto_ai_chat_history');
      if (savedHistory) {
        setMessages(JSON.parse(savedHistory));
      } else {
        // Welcome message
        const welcome: ChatMessage = {
          id: 'welcome',
          role: 'model',
          content: lang === 'id' 
            ? "Halo! Saya adalah Noto AI, asisten pribadi Anda. Saya dirancang khusus dengan filosofi **Privacy-First**. Saya tidak memiliki akses langsung ke data pribadi Anda. Anda memegang kendali penuh atas informasi apa pun yang dibagikan.\n\nTanyakan apa saja, atau gunakan pintasan analisis aman di bawah ini untuk memulai!"
            : "Hello! I am Noto AI, your personal life coach. I am fully built on Noto's **Privacy-First** philosophy. I have zero direct access to your local data—you have total control over what is shared.\n\nAsk me anything, or use the secure analysis shortcuts below to get started!",
          timestamp: Date.now()
        };
        setMessages([welcome]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [lang]);

  // Save chat history to localStorage
  const saveChatHistory = (history: ChatMessage[]) => {
    try {
      localStorage.setItem('noto_ai_chat_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const updateCredits = (newCount: number) => {
    setCreditsLeft(newCount);
    try {
      localStorage.setItem('noto_ai_credits_left', String(newCount));
    } catch (e) {}
  };

  // Compile Minimal Consent Payloads
  const getMoodPayload = () => {
    // Get last 7 days of moods
    const sortedMoods = [...moods]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    if (sortedMoods.length === 0) {
      return lang === 'id' 
        ? "Belum ada catatan mood dalam 7 hari terakhir." 
        : "No mood logs registered in the last 7 days.";
    }

    return sortedMoods.map(m => {
      const dateObj = new Date(m.date);
      const dayName = dateObj.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });
      const moodLabel = lang === 'id' 
        ? (m.mood === 'excellent' ? 'Sangat Senang' : m.mood === 'good' ? 'Senang' : m.mood === 'neutral' ? 'Biasa Saja' : m.mood === 'bad' ? 'Buruk' : 'Sangat Buruk')
        : (m.mood === 'excellent' ? 'Excellent' : m.mood === 'good' ? 'Good' : m.mood === 'neutral' ? 'Neutral' : m.mood === 'bad' ? 'Bad' : 'Terrible');
      return `- ${dayName}: ${moodLabel} ${m.note ? `("${m.note}")` : ''}`;
    }).join('\n');
  };

  const getFinancePayload = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const formattedIncome = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome);
    const formattedExpense = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense);
    const formattedSavings = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(savingsBalance);
    
    let targetText = lang === 'id' ? 'Tidak ada target aktif' : 'No active target';
    if (savingsTarget && savingsTarget > 0) {
      const percent = Math.min(100, Math.round((savingsBalance / savingsTarget) * 100));
      const formattedTarget = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(savingsTarget);
      targetText = `${formattedTarget} (${percent}% ${lang === 'id' ? 'tercapai' : 'achieved'})`;
    }

    return lang === 'id'
      ? `• Total Pemasukan Terdaftar: ${formattedIncome}\n• Total Pengeluaran Terdaftar: ${formattedExpense}\n• Saldo Tabungan Saat Ini: ${formattedSavings}\n• Target Tabungan: ${targetText}`
      : `• Total Registered Income: ${formattedIncome}\n• Total Registered Expenses: ${formattedExpense}\n• Current Savings Balance: ${formattedSavings}\n• Savings Target: ${targetText}`;
  };

  const getTasksPayload = () => {
    const activeTasks = tasks.filter(t => !t.completed && !t.deleted);
    const completedTasks = tasks.filter(t => t.completed && !t.deleted);
    const totalTasks = activeTasks.length + completedTasks.length;
    const rate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    return lang === 'id'
      ? `• Total Tugas Aktif: ${activeTasks.length}\n• Tugas Selesai: ${completedTasks.length}\n• Rasio Penyelesaian Tugas: ${rate}%\n• Streak Disiplin Harian: ${streak} hari`
      : `• Total Active Tasks: ${activeTasks.length}\n• Completed Tasks: ${completedTasks.length}\n• Task Completion Rate: ${rate}%\n• Daily Discipline Streak: ${streak} days`;
  };

  // Intercept prompts to check for consent triggers
  const handleSend = async (customPrompt?: string, customType?: 'mood' | 'finance' | 'tasks') => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend) return;

    if (creditsLeft <= 0) {
      setErrorMsg(lang === 'id' 
        ? "Kredit AI harian Anda telah habis (Maks 10 per hari). Kredit akan di-reset otomatis besok!" 
        : "Your daily AI credits are fully spent (Max 10 per day). Credits will automatically reset tomorrow!");
      return;
    }

    setErrorMsg(null);

    // If a quick shortcut is clicked OR we detect privacy indicators, trigger consent
    const lower = textToSend.toLowerCase();
    let detectedType: 'mood' | 'finance' | 'tasks' | null = customType || null;

    if (!detectedType) {
      if (lower.includes('mood') || lower.includes('emosi') || lower.includes('suasana hati') || lower.includes('perasaan')) {
        detectedType = 'mood';
      } else if (lower.includes('keuangan') || lower.includes('duit') || lower.includes('finansial') || lower.includes('tabungan') || lower.includes('pemasukan') || lower.includes('pengeluaran') || lower.includes('finance')) {
        detectedType = 'finance';
      } else if (lower.includes('tugas') || lower.includes('task') || lower.includes('disiplin') || lower.includes('streak') || lower.includes('produktif') || lower.includes('productivity')) {
        detectedType = 'tasks';
      }
    }

    if (detectedType) {
      // Setup consent modal
      setConsentType(detectedType);
      setPendingPrompt(textToSend);
      if (detectedType === 'mood') {
        setConsentPayload(getMoodPayload());
      } else if (detectedType === 'finance') {
        setConsentPayload(getFinancePayload());
      } else {
        setConsentPayload(getTasksPayload());
      }
      setShowConsentModal(true);
      return;
    }

    // Normal chat message
    if (tempNoteContext) {
      const contextPrefix = lang === 'id'
        ? `[KONTEKS CATATAN YANG DIIZINKAN PENGGUNA]\nJudul: ${tempNoteContext.title}\nKonten:\n${tempNoteContext.content}\n\n---\nPertanyaan Pengguna:\n`
        : `[USER-CONSENTED NOTE CONTEXT]\nTitle: ${tempNoteContext.title}\nContent:\n${tempNoteContext.content}\n\n---\nUser Question:\n`;
      const fullPrompt = contextPrefix + textToSend;
      await executeChatCall(fullPrompt, textToSend);
    } else {
      await executeChatCall(textToSend);
    }
  };

  const handleConsentApproved = async () => {
    setShowConsentModal(false);
    
    // Format prompt with prepended context block
    const contextPrefix = lang === 'id'
      ? `[KONTEKS PRIVASI YANG DIIZINKAN PENGGUNA]\n${consentPayload}\n\nPertanyaan Pengguna:\n`
      : `[USER-CONSENTED MINIMAL CONTEXT]\n${consentPayload}\n\nUser Question:\n`;

    const fullPrompt = contextPrefix + pendingPrompt;
    setPendingPrompt('');
    await executeChatCall(fullPrompt, pendingPrompt);
  };

  const handleConsentCancel = async () => {
    setShowConsentModal(false);
    const rejectedPrompt = pendingPrompt;
    setPendingPrompt('');
    
    // Still let the chat proceed, but notify that the prompt was sent without private data
    const noticeText = lang === 'id'
      ? `*(Mengirimkan pertanyaan tanpa menyertakan data pribadi Anda karena pembatasan privasi)*\n\n${rejectedPrompt}`
      : `*(Sending request without private data due to privacy restrictions)*\n\n${rejectedPrompt}`;

    await executeChatCall(noticeText, rejectedPrompt);
  };

  const executeChatCall = async (fullPrompt: string, userFacingPrompt?: string) => {
    if (!geminiApiKey) {
      setErrorMsg(lang === 'id'
        ? "API Key Gemini belum diatur. Harap buka Pengaturan -> Pengaturan Noto AI terlebih dahulu."
        : "Gemini API Key is not set. Please go to Settings -> Noto AI Settings to configure it first.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userFacingPrompt || fullPrompt,
      timestamp: Date.now()
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');

    try {
      // Map historical messages to standard Gemini content payload
      // Only the latest turn has the injected context fullPrompt to avoid duplicate bloat.
      const contentsPayload = updatedHistory.slice(-8).map((m, idx, arr) => {
        const isLatestUser = idx === arr.length - 1;
        return {
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: isLatestUser ? fullPrompt : m.content }]
        };
      });

      const systemPrompt = lang === 'id'
        ? "Anda adalah Noto AI, asisten pribadi dan pendamping hidup yang hangat, sangat berempati, bijaksana, dan ramah. Noto didasain sebagai aplikasi produktivitas yang menjaga privasi dan offline-first. Berbicaralah dengan bahasa yang santai, bersahabat, tulus, dan penuh empati. Bantu pengguna dengan saran kehidupan, motivasi, refleksi produktivitas, keuangan, atau suasana hati jika mereka mengizinkan datanya dikirim. Jangan pernah memata-matai atau berlagak tahu data yang tidak dikirim pengguna. Jawablah dalam bahasa Indonesia secara santun dan tulus."
        : "You are Noto AI, a warm, deeply empathetic, wise, and friendly personal life coach and companion. Noto is a privacy-first, offline-first productivity application. Speak in a comforting, sincere, friendly, and encouraging tone. Help the user with life advice, motivation, or analysis of productivity, finance, and moods when they explicitly share their data. Never assume or make up user information not provided. Answer in English with warmth and sincerity.";

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: contentsPayload,
            generationConfig: {
              maxOutputTokens: 1024,
              temperature: 0.7
            }
          })
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let errMsg = errorData?.error?.message || `Google API Error (${res.status})`;
        throw new Error(errMsg);
      }

      const data = await res.json();
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received";

      const modelMsg: ChatMessage = {
        id: generateId(),
        role: 'model',
        content: replyText,
        timestamp: Date.now()
      };

      const finalHistory = [...updatedHistory, modelMsg];
      setMessages(finalHistory);
      saveChatHistory(finalHistory);

      // Deduct Credit only on success
      updateCredits(Math.max(0, creditsLeft - 1));

    } catch (err: any) {
      console.error(err);
      setErrorMsg(lang === 'id'
        ? `Gagal menghubungi Gemini API: ${err.message || 'Kesalahan koneksi'}`
        : `Failed to connect to Gemini API: ${err.message || 'Connection error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'model',
      content: lang === 'id' 
        ? "Riwayat percakapan telah dihapus secara lokal. Sesuai prinsip **Zero-Server**, tidak ada log yang tertinggal di cloud mana pun!"
        : "Conversation history cleared locally. Adhering to our **Zero-Server** principle, no logs remain on any cloud!",
      timestamp: Date.now()
    };
    setMessages([welcome]);
    saveChatHistory([welcome]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex-none min-h-[4rem] pt-[env(safe-area-inset-top)] border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-3 -ml-2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Bot size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Noto AI</h1>
              <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                <Shield size={12} />
                <span>Privacy-First System</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Badges */}
        <div className="flex items-center gap-2">
          {/* Credit Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700/80">
            <Sparkles size={13} className="text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">
              {creditsLeft} {lang === 'id' ? 'Kredit' : 'Credits'}
            </span>
          </div>
          
          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
            title={lang === 'id' ? 'Hapus Percakapan' : 'Clear Chat'}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        {/* Left Side: Info & Guidelines Panel (Hidden on small mobile) */}
        <div className="hidden md:flex flex-col w-[320px] bg-slate-900/60 border-r border-slate-800 p-5 overflow-y-auto gap-5 shrink-0 no-scrollbar">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <Lock size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wider">{lang === 'id' ? 'Benteng Privasi' : 'Privacy Shield'}</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'id' 
                ? "Noto AI berjalan statelesst tanpa server database. Data Anda dirangkum lokal di perangkat Anda lalu dikirim HANYA jika Anda mengizinkannya."
                : "Noto AI runs statelessly without a backend database. Your data is compiled locally on device and only transmitted if you explicitly grant permission."}
            </p>
          </div>

          <div className="h-[1px] bg-slate-800" />

          {/* Quick analysis guidelines */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">{lang === 'id' ? 'Pintasan Analisis' : 'Analysis Shortcuts'}</h4>
            <button
              onClick={() => handleSend(lang === 'id' ? "Tolong beri saya analisis mood minggu ini" : "Please give me a mood reflection for this week", 'mood')}
              className="flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl text-left hover:border-indigo-500/50 transition-all text-xs cursor-pointer group"
            >
              <Smile size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-slate-200">{lang === 'id' ? 'Analisis Mood' : 'Mood reflection'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{lang === 'id' ? 'Tinjau suasana hati aman' : 'Securely analyze mood logs'}</div>
              </div>
            </button>

            <button
              onClick={() => handleSend(lang === 'id' ? "Bagaimana kondisi keuangan saya bulan ini?" : "How is my financial performance this month?", 'finance')}
              className="flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl text-left hover:border-indigo-500/50 transition-all text-xs cursor-pointer group"
            >
              <Wallet size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-slate-200">{lang === 'id' ? 'Keuangan Agregat' : 'Financial Summary'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{lang === 'id' ? 'Kirim ringkasan total angka' : 'Transmit aggregated totals only'}</div>
              </div>
            </button>

            <button
              onClick={() => handleSend(lang === 'id' ? "Beri evaluasi kedisiplinan dan produktivitas saya" : "Evaluate my productivity and check-in discipline", 'tasks')}
              className="flex items-center gap-3 p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl text-left hover:border-indigo-500/50 transition-all text-xs cursor-pointer group"
            >
              <CheckSquare size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-slate-200">{lang === 'id' ? 'Kedisiplinan Kerja' : 'Discipline & Tasks'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{lang === 'id' ? 'Analisis streak & rasio tugas' : 'Analyze streak & completion rate'}</div>
              </div>
            </button>
          </div>

          <div className="h-[1px] bg-slate-800" />

          {/* AI Credits Transparency Card */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {lang === 'id' ? 'Sistem Kredit Noto AI' : 'Noto AI Credits System'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'id'
                ? "Guna membatasi penggunaan AI demi kenyamanan dan efisiensi bersama, sistem kredit transparan diterapkan:"
                : "To limit AI usage responsibly and maintain high efficiency, a transparent credit system is enforced:"}
            </p>
            <ul className="space-y-1.5 text-[10px] text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>
                  {lang === 'id'
                    ? "Pengguna Gratis memiliki 10 AI Credits per hari."
                    : "Free Users receive 10 AI Credits per day."}
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>
                  {lang === 'id'
                    ? "Satu pesan sukses mengurangi 1 AI Credit."
                    : "One successful message deducts 1 AI Credit."}
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>
                  {lang === 'id'
                    ? "Kredit TIDAK berkurang jika AI gagal merespons atau error."
                    : "Credits DO NOT deduct if the AI fails to reply due to an error."}
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>
                  {lang === 'id'
                    ? "Kredit akan otomatis di-reset penuh setiap hari."
                    : "Credits automatically reset in full every day."}
                </span>
              </li>
              <li className="flex items-start gap-1.5 border-t border-slate-800/60 pt-1.5 mt-1">
                <span className="text-indigo-400 font-bold">✨</span>
                <span className="text-slate-400">
                  {lang === 'id'
                    ? "Segera Hadir: Akun Premium dengan kapasitas kredit AI jauh lebih banyak!"
                    : "Coming Soon: Premium account with substantially more AI credits!"}
                </span>
              </li>
            </ul>
          </div>
          
          <div className="mt-auto p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
            <span className="text-[10px] text-slate-500 leading-relaxed block">
              Noto AI • Version 1.1<br/>Privacy First & User Owns Data
            </span>
          </div>
        </div>

        {/* Right Side: Conversation Panel */}
        <div className="flex-1 flex flex-col h-full bg-slate-950">
          
          {/* Active Note Context Banner */}
          {tempNoteContext ? (
            <div className="flex-none bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-emerald-400">
                <FileText size={16} />
                <span className="font-semibold">{lang === 'id' ? 'Catatan Aktif Terlampir:' : 'Active Note Attached:'}</span>
                <span className="text-slate-200 font-bold max-w-[150px] sm:max-w-[200px] md:max-w-[300px] truncate">"{tempNoteContext.title}"</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNoteAttachModal(true)}
                  className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-full font-bold transition-colors cursor-pointer text-[10px]"
                >
                  <span>{lang === 'id' ? 'Ubah' : 'Change'}</span>
                </button>
                <button
                  onClick={() => setTempNoteContext(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full font-bold transition-colors cursor-pointer border border-red-500/20 text-[10px]"
                  title={lang === 'id' ? 'Hapus Akses Catatan' : 'Revoke Note Access'}
                >
                  <Trash2 size={11} />
                  <span>{lang === 'id' ? 'Hapus' : 'Revoke'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-none bg-slate-900/20 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <FileText size={14} className="text-slate-500" />
                <span>{lang === 'id' ? 'Belum ada catatan terlampir' : 'No note attached'}</span>
              </div>
              <button
                onClick={() => setShowNoteAttachModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 rounded-full font-bold transition-all cursor-pointer text-[10px]"
              >
                <Plus size={11} />
                <span>{lang === 'id' ? 'Lampirkan Catatan' : 'Attach Note'}</span>
              </button>
            </div>
          )}

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
            {/* Quick-action pills for mobile layout */}
            <div className="md:hidden grid grid-cols-3 gap-2 pb-4 border-b border-slate-800/50">
              <button
                onClick={() => handleSend(lang === 'id' ? "Tolong beri saya analisis mood" : "Please give me a mood reflection", 'mood')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center text-[10px] gap-1 hover:border-indigo-500/40"
              >
                <Smile size={16} className="text-emerald-400" />
                <span className="font-semibold">{lang === 'id' ? 'Mood' : 'Mood'}</span>
              </button>
              <button
                onClick={() => handleSend(lang === 'id' ? "Bagaimana kondisi keuangan saya?" : "How is my financial performance?", 'finance')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center text-[10px] gap-1 hover:border-indigo-500/40"
              >
                <Wallet size={16} className="text-amber-400" />
                <span className="font-semibold">{lang === 'id' ? 'Keuangan' : 'Finance'}</span>
              </button>
              <button
                onClick={() => handleSend(lang === 'id' ? "Evaluasi disiplin saya" : "Evaluate my discipline", 'tasks')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center text-[10px] gap-1 hover:border-indigo-500/40"
              >
                <CheckSquare size={16} className="text-indigo-400" />
                <span className="font-semibold">{lang === 'id' ? 'Disiplin' : 'Discipline'}</span>
              </button>
            </div>

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              
              // Handle formatting text inside bubbles (Markdown support)
              // We do a simple parse of **bold** and *italic*
              const formattedContent = msg.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br />');

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-150`}
                >
                  <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Icon / Avatar */}
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                      isUser 
                        ? 'bg-slate-800 text-slate-300 border border-slate-700/50' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {isUser ? 'ME' : <Bot size={16} />}
                    </div>

                    {/* Chat Bubble */}
                    <div className="flex flex-col gap-1">
                      <div className={`rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10' 
                          : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800/80 shadow-md'
                      }`}>
                        <p dangerouslySetInnerHTML={{ __html: formattedContent }} />
                      </div>
                      <span className={`text-[9px] text-slate-500 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="flex gap-3 max-w-[70%]">
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Bot size={16} />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Error Message banner */}
          {errorMsg && (
            <div className="mx-4 mb-2 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 animate-in slide-in-from-bottom-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 font-medium leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Bottom Chat Input Form / API Key Warning block */}
          {!geminiApiKey ? (
            <div className="flex-none p-5 md:p-6 bg-indigo-950/10 border-t border-indigo-900/20 text-center space-y-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Lock size={18} />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="font-extrabold text-sm text-slate-200">
                  {lang === 'id' ? 'API Key Gemini Diperlukan' : 'Gemini API Key Required'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'id' 
                    ? 'Sesuai prinsip Offline & Privacy-First Noto, Anda harus memasukkan API Key Gemini milik Anda sendiri di Pengaturan untuk mengaktifkan asisten AI.'
                    : 'Adhering to Noto\'s Offline & Privacy-First principles, you must enter your own Gemini API Key in Settings to activate the AI assistant.'}
                </p>
              </div>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10"
              >
                <span>{lang === 'id' ? 'Buka Pengaturan Noto AI' : 'Open Noto AI Settings'}</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex-none p-4 md:p-6 bg-slate-900/40 border-t border-slate-800/80 flex gap-2.5 items-center pb-[calc(env(safe-area-inset-bottom)+12px)]"
            >
              {/* Attachment / Choose Note Button */}
              <button
                type="button"
                onClick={() => setShowNoteAttachModal(true)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                  tempNoteContext 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30'
                }`}
                title={lang === 'id' ? 'Lampirkan Catatan Berizin' : 'Attach Authorized Note'}
              >
                <FileText size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={lang === 'id' ? "Kirim pesan aman ke Noto AI..." : "Send a secure message to Noto AI..."}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-sm placeholder-slate-500 outline-none transition-all disabled:opacity-50 min-w-0"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer shadow-lg shadow-indigo-600/15 shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          )}

        </div>
      </div>

      {/* CONSENT DIALOG MODAL */}
      <AnimatePresence>
        {showConsentModal && (
          <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Blur accent background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{lang === 'id' ? 'Persetujuan Privasi' : 'Privacy Permission'}</h3>
                  <p className="text-xs text-slate-400">{lang === 'id' ? 'Transmisi Data Terbatas' : 'Limited Data Transmission'}</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                {lang === 'id' ? (
                  consentType === 'tasks' ? (
                    <span>Noto AI membutuhkan ringkasan produktivitas Anda.</span>
                  ) : consentType === 'finance' ? (
                    <span>Noto AI membutuhkan ringkasan keuangan Anda.</span>
                  ) : (
                    <span>Noto AI membutuhkan analisis Mood Tracker Anda.</span>
                  )
                ) : (
                  consentType === 'tasks' ? (
                    <span>Noto AI requires your productivity summary.</span>
                  ) : consentType === 'finance' ? (
                    <span>Noto AI requires your financial summary.</span>
                  ) : (
                    <span>Noto AI requires your Mood Tracker analysis.</span>
                  )
                )}
              </p>

              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                  {lang === 'id' ? 'Data yang akan dikirim:' : 'Data to be sent:'}
                </span>
                <ul className="text-xs text-slate-300 space-y-1 bg-slate-950/40 border border-slate-800/60 p-3 rounded-2xl">
                  {consentType === 'tasks' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{lang === 'id' ? 'Total tugas' : 'Total tasks'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{lang === 'id' ? 'Jumlah tugas selesai' : 'Number of completed tasks'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{lang === 'id' ? 'Persentase penyelesaian' : 'Completion percentage'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>Streak</span>
                      </li>
                    </>
                  )}
                  {consentType === 'finance' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{lang === 'id' ? 'Total pemasukan terdaftar' : 'Total registered income'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{lang === 'id' ? 'Total pengeluaran terdaftar' : 'Total registered expenses'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{lang === 'id' ? 'Saldo tabungan saat ini' : 'Current savings balance'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{lang === 'id' ? 'Target tabungan' : 'Savings target'}</span>
                      </li>
                    </>
                  )}
                  {consentType === 'mood' && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>{lang === 'id' ? 'Riwayat mood 7 hari terakhir' : 'Mood history for the last 7 days'}</span>
                      </li>
                      <li className="flex items-center gap-2 text-[10px] text-slate-500 pl-3.5">
                        <span>(Hari, Label Mood, {lang === 'id' ? 'dan catatan pendek' : 'and short note'})</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Exact Data Block Display */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 mb-5 max-h-[140px] overflow-y-auto no-scrollbar">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  {lang === 'id' ? 'PRATINJAU DATA SEBENARNYA' : 'ACTUAL DATA PREVIEW'}
                </span>
                <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {consentPayload}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConsentCancel}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold text-sm rounded-2xl transition-colors cursor-pointer border border-slate-700/40 text-center"
                >
                  {lang === 'id' ? 'Batalkan' : 'Cancel'}
                </button>
                <button
                  onClick={handleConsentApproved}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl transition-colors cursor-pointer text-center shadow-lg shadow-indigo-600/20"
                >
                  {lang === 'id' ? 'Izinkan' : 'Allow'}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-slate-500">
                <Eye size={12} />
                <span>{lang === 'id' ? 'Data tidak pernah disimpan di server mana pun' : 'Data is never stored on any servers'}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ATTACH NOTE DIALOG MODAL */}
      <AnimatePresence>
        {showNoteAttachModal && (
          <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Blur accent background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{lang === 'id' ? 'Lampirkan Catatan Berizin AI' : 'Attach AI-Consented Note'}</h3>
                  <p className="text-xs text-slate-400">{lang === 'id' ? 'Hanya catatan yang telah Anda beri izin akses' : 'Only notes that you have granted permission'}</p>
                </div>
              </div>

              {/* Scrollable list of notes */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 my-4 pr-1 min-h-[200px]">
                {(() => {
                  const sharedNotes = (notes || []).filter(n => n.sharedWithAI && !n.isArchived);
                  if (sharedNotes.length === 0) {
                    return (
                      <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                        <FileText size={32} className="text-slate-600 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-slate-300 mb-1">{lang === 'id' ? 'Tidak Ada Catatan Berizin AI' : 'No AI-Consented Notes'}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                          {lang === 'id' 
                            ? 'Buka salah satu catatan Anda di editor, lalu tekan tombol "Berikan ke AI" untuk memberikan izin akses secara eksplisit.' 
                            : 'Open one of your notes in the editor and click "Give to AI" to grant explicit access permission first.'}
                        </p>
                      </div>
                    );
                  }

                  return sharedNotes.map((n) => {
                    const isSelected = tempNoteContext && tempNoteContext.title === n.title;
                    const contentPreview = n.content 
                      ? n.content.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>?/gm, '').replace(/&nbsp;?/gi, ' ').trim() 
                      : '';
                    
                    return (
                      <div 
                        key={n.id}
                        className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col gap-1.5 ${
                          isSelected 
                            ? 'bg-indigo-600/10 border-indigo-500/40' 
                            : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/60'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-slate-100 truncate flex-1 flex items-center gap-1.5">
                            <Sparkles size={11} className="text-indigo-400 shrink-0" />
                            <span>{n.title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note')}</span>
                          </h4>
                          <span className="text-[9px] text-slate-500 font-mono shrink-0">{n.date}</span>
                        </div>
                        {contentPreview && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed break-words">
                            {contentPreview}
                          </p>
                        )}
                        <div className="flex justify-end pt-1 shrink-0">
                          {isSelected ? (
                            <button
                              onClick={() => {
                                setTempNoteContext(null);
                                setShowNoteAttachModal(false);
                              }}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              {lang === 'id' ? 'Lepas Lampiran' : 'Detach'}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setTempNoteContext({
                                  title: n.title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note'),
                                  content: n.content || ''
                                });
                                setShowNoteAttachModal(false);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              {lang === 'id' ? 'Lampirkan' : 'Attach'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="flex gap-3 shrink-0 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => setShowNoteAttachModal(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-slate-700/40 text-center"
                >
                  {lang === 'id' ? 'Tutup' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
