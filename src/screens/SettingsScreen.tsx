import React, { useState, useEffect } from 'react';
import { 
  Moon, Download, Upload, Bell, Lock, FileText, Smartphone,
  ChevronRight, ChevronLeft, User, Globe, Clock, Key, Trash2, Info, Shield, MessageCircle, Gamepad2,
  AlertTriangle, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { ScreenItem } from '../App';
import { generateId, encryptData, decryptData, hashPin } from '../utils';
import { getLargeItem, getLargeItemSync, setLargeItem, deleteLargeItem } from '../utils/db';

export default function SettingsScreen({ 
  appTheme, 
  setAppTheme, 
  onNavigate 
}: { 
  appTheme: string, 
  setAppTheme: (t: any) => void, 
  onNavigate?: (s: ScreenItem) => void 
}) {
  const { 
    transactions, notes, tasks, user, updateUser, appPin, setAppPin, 
    pinRecoveryQuestion, setPinRecoveryQuestion, pinRecoveryAnswer, setPinRecoveryAnswer, 
    setIsUnlocked, importData, importFullBackup, clearAllData, lang, setLang, streak, 
    reminderActive, setReminderActive, reminderTime, setReminderTime,
    moods, savingsTarget, savingsTargetTitle, savingsBalance, hasCompletedOnboarding, archivedTags,
    isRefreshing, refreshStep, handleRefreshApp, isLiteMode, setIsLiteMode
  } = useAppStore();
  const t = useTranslation(lang);

  const [activeSection, setActiveSection] = useState<'appearance' | 'notifications' | 'security' | 'backup' | 'about' | null>(null);

  const [exportOptions, setExportOptions] = useState({
    notes: true,
    tasks: true,
    transactions: true,
    moods: true,
    userProfile: true,
    settings: true,
    wallpaper: true
  });

  const [localCustomWallpaper, setLocalCustomWallpaper] = useState<string | null>(() => getLargeItemSync("noto_custom_wallpaper"));
  const [localBannerWallpaper, setLocalBannerWallpaper] = useState<string | null>(() => getLargeItemSync("noto_banner_wallpaper"));

  useEffect(() => {
    const loadWallpapers = () => {
      getLargeItem('noto_custom_wallpaper').then(setLocalCustomWallpaper);
      getLargeItem('noto_banner_wallpaper').then(setLocalBannerWallpaper);
    };

    loadWallpapers();

    window.addEventListener('noto_wallpaper_changed', loadWallpapers);
    window.addEventListener('noto_banner_wallpaper_changed', loadWallpapers);

    return () => {
      window.removeEventListener('noto_wallpaper_changed', loadWallpapers);
      window.removeEventListener('noto_banner_wallpaper_changed', loadWallpapers);
    };
  }, []);

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLargeItem('noto_custom_wallpaper', dataUrl)
        .then(() => {
          setLocalCustomWallpaper(dataUrl);
          window.dispatchEvent(new Event('noto_wallpaper_changed'));
          setToastMessage(lang === 'id' ? 'Wallpaper berhasil diperbarui!' : 'Wallpaper updated successfully!');
          setTimeout(() => setToastMessage(null), 3000);
        })
        .catch(() => {
          setToastMessage(lang === 'id' ? 'Gagal menyimpan wallpaper!' : 'Failed to save wallpaper!');
          setTimeout(() => setToastMessage(null), 3000);
        });
    };
    reader.readAsDataURL(file);
  };

  const handleBannerWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLargeItem('noto_banner_wallpaper', dataUrl)
        .then(() => {
          setLocalBannerWallpaper(dataUrl);
          window.dispatchEvent(new Event('noto_banner_wallpaper_changed'));
          setToastMessage(lang === 'id' ? 'Wallpaper kotak utama berhasil diperbarui!' : 'Main box wallpaper updated successfully!');
          setTimeout(() => setToastMessage(null), 3000);
        })
        .catch(() => {
          setToastMessage(lang === 'id' ? 'Gagal menyimpan wallpaper!' : 'Failed to save wallpaper!');
          setTimeout(() => setToastMessage(null), 3000);
        });
    };
    reader.readAsDataURL(file);
  };

  const [pinModalMode, setPinModalMode] = useState<'create' | 'verify' | 'change' | 'remove' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinQuestionInput, setPinQuestionInput] = useState('');
  const [pinAnswerInput, setPinAnswerInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showUpdateNotes, setShowUpdateNotes] = useState(false);
  const [backupModalMode, setBackupModalMode] = useState<'export' | 'import' | null>(null);
  const [testNotifMsg, setTestNotifMsg] = useState<string | null>(null);

  const handlePinSubmit = async () => {
    if (pinInput.length !== 4) return;
    const { hashPin } = await import('../utils');
    if (pinModalMode === 'create' || pinModalMode === 'change') {
      if (!pinQuestionInput.trim() || !pinAnswerInput.trim()) {
        setPinError(true);
        setTimeout(() => setPinError(false), 500);
        return;
      }
      const hashed = await hashPin(pinInput);
      setAppPin(hashed);
      setPinRecoveryQuestion(pinQuestionInput.trim());
      setPinRecoveryAnswer(pinAnswerInput.trim().toLowerCase());
      setIsUnlocked(true);
      setPinModalMode(null);
      setPinQuestionInput('');
      setPinAnswerInput('');
    } else if (pinModalMode === 'verify') {
      const hashed = await hashPin(pinInput);
      if (hashed === appPin || pinInput === appPin) {
        setPinInput('');
        setPinError(false);
        setPinModalMode('change');
      } else {
        setPinError(true);
        setPinInput('');
        setTimeout(() => setPinError(false), 500);
      }
    } else if (pinModalMode === 'remove') {
      const hashed = await hashPin(pinInput);
      if (hashed === appPin || pinInput === appPin) {
        setAppPin(null);
        setPinRecoveryQuestion(null);
        setPinRecoveryAnswer(null);
        setPinModalMode(null);
      } else {
        setPinError(true);
        setPinInput('');
        setTimeout(() => setPinError(false), 500);
      }
    }
  };

  const triggerTestNotif = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      window.Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          const title = t('notifTitleTest') || 'Uji Coba Notifikasi Noto!';
          const body = t('notifBodyTest') || 'Hebat! Notifikasi dari aplikasi Noto berfungsi dengan benar 100%.';
          const options = {
            body: body,
            icon: '/icon.png',
            badge: '/icon.png',
            vibrate: [200, 100, 200]
          };
          
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, options).catch(() => {
                new window.Notification(title, options);
              });
            }).catch(() => {
              new window.Notification(title, options);
            });
          } else {
            new window.Notification(title, options);
          }
          setTestNotifMsg(t('testNotifSuccess') || 'Uji coba sukses! Jika Anda tidak melihat spanduk sistem, silakan aktifkan izin notifikasi di browser Anda.');
        } else {
          setTestNotifMsg(lang === 'id' ? 'Gagal: Izin notifikasi ditolak oleh browser.' : 'Failed: Notification permission denied by the browser.');
        }
      }).catch(() => {
        setTestNotifMsg(lang === 'id' ? 'Gagal: Tidak dapat meminta izin notifikasi.' : 'Failed: Could not request notification permission.');
      });
    } else {
      setTestNotifMsg(lang === 'id' ? 'Browser Anda tidak mendukung Notifikasi sistem.' : 'Your browser does not support system Notifications.');
    }
  };
  const [backupPassword, setBackupPassword] = useState('');
  const [backupFileContent, setBackupFileContent] = useState<string | null>(null);
  const [backupError, setBackupError] = useState(false);

  const handleExportClick = () => {
    setBackupPassword('');
    setBackupError(false);
    setBackupModalMode('export');
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setBackupFileContent(ev.target?.result as string);
          setBackupPassword('');
          setBackupError(false);
          setBackupModalMode('import');
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const processExport = async () => {
    try {
      const exportData: any = { 
        version: "4.0",
        timestamp: new Date().toISOString()
      };
      
      if (exportOptions.notes) exportData.notes = notes;
      if (exportOptions.tasks) exportData.tasks = tasks;
      if (exportOptions.transactions) exportData.transactions = transactions;
      if (exportOptions.moods) exportData.moods = moods;
      
      if (exportOptions.userProfile) {
        exportData.user = user;
        exportData.streak = streak;
      }
      
      if (exportOptions.settings) {
        exportData.appPin = appPin;
        exportData.pinRecoveryQuestion = pinRecoveryQuestion;
        exportData.pinRecoveryAnswer = pinRecoveryAnswer;
        exportData.lang = lang;
        exportData.reminderActive = reminderActive;
        exportData.reminderTime = reminderTime;
        exportData.savingsTarget = savingsTarget;
        exportData.savingsTargetTitle = savingsTargetTitle;
        exportData.savingsBalance = savingsBalance;
        exportData.hasCompletedOnboarding = hasCompletedOnboarding;
        exportData.archivedTags = archivedTags;
      }
      
      if (exportOptions.wallpaper) {
        exportData.customWallpaper = localCustomWallpaper;
        exportData.bannerWallpaper = localBannerWallpaper;
        exportData.appTheme = appTheme;
      }
      
      const data = JSON.stringify(exportData);
      let finalData = data;
      
      if (backupPassword) {
        const { encryptData } = await import('../utils');
        finalData = await encryptData(data, backupPassword);
      }
      
      const blob = new Blob([finalData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noto_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToastMessage(t('toastExportSuccess'));
      setBackupModalMode(null);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      setBackupError(true);
      setTimeout(() => setBackupError(false), 2000);
    }
  };

  const processImport = async () => {
    if (!backupFileContent) return;
    try {
      let dataStr = backupFileContent;
      
      try {
        const parsed = JSON.parse(backupFileContent);
        if (parsed.v && parsed.s && parsed.d) {
          if (!backupPassword) {
            setBackupError(true);
            setTimeout(() => setBackupError(false), 2000);
            return;
          }
          const { decryptData } = await import('../utils');
          dataStr = await decryptData(backupFileContent, backupPassword);
        }
      } catch (e) {
        setBackupError(true);
        setTimeout(() => setBackupError(false), 2000);
        return;
      }
      
      const data = JSON.parse(dataStr);
      if (data.version === "4.0" || data.notes || data.tasks) {
        const parsedTransactions = data.transactions || [];
        const seenTxIds = new Set();
        const uniqueTransactions = parsedTransactions.map((t: any) => {
          if (seenTxIds.has(t.id)) t.id = generateId();
          seenTxIds.add(t.id);
          return t;
        });

        const parsedTasks = data.tasks || [];
        const seenTaskIds = new Set();
        const uniqueTasks = parsedTasks.map((t: any) => {
          if (seenTaskIds.has(t.id)) t.id = generateId();
          seenTaskIds.add(t.id);
          return t;
        });

        const parsedNotes = data.notes || [];
        const seenNoteIds = new Set();
        const uniqueNotes = parsedNotes.map((n: any) => {
          if (seenNoteIds.has(n.id)) n.id = generateId();
          seenNoteIds.add(n.id);
          return n;
        });
        
        const fullBackup = {
          ...data,
          notes: uniqueNotes,
          tasks: uniqueTasks,
          transactions: uniqueTransactions
        };

        await importFullBackup(fullBackup);

        if (data.appTheme) {
          setAppTheme(data.appTheme);
        }

        setToastMessage(t('toastImportSuccess'));
        setBackupModalMode(null);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setToastMessage(t('toastImportInvalid'));
        setBackupModalMode(null);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch(e) {
      setBackupError(true);
      setTimeout(() => setBackupError(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full font-sans text-slate-200">
      {isResetting && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-slate-200 font-bold text-lg">
            {lang === 'id' ? 'Mengatur Ulang Aplikasi...' : 'Resetting Application...'}
          </p>
          <p className="text-slate-400 text-xs mt-2">
            {lang === 'id' ? 'Mohon tunggu sebentar, halaman akan dimuat ulang.' : 'Please wait, the page will reload shortly.'}
          </p>
        </div>
      )}
      {isRefreshing && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          <div className="relative mb-8 flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin absolute" />
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)] animate-pulse">
              <RefreshCw size={24} className="animate-spin duration-[3000ms]" />
            </div>
          </div>
          
          <h2 className="text-slate-50 font-black text-xl tracking-tight mb-2">
            {t('refreshingTitle')}
          </h2>
          <p className="text-slate-400 text-xs mb-8 max-w-xs leading-relaxed">
            {lang === 'id'
              ? 'Membersihkan cache sistem dan menyegarkan data agar Noto berjalan lancar kembali.'
              : 'Clearing system cache and refreshing data to keep Noto running smoothly.'}
          </p>

          <div className="w-full max-w-xs bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-left space-y-3.5 shadow-xl">
            {[1, 2, 3, 4, 5].map((stepNum) => {
              const isCurrent = refreshStep === stepNum;
              const isDone = refreshStep > stepNum;
              
              let stepLabel = '';
              if (stepNum === 1) stepLabel = t('refreshStep1');
              else if (stepNum === 2) stepLabel = t('refreshStep2');
              else if (stepNum === 3) stepLabel = t('refreshStep3');
              else if (stepNum === 4) stepLabel = t('refreshStep4');
              else if (stepNum === 5) stepLabel = t('refreshStep5');

              return (
                <div key={stepNum} className={`flex items-center gap-3.5 transition-all duration-300 ${isCurrent ? 'scale-[1.02] opacity-100' : isDone ? 'opacity-80' : 'opacity-30'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isCurrent ? 'bg-indigo-500 text-slate-950 animate-bounce' : 'bg-slate-850 text-slate-500 border border-slate-800'}`}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span className={`text-[12px] font-semibold leading-none truncate ${isCurrent ? 'text-indigo-400 font-bold' : isDone ? 'text-slate-300 line-through decoration-slate-600/60' : 'text-slate-500'}`}>
                    {stepLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex-none h-16 pt-[env(safe-area-inset-top)] border-b border-slate-800/40 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <span className="font-bold text-xl text-slate-50 tracking-tight">{t('settingsMenu')}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full">
        <div className="w-full px-4 sm:px-6 py-6 space-y-6 max-w-2xl mx-auto">
          
          {activeSection === null ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* USER WELCOME DASHBOARD */}
              <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-indigo-950/10 border border-slate-800/80 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg shadow-slate-950/25">
                <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row w-full sm:w-auto">
                  <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-indigo-500/30 overflow-hidden flex items-center justify-center shrink-0">
                    {user.avatarUrl === 'indexeddb:user_avatar' ? (
                      <div className="w-full h-full bg-slate-800 animate-pulse" />
                    ) : user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-[17px] font-black text-slate-100 tracking-tight">
                      {lang === 'id' ? `Halo, ${user.name || 'Pengguna'}!` : `Hello, ${user.name || 'User'}!`}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {lang === 'id' ? 'Sesuaikan Noto dengan preferensi Anda.' : 'Customize Noto to match your style.'}
                    </p>
                  </div>
                </div>
                {streak > 0 && (
                  <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-2 shrink-0 self-center sm:self-auto shadow-inner animate-pulse">
                    <span className="text-base">🔥</span>
                    <span className="text-xs font-black text-amber-400">{streak} {lang === 'id' ? 'Hari Beruntun' : 'Day Streak'}</span>
                  </div>
                )}
              </div>

              {/* QUICK REFRESH & DIAGNOSTIC CARD */}
              <div className="p-5 sm:p-6 bg-slate-900/45 hover:bg-slate-900/70 border border-slate-800/80 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg shadow-slate-950/15 transition-all">
                <div className="flex items-center gap-4 min-w-0 flex-1 text-center sm:text-left flex-col sm:flex-row">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)] shrink-0">
                    <RefreshCw size={22} className="animate-spin duration-[8000ms]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-[15px] text-slate-100 tracking-tight">
                      {t('refreshApp')}
                    </span>
                    <span className="text-xs text-slate-400 leading-normal mt-1 max-w-md">
                      {t('refreshAppDesc')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRefreshApp}
                  className="w-full sm:w-auto px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-indigo-500/15 shrink-0"
                >
                  {lang === 'id' ? 'Segarkan Noto' : 'Refresh Noto'}
                </button>
              </div>

              {/* SETTINGS CATEGORIES GRID */}
              <div className="space-y-3.5">
                {[
                  {
                    id: 'appearance',
                    title: lang === 'id' ? 'Profil & Tampilan' : 'Profile & Appearance',
                    desc: lang === 'id' ? 'Atur foto profil, tema warna visual, wallpaper, dan bahasa.' : 'Manage profile photo, theme colors, wallpapers, and language.',
                    icon: <Moon size={18} className="text-indigo-400 animate-pulse" />,
                    accentColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                  },
                  {
                    id: 'notifications',
                    title: lang === 'id' ? 'Pengingat & Notifikasi' : 'Reminders & Notifications',
                    desc: lang === 'id' ? 'Aktifkan alarm pengingat harian dan kelola notifikasi sistem.' : 'Set up daily activity reminders and test system alert popups.',
                    icon: <Bell size={18} className="text-orange-400" />,
                    accentColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                  },
                  {
                    id: 'security',
                    title: lang === 'id' ? 'Keamanan & Kunci PIN' : 'Security & PIN Lock',
                    desc: lang === 'id' ? 'Lindungi catatan rahasia dan jurnal keuangan Anda dengan sandi PIN.' : 'Secure your private logs and financial transactions with a passcode.',
                    icon: <Lock size={18} className="text-rose-400" />,
                    accentColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  },
                  {
                    id: 'backup',
                    title: lang === 'id' ? 'Pencadangan & Atur Ulang' : 'Backup & App Reset',
                    desc: lang === 'id' ? 'Ekspor cadangan terenkripsi, impor data eksternal, atau hapus semua data.' : 'Export encrypted files, import data back, or hard reset database.',
                    icon: <Download size={18} className="text-emerald-400" />,
                    accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  },
                  {
                    id: 'about',
                    title: lang === 'id' ? 'Tentang Noto & Hiburan' : 'About Noto & Leisure',
                    desc: lang === 'id' ? 'Mainkan mini games, pelajari catatan rilis, dan hubungi kami.' : 'Play embedded mini games, read the release notes, and get help.',
                    icon: <Info size={18} className="text-sky-400" />,
                    accentColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                  }
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveSection(category.id as any)}
                    className="group w-full p-4.5 bg-slate-900/40 hover:bg-slate-900/85 border border-slate-800/60 hover:border-indigo-500/30 rounded-3xl backdrop-blur-xl transition-all duration-350 text-left flex items-center justify-between gap-4 cursor-pointer hover:translate-x-1.5 active:scale-[0.99] shadow-md shadow-slate-950/10"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${category.accentColor} shadow-sm`}>
                        {category.icon}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-indigo-400 transition-colors">
                          {category.title}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1 leading-normal">
                          {category.desc}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 shrink-0 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-300 ml-1" />
                  </button>
                ))}
              </div>

              {/* BRAND FOOTER (only shown on simplified main screen) */}
              <div className="pt-8 text-center opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase">NOTO</p>
                <p className="text-[10px] font-medium text-slate-600 mt-2">{t('madeWithSimplicity')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {/* BACK TO MAIN MENU BUTTON */}
              <button
                onClick={() => setActiveSection(null)}
                className="group flex items-center gap-2.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-850 text-indigo-400 border border-slate-800 rounded-2xl font-bold text-xs cursor-pointer transition-all active:scale-95 shadow-md shadow-slate-950/20"
              >
                <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>{lang === 'id' ? 'Kembali ke Menu Utama' : 'Back to Settings'}</span>
              </button>

              {/* AKUN & TAMPILAN */}
              {activeSection === 'appearance' && (
                <section>
            <h3 className="text-[11px] font-bold text-slate-400/80 uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2.5">
              <Smartphone size={14} className="text-indigo-400" /> {t('appearance')}
            </h3>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-lg shadow-slate-950/20 flex flex-col overflow-hidden divide-y divide-slate-800/30">
              
              {/* Premium Unified User Profile Block */}
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 bg-slate-950/20">
                <div className="relative group/avatar">
                  <div className="w-24 h-24 rounded-full bg-slate-900/95 border-2 border-indigo-500/30 flex items-center justify-center shadow-lg overflow-hidden transition-all duration-300 group-hover/avatar:border-indigo-500/50">
                    {user.avatarUrl === 'indexeddb:user_avatar' ? (
                      <div className="w-full h-full bg-slate-800 animate-pulse"></div>
                    ) : user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} className="text-slate-400/80" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-500 border-2 border-slate-900 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90 shadow-md">
                    <Upload size={14} className="text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const dataUrl = event.target?.result as string;
                          updateUser({ ...user, avatarUrl: dataUrl });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left w-full min-w-0">
                  <span className="text-[10px] font-black text-slate-400/90 uppercase tracking-widest mb-1.5">{t('nickname')}</span>
                  <input 
                    type="text" 
                    value={user.name}
                    onChange={(e) => updateUser({ ...user, name: e.target.value })}
                    placeholder={t('enterNicknamePlaceholder')}
                    className="bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-2.5 text-indigo-400 font-extrabold text-[15px] outline-none w-full sm:max-w-xs focus:border-indigo-500/50 focus:bg-slate-950/80 transition-all text-center sm:text-left placeholder-slate-600 shadow-inner"
                    maxLength={20}
                  />
                </div>
                {user.avatarUrl && user.avatarUrl !== 'indexeddb:user_avatar' && (
                  <button 
                    onClick={() => updateUser({ ...user, avatarUrl: '' })}
                    className="py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold text-xs transition-all active:scale-[0.98] self-center shrink-0 cursor-pointer"
                  >
                    {lang === 'id' ? 'Hapus Foto' : 'Remove Photo'}
                  </button>
                )}
              </div>

              {/* Theme Selector (Premium visual cards grid instead of ugly dropdown) */}
              {!isLiteMode && (
                <div className="p-5 sm:p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.06)]">
                    <Moon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-slate-200">{t('appThemeLabel')}</span>
                    <span className="text-xs text-slate-400 leading-normal">{lang === 'id' ? 'Ubah tampilan warna visual Noto' : 'Customize Noto\'s visual color mode'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-2">
                  {[
                    { id: 'dark', name: t('themeDark'), colorClass: 'bg-indigo-500' },
                    { id: 'light', name: t('themeLight'), colorClass: 'bg-amber-400' },
                    { id: 'pink', name: t('themePink'), colorClass: 'bg-pink-400' },
                    { id: 'cool', name: t('themeCool'), colorClass: 'bg-cyan-400' },
                    { id: 'cute', name: t('themeCute'), colorClass: 'bg-purple-400' },
                    { id: 'wallpaper', name: t('themeWallpaper'), colorClass: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500' },
                  ].map((theme) => {
                    const isActive = appTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setAppTheme(theme.id as any)}
                        className={`group relative flex flex-col items-start p-3.5 rounded-2xl border transition-all duration-200 text-left cursor-pointer active:scale-95 ${
                          isActive 
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                            : 'border-slate-800 bg-slate-950/20 hover:border-slate-700 hover:bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <div className={`w-3.5 h-3.5 rounded-full ${theme.colorClass} shadow-sm border border-white/10 shrink-0`} />
                          {isActive && (
                            <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-slate-950 text-[10px] font-black shrink-0">
                              ✓
                            </div>
                          )}
                        </div>
                        <span className={`font-bold text-xs ${isActive ? 'text-indigo-400' : 'text-slate-300 group-hover:text-slate-100'}`}>
                          {theme.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {appTheme === 'wallpaper' && (
                  <div className="mt-2 p-4 flex flex-col gap-3 bg-slate-950/30 border border-slate-800 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-slate-400 leading-normal">
                      {t('uploadWallpaperDesc')}
                    </p>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 py-2.5 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-xs text-center cursor-pointer transition-all active:scale-[0.98]">
                        {t('uploadWallpaper')}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleWallpaperUpload} 
                          className="hidden" 
                        />
                      </label>
                      {localCustomWallpaper && (
                        <button 
                          onClick={() => {
                            deleteLargeItem('noto_custom_wallpaper')
                              .then(() => {
                                setLocalCustomWallpaper(null);
                                window.dispatchEvent(new Event('noto_wallpaper_changed'));
                                setToastMessage(lang === 'id' ? 'Wallpaper kustom dihapus.' : 'Custom wallpaper removed.');
                                setTimeout(() => setToastMessage(null), 3000);
                              });
                          }}
                          className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
                        >
                          {t('removeWallpaper')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Banner Wallpaper */}
              {!isLiteMode && (
              <div className="flex flex-col p-5 sm:p-6 bg-slate-950/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(14,165,233,0.06)] shrink-0">
                      <ImageIcon size={18} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-[15px] text-slate-200 truncate">{t('bannerWallpaperLabel')}</span>
                      <span className="text-xs text-slate-400 leading-normal mt-0.5 whitespace-normal break-words">
                        {t('uploadBannerWallpaperDesc')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 sm:self-center shrink-0 w-full sm:w-auto">
                    <label className="py-2.5 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-xs cursor-pointer transition-colors active:scale-95 text-center flex-1 sm:flex-none">
                      {lang === 'id' ? 'Pilih Gambar' : 'Choose Image'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleBannerWallpaperUpload} 
                      />
                    </label>
                    {localBannerWallpaper && (
                      <button 
                        onClick={() => {
                          deleteLargeItem('noto_banner_wallpaper')
                            .then(() => {
                              setLocalBannerWallpaper(null);
                              window.dispatchEvent(new Event('noto_banner_wallpaper_changed'));
                              setToastMessage(lang === 'id' ? 'Wallpaper kotak utama dihapus.' : 'Main box wallpaper removed.');
                              setTimeout(() => setToastMessage(null), 3000);
                            });
                        }}
                        className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold text-xs transition-colors active:scale-95 cursor-pointer flex-1 sm:flex-none"
                      >
                        {lang === 'id' ? 'Hapus' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Language Selector (Premium Segmented pills instead of select dropdown) */}
              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(14,165,233,0.06)] shrink-0">
                      <Globe size={18} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-[15px] text-slate-200 truncate">{t('lang')}</span>
                      <span className="text-xs text-slate-400 leading-normal mt-0.5 truncate">{lang === 'id' ? 'Bahasa tampilan aplikasi' : 'App display language'}</span>
                    </div>
                  </div>
                  
                  <div className="flex bg-slate-950/60 p-1 border border-slate-800 rounded-2xl shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => setLang('id')}
                      className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer text-center ${
                        lang === 'id'
                          ? 'bg-indigo-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Indonesia
                    </button>
                    <button
                      onClick={() => setLang('en')}
                      className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer text-center ${
                        lang === 'en'
                          ? 'bg-indigo-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>
              </div>

              {/* Lite Mode Toggle */}
              <div className="p-5 sm:p-6 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.06)] shrink-0">
                      <Smartphone size={18} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-[15px] text-slate-200 truncate">{lang === 'id' ? 'Mode Noto Lite' : 'Noto Lite Mode'}</span>
                      <span className="text-xs text-slate-400 leading-normal mt-0.5">{lang === 'id' ? 'Sembunyikan fitur kompleks (Games, Finance, Dashboard) agar lebih minimalis & ringan.' : 'Hide complex features (Games, Finance, Dashboard) for a minimalist & lightweight experience.'}</span>
                    </div>
                  </div>
                  
                  <div className="flex bg-slate-950/60 p-1 border border-slate-800 rounded-2xl shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => setIsLiteMode(true)}
                      className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer text-center ${
                        isLiteMode
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang === 'id' ? 'Lite' : 'Lite'}
                    </button>
                    <button
                      onClick={() => setIsLiteMode(false)}
                      className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer text-center ${
                        !isLiteMode
                          ? 'bg-slate-700 text-white shadow-md font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang === 'id' ? 'Full' : 'Full'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>
          )}

          {/* NOTIFIKASI & HABIT */}
          {activeSection === 'notifications' && (
          <section>
            <h3 className="text-[11px] font-bold text-slate-400/80 uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2.5">
              <Bell size={14} className="text-orange-400" /> {t('notifications')}
            </h3>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-lg shadow-slate-950/20 flex flex-col overflow-hidden divide-y divide-slate-800/30">
              
              <div className="flex items-center justify-between p-5 sm:p-6">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.06)] transition-all shrink-0 ${reminderActive ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-slate-800/80 text-slate-400 border border-slate-750'}`}>
                    <Bell size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[15px] text-slate-200 truncate">
                      {t('appReminder')}
                    </span>
                    <span className="text-xs font-medium text-slate-400 mt-0.5 truncate">{reminderActive ? t('activeLabel') : t('inactiveLabel')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setReminderActive(!reminderActive);
                    if (!reminderActive && typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
                      if (typeof window.Notification.requestPermission === 'function') {
                        window.Notification.requestPermission().catch(() => {});
                      }
                    }
                  }} 
                  className={`w-12 h-7 rounded-full flex items-center p-1 transition-all duration-300 shadow-inner shrink-0 ${reminderActive ? 'bg-orange-500' : 'bg-slate-700/50 border border-slate-600/20'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${reminderActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-5 sm:p-6 transition-all duration-300 ${!reminderActive ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(217,119,6,0.06)] shrink-0">
                    <Clock size={18} />
                  </div>
                  <span className="font-bold text-[15px] text-slate-200 truncate">{t('reminderTime')}</span>
                </div>
                <input 
                  type="time" 
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  disabled={!reminderActive}
                  className="bg-slate-950/40 border border-slate-800 text-orange-400 font-bold px-4 py-2 rounded-xl text-[14px] outline-none hover:bg-slate-850 hover:border-slate-700/80 transition-all cursor-pointer shadow-inner shrink-0"
                />
              </div>

              {/* Test Notification Row */}
              <div className="p-5 sm:p-6 bg-slate-950/10 flex flex-col gap-2">
                <button
                  onClick={triggerTestNotif}
                  className="w-full py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold rounded-2xl text-xs border border-orange-500/20 hover:border-orange-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                >
                  <Bell size={14} className="animate-bounce" />
                  {t('sendTestNotification')}
                </button>
                {testNotifMsg && (
                  <p className="text-[11px] text-slate-400/80 leading-normal text-center px-3 py-2.5 mt-1 bg-slate-950/40 border border-slate-800/60 rounded-xl animate-in fade-in duration-200">
                    {testNotifMsg}
                  </p>
                )}
              </div>

            </div>
          </section>
          )}

          {/* DATA & CADANGAN */}
          {activeSection === 'backup' && (
          <section>
            <h3 className="text-[11px] font-bold text-slate-400/80 uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2.5">
              <FileText size={14} className="text-emerald-400" /> {t('dataBackup')}
            </h3>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-lg shadow-slate-950/20 flex flex-col overflow-hidden divide-y divide-slate-800/30">
              
              <button onClick={handleExportClick} className="group flex items-center justify-between p-5 sm:p-6 hover:bg-slate-800/20 transition-all duration-200 text-left active:scale-[0.995] cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.06)] shrink-0">
                    <Download size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[15px] text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{t('backupExport')}</span>
                    <span className="text-[11px] font-medium text-slate-400/85 mt-0.5 leading-normal whitespace-normal break-words">{t('backupExportDesc')}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 ml-3" />
              </button>

              <button onClick={handleImportClick} className="group flex items-center justify-between p-5 sm:p-6 hover:bg-slate-800/20 transition-all duration-200 text-left active:scale-[0.995] cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(14,165,233,0.06)] shrink-0">
                    <Upload size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[15px] text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{t('restoreImport')}</span>
                    <span className="text-[11px] font-medium text-slate-400/85 mt-0.5 leading-normal whitespace-normal break-words">{t('restoreImportDesc')}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 ml-3" />
              </button>

            </div>
          </section>
          )}

          {/* PRIVASI & KEAMANAN */}
          {activeSection === 'security' && (
          <section>
            <h3 className="text-[11px] font-bold text-slate-400/80 uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2.5">
              <Lock size={14} className="text-rose-400" /> {t('securityAdvanced')}
            </h3>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-lg shadow-slate-950/20 flex flex-col overflow-hidden divide-y divide-slate-800/30">
              
              <div className="flex items-center justify-between p-5 sm:p-6">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.06)] transition-all shrink-0 ${appPin ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-slate-800/80 text-slate-400 border border-slate-750'}`}>
                    <Lock size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[15px] text-slate-200 truncate">{t('pinLock')}</span>
                    <span className="text-[11px] font-medium text-slate-400/85 mt-0.5 leading-normal whitespace-normal break-words">{t('pinLockDesc')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (appPin) {
                      setPinInput('');
                      setPinError(false);
                      setPinModalMode('remove');
                    } else {
                      setPinInput('');
                      setPinError(false);
                      setPinModalMode('create');
                    }
                  }}
                  className={`w-12 h-7 rounded-full flex items-center p-1 transition-all duration-300 shadow-inner shrink-0 ml-3 ${appPin ? 'bg-rose-500' : 'bg-slate-700/50 border border-slate-600/20'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${appPin ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {appPin && (
                <button 
                  onClick={() => {
                    setPinInput('');
                    setPinError(false);
                    setPinModalMode('verify');
                  }}
                  className="group flex items-center justify-between p-5 sm:p-6 hover:bg-slate-800/20 transition-all duration-200 text-left active:scale-[0.995] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.06)] shrink-0">
                      <Key size={18} />
                    </div>
                    <span className="font-bold text-[15px] text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{t('changePin')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 ml-3" />
                </button>
              )}

              <button 
                onClick={() => setShowResetConfirm(true)}
                className="group flex items-center justify-between p-5 sm:p-6 hover:bg-red-500/5 transition-all duration-200 text-left active:scale-[0.995] cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-colors shadow-inner shrink-0">
                    <Trash2 size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[15px] text-red-500 group-hover:text-red-400 transition-colors truncate">{t('reset')}</span>
                    <span className="text-[11px] font-medium text-slate-400/85 mt-0.5 leading-normal whitespace-normal break-words">{t('resetConfirm')}</span>
                  </div>
                </div>
              </button>

            </div>
          </section>
          )}

          {/* HIBURAN */}
          {activeSection === 'about' && !isLiteMode && (
          <section>
            <h3 className="text-[11px] font-bold text-slate-400/80 uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2.5">
              <Gamepad2 size={14} className="text-purple-400" /> {t('entertainment')}
            </h3>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-lg shadow-slate-950/20 flex flex-col overflow-hidden divide-y divide-slate-800/30">
              <button 
                onClick={() => onNavigate && onNavigate('games-hub')}
                className="group flex items-center justify-between p-5 sm:p-6 hover:bg-slate-800/20 transition-all duration-200 w-full text-left active:scale-[0.995] cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.06)] shrink-0">
                    <Gamepad2 size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[15px] text-slate-200 group-hover:text-indigo-400 transition-colors truncate">Mini Games</span>
                    <span className="text-[11px] font-medium text-slate-400/85 mt-0.5 leading-normal whitespace-normal break-words">{t('entertainmentDesc')}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 ml-3" />
              </button>
            </div>
          </section>
          )}
          
          {/* TENTANG APLIKASI */}
          {activeSection === 'about' && (
          <section className="pb-4">
            <h3 className="text-[11px] font-bold text-slate-400/80 uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2.5">
              <Info size={14} className="text-sky-400" /> {t('aboutApp')}
            </h3>
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-lg shadow-slate-950/20 flex flex-col overflow-hidden divide-y divide-slate-800/30">
              
              <div className="flex items-center justify-between p-5 sm:p-6">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900/60 text-slate-300 border border-slate-800 flex items-center justify-center shadow-inner shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <span className="font-bold text-[15px] text-slate-200 truncate">{t('appVersion')}</span>
                </div>
                <span className="font-black text-[11px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-center shrink-0 ml-3">v3.0</span>
              </div>

              <button onClick={() => setShowUpdateNotes(true)} className="group flex items-center justify-between p-5 sm:p-6 hover:bg-slate-800/20 transition-all duration-200 w-full text-left active:scale-[0.995] cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900/60 text-slate-300 border border-slate-800 flex items-center justify-center shadow-inner shrink-0">
                    <FileText size={18} />
                  </div>
                  <span className="font-bold text-[15px] text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{t('updateNotes')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 ml-3" />
              </button>

              <button onClick={() => setShowPrivacyPolicy(true)} className="group flex items-center justify-between p-5 sm:p-6 hover:bg-slate-800/20 transition-all duration-200 w-full text-left active:scale-[0.995] cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900/60 text-slate-300 border border-slate-800 flex items-center justify-center shadow-inner shrink-0">
                    <Shield size={18} />
                  </div>
                  <span className="font-bold text-[15px] text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{t('privacyPolicy')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 ml-3" />
              </button>

              <div className="flex flex-col p-5 sm:p-6 bg-slate-950/15">
                <p className="text-xs text-slate-400/80 font-medium leading-relaxed mb-4 text-center">
                  {lang === 'id' 
                    ? 'Saran dan kritik Anda sangat berarti bagi kami. Silakan hubungi Instagram Noto.' 
                    : 'Your suggestions and feedback are very meaningful to us. Please contact Noto on Instagram.'}
                </p>
                <button 
                  onClick={() => window.open('https://instagram.com/noto.grow', '_blank')} 
                  className="flex items-center justify-center gap-2 p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all w-full border border-indigo-500/20 font-bold text-[14px] shadow-sm active:scale-95 cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>@noto.grow</span>
                </button>
              </div>

            </div>
            
            <div className="mt-8 mb-4 mx-2 p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-sm hidden">
              <p className="text-xs text-slate-400/80 font-medium text-center leading-relaxed">
                {lang === 'id'
                  ? 'Noto saat ini masih dalam tahap pengembangan dan belum ada versi Aplikasi.'
                  : 'Noto is currently still in development and does not have an App version yet.'}
              </p>
            </div>

            <div className="mt-12 text-center pb-8 opacity-60 hover:opacity-100 transition-opacity">
              <p className="text-sm font-black tracking-[0.3em] uppercase text-slate-400">NOTO</p>
              <p className="text-[11px] font-medium text-slate-600 mt-2">{t('madeWithSimplicity')}</p>
            </div>
          </section>
          )}

            </div>
          )}

        {pinModalMode && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className={`bg-slate-900 border border-slate-800/80 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl relative ${pinError ? 'animate-pulse border-red-500/50' : ''}`}>
              <h3 className="text-xl font-bold text-slate-50 mb-1.5 text-center">
                {pinModalMode === 'create' && t('createPin')}
                {(pinModalMode === 'verify' || pinModalMode === 'remove') && t('verifyPin')}
                {pinModalMode === 'change' && t('changePin')}
              </h3>
              <p className="text-xs text-slate-400 mb-5 text-center leading-normal">
                {t('enter4Digits')}
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                style={{ WebkitTextSecurity: 'disc' }}
                maxLength={4}
                autoFocus
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePinSubmit();
                  }
                }}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-50 text-xl tracking-[1.2em] font-mono text-center mb-5 outline-none focus:border-indigo-500/60 focus:bg-slate-950/90 transition-all shadow-inner"
                placeholder="••••"
              />
              {(pinModalMode === 'create' || pinModalMode === 'change') && (
                <div className="space-y-3 mb-6">
                  <input
                    type="text"
                    value={pinQuestionInput}
                    onChange={e => setPinQuestionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handlePinSubmit();
                      }
                    }}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-slate-50 text-sm outline-none focus:border-indigo-500/60 transition-all placeholder-slate-600"
                    placeholder={t('securityQuestionPlaceholder')}
                  />
                  <input
                    type="text"
                    value={pinAnswerInput}
                    onChange={e => setPinAnswerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handlePinSubmit();
                      }
                    }}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-slate-50 text-sm outline-none focus:border-indigo-500/60 transition-all placeholder-slate-600"
                    placeholder={t('securityAnswerPlaceholder')}
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setPinModalMode(null);
                    setPinInput('');
                    setPinQuestionInput('');
                    setPinAnswerInput('');
                    setPinError(false);
                  }}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-200 bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button 
                  disabled={pinInput.length !== 4 || ((pinModalMode === 'create' || pinModalMode === 'change') && (!pinQuestionInput.trim() || !pinAnswerInput.trim()))}
                  onClick={handlePinSubmit}
                  className={`flex-1 py-3 rounded-2xl text-slate-950 text-sm font-extrabold transition-all active:scale-[0.98] cursor-pointer ${pinInput.length === 4 && (!['create', 'change'].includes(pinModalMode) || (pinQuestionInput.trim() && pinAnswerInput.trim())) ? 'bg-indigo-400 hover:bg-indigo-300 shadow-md shadow-indigo-500/20' : 'bg-slate-850 text-slate-500 cursor-not-allowed opacity-50'}`}
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showResetConfirm && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-4 md:p-4 rounded-3xl w-full max-w-sm">
              <h3 className="text-xl font-bold text-red-400 mb-2">{t('reset')}</h3>
              <p className="text-sm text-slate-400 mb-6">
                {t('resetConfirmDescription')}
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 bg-slate-800 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={async () => {
                    setIsResetting(true);
                    setShowResetConfirm(false);
                    await clearAllData();
                    setTimeout(() => {
                      window.location.reload();
                    }, 800);
                  }}
                  className="px-4 py-2 rounded-xl text-white text-sm font-bold bg-red-500 hover:bg-red-600 transition-colors"
                >
                  {t('yesReset')}
                </button>
              </div>
            </div>
          </div>
        )}

        {backupModalMode && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-6 z-50 overflow-y-auto">
            <div className={`bg-slate-900 border border-slate-800/80 p-5 md:p-6 rounded-[2rem] w-full max-w-lg shadow-2xl relative ${backupError ? 'animate-pulse border-red-500/50' : ''} max-h-[90vh] flex flex-col`}>
              
              <div className="flex-none mb-4">
                <h3 className="text-xl font-extrabold text-slate-50 tracking-tight flex items-center gap-2">
                  <Download className="w-5 h-5 text-indigo-400" />
                  {backupModalMode === 'export' 
                    ? (lang === 'id' ? 'Ekspor Cadangan Lengkap' : 'Export Full Backup')
                    : (lang === 'id' ? 'Impor File Cadangan' : 'Import Backup File')}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-normal">
                  {backupModalMode === 'export'
                    ? (lang === 'id' 
                      ? 'Pilih data yang ingin Anda cadangkan. Opsi default akan mencadangkan seluruh aplikasi (kembali seperti awal pasca-impor).'
                      : 'Choose data to backup. Default options will back up the entire application.')
                    : (lang === 'id' 
                      ? 'Masukkan kata sandi jika file cadangan ini dienkripsi sebelumnya.'
                      : 'Enter password if this backup file was previously encrypted.')}
                </p>
              </div>

              {backupModalMode === 'export' ? (
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-5 no-scrollbar">
                  
                  {/* IMPORTANT DATA GROUP */}
                  <div>
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 px-1">
                      {lang === 'id' ? 'Data Sangat Penting (Rekomendasi)' : 'Highly Important Data (Recommended)'}
                    </h4>
                    <div className="space-y-2">
                      {[
                        { 
                          key: 'notes', 
                          title: lang === 'id' ? 'Catatan & Jurnal pribadi' : 'Notes & Journals',
                          desc: lang === 'id' ? 'Semua teks, lampiran, dan jurnal harian Anda.' : 'All your text entries, attachments, and daily journals.',
                          icon: '📝'
                        },
                        { 
                          key: 'tasks', 
                          title: lang === 'id' ? 'Daftar Tugas & Kebiasaan' : 'Tasks & Habits',
                          desc: lang === 'id' ? 'Target harian, status tugas, dan streak disiplin.' : 'Daily targets, task completion states, and discipline streaks.',
                          icon: '✅'
                        },
                        { 
                          key: 'transactions', 
                          title: lang === 'id' ? 'Keuangan & Target Tabungan' : 'Finances & Savings Target',
                          desc: lang === 'id' ? 'Seluruh laporan transaksi pemasukan/pengeluaran dan tabungan.' : 'All cashflow logs, savings targets, and balance.',
                          icon: '💰'
                        }
                      ].map((item) => (
                        <label 
                          key={item.key}
                          className="flex items-start gap-3 p-3 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/80 rounded-2xl cursor-pointer transition-all active:scale-[0.995]"
                        >
                          <input 
                            type="checkbox"
                            checked={(exportOptions as any)[item.key]}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="w-4 h-4 mt-0.5 rounded text-indigo-500 bg-slate-900 border-slate-800 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">{item.icon}</span>
                              <span className="text-xs font-black text-slate-100">{item.title}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{item.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* OPTIONAL DATA GROUP */}
                  <div>
                    <h4 className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest mb-2 px-1">
                      {lang === 'id' ? 'Data Pendukung / Opsional (Kurang Penting)' : 'Supporting / Optional Data (Less Important)'}
                    </h4>
                    <div className="space-y-2">
                      {[
                        { 
                          key: 'moods', 
                          title: lang === 'id' ? 'Riwayat Suasana Hati / Mood' : 'Mood Log History',
                          desc: lang === 'id' ? 'Catatan pelacakan emosi dan kondisi mental harian.' : 'Emotion tracking history and mental state logs.',
                          icon: '🎭'
                        },
                        { 
                          key: 'userProfile', 
                          title: lang === 'id' ? 'Profil Pengguna & Streak' : 'User Profile & Streak info',
                          desc: lang === 'id' ? 'Nama panggilan, streak login, dan pengaturan onboard.' : 'User nickname, login streak data, and onboarding info.',
                          icon: '👤'
                        },
                        { 
                          key: 'settings', 
                          title: lang === 'id' ? 'Pengaturan & PIN Kunci Keamanan' : 'App Settings & PIN Lock',
                          desc: lang === 'id' ? 'Bahasa, jam pengingat harian, dan PIN masuk aplikasi.' : 'Language, daily reminder alarm, and app entry PIN passcode.',
                          icon: '⚙️'
                        },
                        { 
                          key: 'wallpaper', 
                          title: lang === 'id' ? 'Wallpaper & Tema Kustom' : 'Custom Wallpapers & Theme',
                          desc: lang === 'id' ? 'Gambar latar belakang utama dan tema warna yang Anda atur.' : 'Home background pictures and custom color themes.',
                          icon: '🖼️'
                        }
                      ].map((item) => (
                        <label 
                          key={item.key}
                          className="flex items-start gap-3 p-3 bg-slate-950/20 hover:bg-slate-950/55 border border-slate-800/50 rounded-2xl cursor-pointer transition-all active:scale-[0.995]"
                        >
                          <input 
                            type="checkbox"
                            checked={(exportOptions as any)[item.key]}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="w-4 h-4 mt-0.5 rounded text-indigo-500 bg-slate-900 border-slate-800 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">{item.icon}</span>
                              <span className="text-xs font-bold text-slate-200">{item.title}</span>
                              <span className="bg-slate-800 border border-slate-700/60 text-slate-400 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ml-auto scale-90 shrink-0">
                                {lang === 'id' ? 'Opsional' : 'Optional'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{item.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SECURITY PASSWORD IN ACCORDION / BOX */}
                  <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block mb-1.5">
                      {lang === 'id' ? 'Kata Sandi Cadangan (Opsional)' : 'Backup Password (Optional)'}
                    </span>
                    <p className="text-[10px] text-slate-400 mb-2.5 leading-normal">
                      {lang === 'id' 
                        ? 'Kosongkan jika tidak ingin mengenkripsi file cadangan Anda.' 
                        : 'Leave blank if you do not want to encrypt your backup file.'}
                    </p>
                    <input
                      type="password"
                      value={backupPassword}
                      onChange={e => setBackupPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-50 text-xs text-center outline-none focus:border-indigo-500 transition-colors"
                      placeholder={lang === 'id' ? 'Masukkan Kata Sandi' : 'Enter Password'}
                    />
                  </div>

                </div>
              ) : (
                <div className="flex-1 space-y-4 mb-5">
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block mb-2">
                      {lang === 'id' ? 'Kata Sandi File Terenkripsi' : 'Encrypted File Password'}
                    </span>
                    <p className="text-xs text-slate-400 mb-3 leading-normal">
                      {lang === 'id'
                        ? 'Jika file cadangan dilindungi kata sandi, masukkan di bawah ini agar data dapat didekripsi.'
                        : 'If the backup file was password-protected, enter it below to decrypt your data.'}
                    </p>
                    <input
                      type="password"
                      value={backupPassword}
                      onChange={e => setBackupPassword(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          processImport();
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 text-center outline-none focus:border-indigo-500 transition-colors"
                      placeholder={lang === 'id' ? 'Sandi File (kosongkan jika tidak ada)' : 'File Password (leave blank if none)'}
                    />
                  </div>
                </div>
              )}

              <div className="flex-none flex gap-3 pt-3 border-t border-slate-800/40">
                <button 
                  onClick={() => {
                    setBackupModalMode(null);
                    setBackupPassword('');
                    setBackupFileContent(null);
                    setBackupError(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={backupModalMode === 'export' ? processExport : processImport}
                  className="flex-1 py-3.5 rounded-2xl text-slate-950 text-xs font-black transition-all active:scale-[0.98] cursor-pointer text-center bg-indigo-400 hover:bg-indigo-300 shadow-lg shadow-indigo-500/20"
                >
                  {backupModalMode === 'export' 
                    ? (lang === 'id' ? 'Ekspor Sekarang' : 'Export Now') 
                    : t('importLabel')}
                </button>
              </div>

            </div>
          </div>
        )}

        {toastMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 shadow-2xl px-6 py-3 rounded-full text-slate-50 text-sm font-medium z-[100] animate-in slide-in-from-bottom-5">
            {toastMessage}
          </div>
        )}

        {/* Privacy Policy Modal */}
        {showPrivacyPolicy && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border border-slate-700 shadow-2xl p-4 md:p-4 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-50">{t('privacyPolicy')}</h3>
              </div>

              <div className="overflow-y-auto pr-3 flex-1 space-y-5 mb-6 custom-scrollbar text-sm text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-50 text-lg mb-1">{t('privacyPolicy1')}</h4>
                  <p className="text-slate-400">{t('privacyPolicy2')}</p>
                </div>
                
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <div>
                    <h5 className="font-semibold text-emerald-400 mb-1 flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{t('privacyPolicy3')}</span>
                    </h5>
                    <p className="pl-6 opacity-90 text-xs">{t('privacyPolicy4')}</p>
                  </div>
                  <div className="bg-slate-800/80 h-[1px] w-full"></div>
                  <div>
                    <h5 className="font-semibold text-emerald-400 mb-1 flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{t('privacyPolicy5')}</span>
                    </h5>
                    <p className="pl-6 opacity-90 text-xs">{t('privacyPolicy6')}</p>
                  </div>
                  <div className="bg-slate-800/80 h-[1px] w-full"></div>
                  <div>
                    <h5 className="font-semibold text-emerald-400 mb-1 flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{t('privacyPolicy7')}</span>
                    </h5>
                    <p className="pl-6 opacity-90 text-xs">{t('privacyPolicy8')}</p>
                  </div>
                </div>

                <div className="px-2 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-200">
                  <p className="font-medium text-center text-xs">{t('privacyPolicy9')}</p>
                </div>
                
                <div className="mt-6 border-t border-slate-800 pt-5">
                  <h4 className="font-bold text-slate-50 text-lg mb-1">{t('auditorGuide')}</h4>
                  <p className="text-slate-400 mb-4">{t('auditorGuideDesc')}</p>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-3">
                      <h5 className="font-semibold text-sky-400 text-sm mb-1">{t('auditorStep1')}</h5>
                      <p className="text-slate-400 text-xs">{t('auditorStep1Desc')}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-3">
                      <h5 className="font-semibold text-sky-400 text-sm mb-1">{t('auditorStep2')}</h5>
                      <p className="text-slate-400 text-xs">{t('auditorStep2Desc')}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-3">
                      <h5 className="font-semibold text-sky-400 text-sm mb-1">{t('auditorStep3')}</h5>
                      <p className="text-slate-400 text-xs">{t('auditorStep3Desc')}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-800 pt-5">
                  <h4 className="font-bold text-slate-50 text-lg mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-emerald-400" />
                    {t('auditThreatModelTitle')}
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-slate-900 border border-slate-700/50 border-l-4 border-l-indigo-500 rounded-xl p-3">
                      <p className="text-slate-300 text-xs leading-relaxed">{t('auditThreatModel1')}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-700/50 border-l-4 border-l-emerald-500 rounded-xl p-3">
                      <p className="text-slate-300 text-xs leading-relaxed">{t('auditThreatModel2')}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-700/50 border-l-4 border-l-sky-500 rounded-xl p-3">
                      <p className="text-slate-300 text-xs leading-relaxed">{t('auditThreatModel3')}</p>
                    </div>
                    {t('auditThreatModel4') && (
                      <div className="bg-slate-900 border border-slate-700/50 border-l-4 border-l-amber-500 rounded-xl p-3">
                        <p className="text-slate-300 text-xs leading-relaxed">{t('auditThreatModel4')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-800 pt-5">
                  <h4 className="font-bold text-slate-50 text-lg mb-3">{t('auditChecklistTitle')}</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✅</span>
                      <span className="text-slate-300 text-xs">{t('auditChecklist1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✅</span>
                      <span className="text-slate-300 text-xs">{t('auditChecklist2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✅</span>
                      <span className="text-slate-300 text-xs">{t('auditChecklist3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✅</span>
                      <span className="text-slate-300 text-xs">{t('auditChecklist4')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✅</span>
                      <span className="text-slate-300 text-xs">{t('auditChecklist5')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✅</span>
                      <span className="text-slate-300 text-xs">{t('auditChecklist6')}</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 border-t border-slate-800 pt-5">
                  <h4 className="font-bold text-slate-50 text-lg mb-3">{t('auditRisksTitle')}</h4>
                  <ul className="space-y-3 list-disc pl-5 text-amber-500 text-xs">
                    <li><span className="text-slate-300 leading-relaxed">{t('auditRisks1')}</span></li>
                    <li><span className="text-slate-300 leading-relaxed">{t('auditRisks2')}</span></li>
                  </ul>
                </div>

                <div className="mt-6 border-t border-slate-800 pt-5 pb-2">
                  <h4 className="font-bold text-slate-50 text-lg mb-2">{t('auditRationaleTitle')}</h4>
                  <div className="px-4 py-3 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
                    <p className="text-slate-400 text-xs italic leading-relaxed text-center">"{t('auditRationaleDesc')}"</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowPrivacyPolicy(false)}
                className="w-full py-3.5 rounded-xl text-slate-900 text-sm font-bold bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* Update Notes / About App Modal */}
        {showUpdateNotes && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-4 md:p-4 rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col">
              <h3 className="text-xl font-bold text-slate-50 mb-4">{t('aboutAppTitle')}</h3>
              <div className="overflow-y-auto pr-2 flex-1 space-y-4 mb-6 custom-scrollbar text-sm text-slate-300">
                <p><strong>Noto v3.0</strong></p>
                <p>{t('aboutAppDesc')}</p>
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-amber-200">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 mb-1">{t('aboutAppStorageWarningTitle')}</h4>
                    <p className="text-[11px] md:text-xs leading-relaxed text-slate-300 whitespace-pre-line">{t('aboutAppStorageWarningDesc')}</p>
                  </div>
                </div>

                <p><strong>{t('aboutAppWhatsNew')}</strong></p>
                <ul className="space-y-4">
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('appUpdateTitle')}</strong> <span className="text-emerald-200">{t('appUpdateBody')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat11')}</strong> <span>{t('aboutAppFeat11Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat1')}</strong> <span>{t('aboutAppFeat1Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat2')}</strong> <span>{t('aboutAppFeat2Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat3')}</strong> <span>{t('aboutAppFeat3Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat4')}</strong> <span>{t('aboutAppFeat4Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat5')}</strong> <span>{t('aboutAppFeat5Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat6')}</strong> <span>{t('aboutAppFeat6Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat7')}</strong> <span>{t('aboutAppFeat7Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat8')}</strong> <span>{t('aboutAppFeat8Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat9')}</strong> <span>{t('aboutAppFeat9Desc')}</span></li>
                  <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat10')}</strong> <span>{t('aboutAppFeat10Desc')}</span></li>
                </ul>
                
                <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-400 text-center leading-relaxed">
                  <p>{t('copyrightText')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUpdateNotes(false)}
                className="w-full py-3 rounded-xl text-white text-sm font-bold bg-indigo-500 hover:bg-indigo-600 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}

function ToggleItem({ label, active, onChange, border }: { label: string, active: boolean, onChange: () => void, border?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 px-5 ${border ? 'border-b border-slate-800' : ''}`}>
      <span className="font-medium text-sm text-slate-300">{label}</span>
      <button 
        onClick={onChange}
        className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors ${active ? 'bg-indigo-500' : 'bg-slate-700'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

