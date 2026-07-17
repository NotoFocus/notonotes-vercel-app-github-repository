import React, { useState, useEffect } from 'react';
import { 
  Download, Upload, Lock, Smartphone, ChevronRight, ChevronLeft, User, 
  Globe, Key, Trash2, Info, AlertTriangle, Image as ImageIcon, RefreshCw, 
  Database, ChevronDown, Check, UserCheck, ShieldCheck, HelpCircle, Palette,
  History as HistoryIcon, Bot, Eye, EyeOff, ExternalLink
} from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { ScreenItem } from '../App';
import { generateId, encryptData, decryptData, hashPin } from '../utils';
import { getLargeItem, getLargeItemSync, setLargeItem } from '../utils/db';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import UpdateNotesModal from '../components/UpdateNotesModal';

export default function SettingsScreen({ 
  appTheme, 
  setAppTheme, 
  onNavigate,
  activeSection: activeSectionProp,
  setActiveSection: setActiveSectionProp,
  onBack
}: { 
  appTheme: string, 
  setAppTheme: (t: any) => void, 
  onNavigate?: (s: ScreenItem) => void,
  activeSection?: 'appearance' | 'security' | 'backup' | 'about' | 'ai' | null,
  setActiveSection?: (s: 'appearance' | 'security' | 'backup' | 'about' | 'ai' | null) => void,
  onBack?: () => void
}) {
  const { 
    transactions, notes, tasks, user, updateUser, appPin, setAppPin, 
    pinRecoveryQuestion, setPinRecoveryQuestion, pinRecoveryAnswer, setPinRecoveryAnswer, 
    pinHistory, recordPinChange,
    setIsUnlocked, importData, importFullBackup, clearAllData, lang, setLang, streak, 
    moods, savingsTarget, savingsTargetTitle, savingsBalance, hasCompletedOnboarding, archivedTags,
    isRefreshing, refreshStep, handleRefreshApp, isLiteMode, setIsLiteMode,
    autoBackupFrequency, setAutoBackupFrequency, autoBackupFilenamePrefix, setAutoBackupFilenamePrefix, 
    lastAutoBackupTimestamp, setLastAutoBackupTimestamp,
    autoBackupPin: storeAutoBackupPin, setAutoBackupPin, autoBackupPinHistory, setAutoBackupPinHistory, 
    recordAutoBackupPinChange, geminiApiKey, setGeminiApiKey
  } = useAppStore();
  
  const t = useTranslation(lang);

  // Categorized active section (prop controlled or fallback local state)
  const [localActiveSection, setLocalActiveSection] = useState<'appearance' | 'security' | 'backup' | 'about' | 'ai' | null>(null);
  const currentActiveSection = activeSectionProp !== undefined ? activeSectionProp : localActiveSection;
  const updateActiveSection = (section: 'appearance' | 'security' | 'backup' | 'about' | 'ai' | null) => {
    if (setActiveSectionProp) {
      setActiveSectionProp(section);
    } else {
      setLocalActiveSection(section);
    }
  };

  const handleBackSection = () => {
    if (setActiveSectionProp) {
      window.history.back();
    } else {
      setLocalActiveSection(null);
    }
  };

  const handleMainBack = () => {
    if (currentActiveSection !== null) {
      handleBackSection();
    } else if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  // Re-map for existing code to work seamlessly
  const activeSection = currentActiveSection;
  const setActiveSection = (section: 'appearance' | 'security' | 'backup' | 'about' | 'ai' | null) => {
    if (section === null) {
      handleBackSection();
    } else {
      updateActiveSection(section);
    }
  };

  // Modal display states
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
  
  // Custom wallpaper states
  const [localCustomWallpaper, setLocalCustomWallpaper] = useState<string | null>(() => getLargeItemSync("noto_custom_wallpaper"));
  const [localBannerWallpaper, setLocalBannerWallpaper] = useState<string | null>(() => getLargeItemSync("noto_banner_wallpaper"));

  // Auto-backup configuration
  const [backupModalMode, setBackupModalMode] = useState<'export' | 'import' | null>(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupFileContent, setBackupFileContent] = useState<string | null>(null);
  const [backupError, setBackupError] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    notes: true,
    tasks: true,
    transactions: true,
    moods: true,
    userProfile: true,
    settings: true,
  });

  const [pendingAutoBackupFreq, setPendingAutoBackupFreq] = useState<'off' | '3_days' | '1_week' | '1_month' | null>(null);
  const [showAutoBackupEnableVerify, setShowAutoBackupEnableVerify] = useState(false);
  const [autoBackupEnableVerifyPin, setAutoBackupEnableVerifyPin] = useState('');
  const [autoBackupEnableVerifyError, setAutoBackupEnableVerifyError] = useState(false);

  const [showAutoBackupPinSetup, setShowAutoBackupPinSetup] = useState(false);
  const [autoBackupPinSetupPin, setAutoBackupPinSetupPin] = useState('');
  const [autoBackupPinSetupConfirm, setAutoBackupPinSetupConfirm] = useState('');
  const [autoBackupPinSetupStep, setAutoBackupPinSetupStep] = useState<1 | 2>(1);
  const [autoBackupPinSetupError, setAutoBackupPinSetupError] = useState(false);

  const [showAutoBackupPinChange, setShowAutoBackupPinChange] = useState(false);
  const [autoBackupPinChangeCurrent, setAutoBackupPinChangeCurrent] = useState('');
  const [autoBackupPinChangeNew, setAutoBackupPinChangeNew] = useState('');
  const [autoBackupPinChangeConfirm, setAutoBackupPinChangeConfirm] = useState('');
  const [autoBackupPinChangeStep, setAutoBackupPinChangeStep] = useState<1 | 2 | 3>(1);
  const [autoBackupPinChangeError, setAutoBackupPinChangeError] = useState(false);
  const [autoBackupPinChangeErrorType, setAutoBackupPinChangeErrorType] = useState<'wrong_current' | 'mismatch' | null>(null);

  const [showPinHistoryDropdown, setShowPinHistoryDropdown] = useState(false);
  const [showAutoBackupPinHistoryDropdown, setShowAutoBackupPinHistoryDropdown] = useState(false);
  const [testNotifMsg, setTestNotifMsg] = useState<string | null>(null);

  // BYOK Gemini API Key settings state
  const [testApiKey, setTestApiKey] = useState(geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>(geminiApiKey ? 'connected' : 'idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setTestApiKey(geminiApiKey || '');
    setConnectionStatus(geminiApiKey ? 'connected' : 'idle');
  }, [geminiApiKey]);

  // Refs for focusing inputs
  const enableVerifyInputRef = React.useRef<HTMLInputElement | null>(null);
  const pinSetupInputRef = React.useRef<HTMLInputElement | null>(null);
  const pinChangeInputRef = React.useRef<HTMLInputElement | null>(null);

  // Auto-focus verify modal input
  useEffect(() => {
    if (showAutoBackupEnableVerify) {
      setTimeout(() => enableVerifyInputRef.current?.focus(), 100);
    }
  }, [showAutoBackupEnableVerify]);

  // Auto-focus setup modal input
  useEffect(() => {
    if (showAutoBackupPinSetup) {
      setTimeout(() => pinSetupInputRef.current?.focus(), 100);
    }
  }, [showAutoBackupPinSetup, autoBackupPinSetupStep]);

  // Auto-focus change modal input
  useEffect(() => {
    if (showAutoBackupPinChange) {
      setTimeout(() => pinChangeInputRef.current?.focus(), 100);
    }
  }, [showAutoBackupPinChange, autoBackupPinChangeStep]);

  // Sync recovery question/answer pre-filling when creating or changing app PIN
  useEffect(() => {
    if (pinModalMode === 'create' || pinModalMode === 'change') {
      setPinQuestionInput(pinRecoveryQuestion || '');
      setPinAnswerInput(pinRecoveryAnswer || '');
    }
  }, [pinModalMode, pinRecoveryQuestion, pinRecoveryAnswer]);

  // Initialize and load custom wallpapers
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

  // Wallpaper Upload triggers
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
          showNotificationToast(lang === 'id' ? 'Wallpaper berhasil diperbarui!' : 'Wallpaper updated successfully!');
        })
        .catch(() => {
          showNotificationToast(lang === 'id' ? 'Gagal menyimpan wallpaper!' : 'Failed to save wallpaper!');
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
          showNotificationToast(lang === 'id' ? 'Wallpaper kotak utama diperbarui!' : 'Main wallpaper updated!');
        })
        .catch(() => {
          showNotificationToast(lang === 'id' ? 'Gagal menyimpan wallpaper!' : 'Failed to save wallpaper!');
        });
    };
    reader.readAsDataURL(file);
  };

  const showNotificationToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Notification Test helper
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
                try {
                  new window.Notification(title, options);
                } catch (e) {
                  console.warn("Notification construction failed:", e);
                }
              });
            }).catch(() => {
              try {
                new window.Notification(title, options);
              } catch (e) {
                console.warn("Notification construction failed:", e);
              }
            });
          } else {
            try {
              new window.Notification(title, options);
            } catch (e) {
              console.warn("Notification construction failed:", e);
            }
          }
          setTestNotifMsg(t('testNotifSuccess') || 'Uji coba sukses! Jika Anda tidak melihat spanduk, silakan aktifkan izin di pengaturan browser Anda.');
        } else {
          setTestNotifMsg(lang === 'id' ? 'Gagal: Izin notifikasi ditolak oleh browser.' : 'Failed: Notification permission denied.');
        }
      }).catch(() => {
        setTestNotifMsg(lang === 'id' ? 'Gagal: Tidak dapat meminta izin notifikasi.' : 'Failed: Could not request permission.');
      });
    } else {
      setTestNotifMsg(lang === 'id' ? 'Browser Anda tidak mendukung Notifikasi.' : 'Your browser does not support Notifications.');
    }
    setTimeout(() => setTestNotifMsg(null), 5000);
  };

  // Security PIN validation logic
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
      await recordPinChange(hashed);
      setPinRecoveryQuestion(pinQuestionInput.trim());
      setPinRecoveryAnswer(pinAnswerInput.trim().toLowerCase());
      setIsUnlocked(true);
      setPinModalMode(null);
      setPinInput('');
      setPinQuestionInput('');
      setPinAnswerInput('');
      showNotificationToast(lang === 'id' ? 'PIN Keamanan berhasil dipasang!' : 'Security PIN successfully saved!');
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
        await recordPinChange(null);
        setPinRecoveryQuestion(null);
        setPinRecoveryAnswer(null);
        setPinModalMode(null);
        setPinInput('');
        showNotificationToast(lang === 'id' ? 'PIN Keamanan berhasil dinonaktifkan.' : 'Security PIN disabled.');
      } else {
        setPinError(true);
        setPinInput('');
        setTimeout(() => setPinError(false), 500);
      }
    }
  };

  // Auto-backup verification and pin submits
  const handleAutoBackupVerifySubmit = async () => {
    if (autoBackupEnableVerifyPin.length !== 4) return;
    const { hashPin } = await import('../utils');
    const hashed = await hashPin(autoBackupEnableVerifyPin);
    if (hashed === storeAutoBackupPin || autoBackupEnableVerifyPin === storeAutoBackupPin) {
      if (pendingAutoBackupFreq) {
        setAutoBackupFrequency(pendingAutoBackupFreq);
        showNotificationToast(lang === 'id' ? 'Pencadangan otomatis diaktifkan!' : 'Auto-backup enabled!');
      }
      setShowAutoBackupEnableVerify(false);
      setAutoBackupEnableVerifyPin('');
      setPendingAutoBackupFreq(null);
    } else {
      setAutoBackupEnableVerifyError(true);
      setAutoBackupEnableVerifyPin('');
      setTimeout(() => setAutoBackupEnableVerifyError(false), 2000);
    }
  };

  const handleAutoBackupPinSetupSubmit = async () => {
    if (autoBackupPinSetupStep === 1) {
      if (autoBackupPinSetupPin.length === 4) {
        setAutoBackupPinSetupStep(2);
      }
    } else {
      if (autoBackupPinSetupPin === autoBackupPinSetupConfirm) {
        const { hashPin } = await import('../utils');
        const hashed = await hashPin(autoBackupPinSetupPin);
        await recordAutoBackupPinChange(hashed);
        
        if (pendingAutoBackupFreq) {
          setAutoBackupFrequency(pendingAutoBackupFreq);
          showNotificationToast(lang === 'id' ? 'PIN dibuat & Pencadangan diaktifkan!' : 'PIN saved & Auto-backup enabled!');
        }
        setShowAutoBackupPinSetup(false);
        setAutoBackupPinSetupPin('');
        setAutoBackupPinSetupConfirm('');
        setAutoBackupPinSetupStep(1);
        setPendingAutoBackupFreq(null);
      } else {
        setAutoBackupPinSetupError(true);
        setAutoBackupPinSetupConfirm('');
        setTimeout(() => setAutoBackupPinSetupError(false), 2000);
      }
    }
  };

  const handleAutoBackupPinChangeSubmit = async () => {
    const { hashPin } = await import('../utils');
    if (autoBackupPinChangeStep === 1) {
      const hashed = await hashPin(autoBackupPinChangeCurrent);
      if (hashed === storeAutoBackupPin || autoBackupPinChangeCurrent === storeAutoBackupPin) {
        setAutoBackupPinChangeStep(2);
        setAutoBackupPinChangeError(false);
      } else {
        setAutoBackupPinChangeError(true);
        setAutoBackupPinChangeErrorType('wrong_current');
        setAutoBackupPinChangeCurrent('');
        setTimeout(() => setAutoBackupPinChangeError(false), 2000);
      }
    } else if (autoBackupPinChangeStep === 2) {
      if (autoBackupPinChangeNew.length === 4) {
        setAutoBackupPinChangeStep(3);
      }
    } else {
      if (autoBackupPinChangeNew === autoBackupPinChangeConfirm) {
        const hashed = await hashPin(autoBackupPinChangeNew);
        await recordAutoBackupPinChange(hashed);
        setShowAutoBackupPinChange(false);
        setAutoBackupPinChangeCurrent('');
        setAutoBackupPinChangeNew('');
        setAutoBackupPinChangeConfirm('');
        setAutoBackupPinChangeStep(1);
        showNotificationToast(lang === 'id' ? 'PIN cadangan diperbarui!' : 'Backup PIN updated!');
      } else {
        setAutoBackupPinChangeError(true);
        setAutoBackupPinChangeErrorType('mismatch');
        setAutoBackupPinChangeConfirm('');
        setTimeout(() => setAutoBackupPinChangeError(false), 2000);
      }
    }
  };

  // Manual Backup trigger events
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
        exportData.isLiteMode = isLiteMode;
        exportData.autoBackupFrequency = autoBackupFrequency;
        exportData.autoBackupFilenamePrefix = autoBackupFilenamePrefix;
        exportData.autoBackupPin = storeAutoBackupPin;
        exportData.autoBackupPinHistory = autoBackupPinHistory;
      }

      const dataStr = JSON.stringify(exportData);
      let finalContent = dataStr;
      
      if (backupPassword) {
        const { encryptData } = await import('../utils');
        finalContent = await encryptData(dataStr, backupPassword);
      }

      const blob = new Blob([finalContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const d = new Date();
      const timestamp = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`;
      a.download = `noto_backup_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupModalMode(null);
      showNotificationToast(lang === 'id' ? 'Ekspor data berhasil!' : 'Data export successful!');
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

        const parsedMoods = data.moods || [];
        const seenMoodIds = new Set();
        const uniqueMoods = parsedMoods.map((m: any) => {
          if (seenMoodIds.has(m.id)) m.id = generateId();
          seenMoodIds.add(m.id);
          return m;
        });

        await importFullBackup({
          notes: uniqueNotes,
          tasks: uniqueTasks,
          transactions: uniqueTransactions,
          moods: uniqueMoods,
          user: data.user || user,
          streak: data.streak || streak,
          appPin: data.appPin || appPin,
          pinRecoveryQuestion: data.pinRecoveryQuestion || pinRecoveryQuestion,
          pinRecoveryAnswer: data.pinRecoveryAnswer || pinRecoveryAnswer,
          lang: data.lang || lang,
          isLiteMode: data.isLiteMode !== undefined ? data.isLiteMode : isLiteMode,
          autoBackupFrequency: data.autoBackupFrequency || autoBackupFrequency,
          autoBackupFilenamePrefix: data.autoBackupFilenamePrefix || autoBackupFilenamePrefix,
          autoBackupPin: data.autoBackupPin || storeAutoBackupPin,
          autoBackupPinHistory: data.autoBackupPinHistory || autoBackupPinHistory
        });

        setBackupModalMode(null);
        showNotificationToast(lang === 'id' ? 'Pemulihan data berhasil! Memuat ulang...' : 'Restore successful! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setBackupError(true);
        setTimeout(() => setBackupError(false), 2000);
      }
    } catch(e) {
      setBackupError(true);
      setTimeout(() => setBackupError(false), 2000);
    }
  };

  const handleFrequencySelect = (freq: 'off' | '3_days' | '1_week' | '1_month') => {
    if (freq === 'off') {
      setAutoBackupFrequency('off');
      showNotificationToast(lang === 'id' ? 'Pencadangan otomatis dinonaktifkan.' : 'Auto-backup disabled.');
    } else {
      setPendingAutoBackupFreq(freq);
      if (!storeAutoBackupPin) {
        setAutoBackupPinSetupStep(1);
        setAutoBackupPinSetupPin('');
        setAutoBackupPinSetupConfirm('');
        setShowAutoBackupPinSetup(true);
      } else {
        setAutoBackupEnableVerifyPin('');
        setShowAutoBackupEnableVerify(true);
      }
    }
  };

  const renderAutoBackupSettings = () => {
    const frequencies = [
      { id: 'off', label: lang === 'id' ? 'Mati' : 'Off' },
      { id: '3_days', label: lang === 'id' ? '3 Hari' : '3 Days' },
      { id: '1_week', label: lang === 'id' ? '1 Mggu' : '1 Wk' },
      { id: '1_month', label: lang === 'id' ? '1 Bln' : '1 Mo' },
    ];

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Database size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-[14px] text-slate-200 block">
              {lang === 'id' ? 'Pencadangan Otomatis' : 'Auto Backup'}
            </h4>
            <span className="text-[11px] text-slate-400 block">
              {lang === 'id' 
                ? 'Secara otomatis mengunduh cadangan terenkripsi ke penyimpanan lokal Anda.' 
                : 'Automatically download encrypted backups to local storage.'}
            </span>
          </div>
        </div>

        {/* Frequency selector buttons */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
            {lang === 'id' ? 'Frekuensi Pencadangan' : 'Backup Frequency'}
          </label>
          <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-2xl w-full">
            {frequencies.map((freq) => {
              const isSelected = autoBackupFrequency === freq.id;
              return (
                <button
                  key={freq.id}
                  type="button"
                  onClick={() => handleFrequencySelect(freq.id as any)}
                  className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {freq.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filename Prefix Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
            {lang === 'id' ? 'Nama Awalan File' : 'Filename Prefix'}
          </label>
          <input 
            type="text"
            value={autoBackupFilenamePrefix}
            onChange={(e) => setAutoBackupFilenamePrefix(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-indigo-500/40 transition-colors placeholder-slate-700 font-medium"
            placeholder={lang === 'id' ? 'Nama file cadangan...' : 'Backup prefix...'}
          />
          {lastAutoBackupTimestamp > 0 && (
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {lang === 'id' 
                ? `Terakhir dicadangkan: ${new Date(lastAutoBackupTimestamp).toLocaleString('id-ID')}` 
                : `Last backup: ${new Date(lastAutoBackupTimestamp).toLocaleString()}`}
            </p>
          )}
        </div>

        {/* PIN Management for backup */}
        <div className="pt-3 border-t border-slate-850/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-slate-300 block">
                {lang === 'id' ? 'Keamanan PIN Cadangan' : 'Backup PIN Security'}
              </span>
              <span className="text-[10px] text-slate-500">
                {storeAutoBackupPin 
                  ? (lang === 'id' ? 'PIN aktif (Semua cadangan terenkripsi)' : 'PIN active (All backups are encrypted)')
                  : (lang === 'id' ? 'PIN tidak aktif (Cadangan tidak terenkripsi)' : 'No PIN (Backups are unencrypted)')}
              </span>
            </div>
            {storeAutoBackupPin && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAutoBackupPinChangeStep(1);
                    setAutoBackupPinChangeCurrent('');
                    setAutoBackupPinChangeNew('');
                    setAutoBackupPinChangeConfirm('');
                    setShowAutoBackupPinChange(true);
                  }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-indigo-400 transition-all cursor-pointer"
                >
                  {lang === 'id' ? 'Ubah PIN' : 'Change PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAutoBackupPinHistoryDropdown(!showAutoBackupPinHistoryDropdown)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 transition-all cursor-pointer"
                >
                  {showAutoBackupPinHistoryDropdown ? (lang === 'id' ? 'Tutup Riwayat' : 'Hide History') : (lang === 'id' ? 'Riwayat' : 'History')}
                </button>
              </div>
            )}
          </div>

          {/* Backup PIN History Dropdown */}
          {showAutoBackupPinHistoryDropdown && storeAutoBackupPin && (
            <div className="p-4 bg-slate-950/65 border border-slate-850 rounded-2xl space-y-2 animate-in fade-in duration-200 max-h-40 overflow-y-auto no-scrollbar">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                {lang === 'id' ? 'Riwayat PIN Cadangan' : 'Backup PIN Audit Log'}
              </span>
              {autoBackupPinHistory.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">
                  {lang === 'id' ? 'Tidak ada riwayat perubahan.' : 'No change history.'}
                </p>
              ) : (
                autoBackupPinHistory.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-[10px] py-1 border-b border-slate-900 last:border-0">
                    <span className="font-mono text-slate-400">
                      PIN Hashed: {entry.hashedPin.substring(0, 8)}...
                    </span>
                    <span className="text-slate-500">
                      {new Date(entry.startDate).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full font-sans text-slate-200">
      {/* Reset progress overlay */}
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

      {/* Header bar */}
      <div className="flex-none h-16 pt-[env(safe-area-inset-top)] border-b border-slate-800/40 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center gap-3 z-10">
        <button 
          onClick={handleMainBack}
          className="p-2 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
          title={lang === 'id' ? 'Kembali' : 'Back'}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-xl text-slate-50 tracking-tight">{t('settingsMenu')}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full">
        <div className="w-full px-4 sm:px-6 py-6 space-y-6 max-w-2xl mx-auto">
          
          {/* CATEGORY DASHBOARD INDEX */}
          {activeSection === null && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Profile Card Banner */}
              <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row w-full sm:w-auto">
                  <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-indigo-500/20 overflow-hidden flex items-center justify-center shrink-0">
                    {user.avatarUrl === 'indexeddb:user_avatar' ? (
                      <div className="w-full h-full bg-slate-800 animate-pulse" />
                    ) : user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-100 tracking-tight">
                      {lang === 'id' ? `Halo, ${user.name || 'Pengguna'}!` : `Hello, ${user.name || 'User'}!`}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {isLiteMode 
                        ? (lang === 'id' ? 'Tampilan Lite aktif untuk fokus maksimal.' : 'Lite mode active for maximum focus.')
                        : (lang === 'id' ? 'Tampilan Pro aktif dengan penyesuaian visual penuh.' : 'Pro mode active with full personalization.')
                      }
                    </p>
                  </div>
                </div>

                {streak > 0 && (
                  <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center gap-2 shrink-0 self-center sm:self-auto animate-pulse">
                    <span className="text-base">🔥</span>
                    <span className="text-xs font-black text-amber-400">{streak} {lang === 'id' ? 'Hari Beruntun' : 'Day Streak'}</span>
                  </div>
                )}
              </div>

              {/* Mode Selector Option (Pro vs Lite switch) */}
              <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-[14px] text-slate-200">{lang === 'id' ? 'Tipe Tampilan' : 'Display Mode'}</span>
                    <span className="text-xs text-slate-400 leading-normal mt-0.5">{lang === 'id' ? 'Sembunyikan fitur tambahan (Games, Wallpaper) agar lebih fokus.' : 'Hide extra features (Games, Wallpaper) for a cleaner layout.'}</span>
                  </div>
                </div>
                <div className="flex bg-slate-950/60 p-1 border border-slate-850 rounded-xl shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setIsLiteMode(true);
                      showNotificationToast(lang === 'id' ? 'Mode Lite aktif! Tampilan sangat bersih.' : 'Lite Mode active! Clean interface.');
                    }}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                      isLiteMode ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Lite Mode ⚡
                  </button>
                  <button
                    onClick={() => {
                      setIsLiteMode(false);
                      showNotificationToast(lang === 'id' ? 'Mode Pro aktif! Semua fitur kustomisasi terbuka.' : 'Pro Mode active! All customizations enabled.');
                    }}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                      !isLiteMode ? 'bg-indigo-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pro Mode 👑
                  </button>
                </div>
              </div>

              {/* Categorized Menu List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Appearance Section Card */}
                <button 
                  onClick={() => setActiveSection('appearance')}
                  className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Palette size={18} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-indigo-400 transition-colors">{lang === 'id' ? 'Tampilan & Profil' : 'Appearance & Profile'}</span>
                      <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Kelola nama, avatar, bahasa aplikasi, dan tema warna.' : 'Manage name, avatar, app language, and color theme.'}</p>
                  </div>
                </button>

                {/* 2. Security Section Card */}
                <button 
                  onClick={() => setActiveSection('security')}
                  className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Lock size={18} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-indigo-400 transition-colors">{lang === 'id' ? 'Keamanan PIN' : 'Security PIN'}</span>
                      <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Kunci aplikasi Anda menggunakan PIN 4-digit yang aman.' : 'Lock your application using a secure 4-digit PIN.'}</p>
                  </div>
                </button>

                {/* 3. Backup Section Card */}
                <button 
                  onClick={() => setActiveSection('backup')}
                  className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Database size={18} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-indigo-400 transition-colors">{lang === 'id' ? 'Cadangan & Database' : 'Backup & Database'}</span>
                      <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Ekspor, impor cadangan, dan reset semua data aplikasi.' : 'Export, import backups, and reset all app database records.'}</p>
                  </div>
                </button>

                {/* 4. About Section Card */}
                <button 
                  onClick={() => setActiveSection('about')}
                  className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Info size={18} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-indigo-400 transition-colors">{lang === 'id' ? 'Tentang Noto' : 'About Noto'}</span>
                      <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Informasi legalitas, uji notifikasi, dan perawatan sistem.' : 'Legal info, test notifications, and system diagnostic care.'}</p>
                  </div>
                </button>
                {/* 5. AI Assistant Section Card */}
                <button 
                  onClick={() => setActiveSection('ai')}
                  className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px] sm:col-span-2"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bot size={18} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-indigo-400 transition-colors">{lang === 'id' ? 'Pengaturan Noto AI' : 'Noto AI Settings'}</span>
                      <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Konfigurasi provider, masukkan API Key mandiri Anda untuk mengaktifkan asisten AI.' : 'Configure provider, enter your own API Key to activate the AI assistant.'}</p>
                  </div>
                </button>
              </div>

              {/* Minimal Brand Tag */}
              <div className="pt-8 text-center opacity-40">
                <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">NOTO APP</p>
                <p className="text-[9px] font-medium text-slate-600 mt-1">{t('madeWithSimplicity')}</p>
              </div>
            </div>
          )}

          {/* CHOSEN CATEGORY DETAILS */}
          {activeSection !== null && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Back button and Category Title */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/30">
                <button 
                  onClick={() => setActiveSection(null)}
                  className="flex items-center gap-1.5 text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest cursor-pointer transition-colors"
                >
                  <ChevronLeft size={16} />
                  {lang === 'id' ? 'Kembali' : 'Back'}
                </button>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  {activeSection === 'appearance' && (lang === 'id' ? 'Tampilan & Profil' : 'Appearance & Profile')}
                  {activeSection === 'security' && (lang === 'id' ? 'Keamanan PIN' : 'Security PIN')}
                  {activeSection === 'backup' && (lang === 'id' ? 'Cadangan & Database' : 'Backup & Database')}
                  {activeSection === 'about' && (lang === 'id' ? 'Tentang Noto' : 'About Noto')}
                  {activeSection === 'ai' && 'Noto AI (BYOK)'}
                </span>
              </div>

              {/* SECTION: APPEARANCE */}
              {activeSection === 'appearance' && (
                <div className="space-y-6">
                  {/* Avatar & Profile Card */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col gap-6">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{lang === 'id' ? 'Identitas Pengguna' : 'User Identity'}</h4>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Avatar upload */}
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                          {user.avatarUrl === 'indexeddb:user_avatar' ? (
                            <div className="w-full h-full bg-slate-800 animate-pulse" />
                          ) : user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} className="text-slate-400" />
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 hover:bg-indigo-500 border-2 border-slate-900 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-md">
                          <Upload size={12} className="text-white" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const dataUrl = event.target?.result as string;
                                  updateUser({ ...user, avatarUrl: dataUrl });
                                  showNotificationToast(lang === 'id' ? 'Foto profil berhasil diperbarui!' : 'Avatar updated!');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden" 
                          />
                        </label>
                      </div>

                      {/* Name input */}
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">{lang === 'id' ? 'Nama Panggilan' : 'Profile Name'}</label>
                        <input 
                          type="text" 
                          value={user.name}
                          onChange={(e) => updateUser({ ...user, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-indigo-500/40 transition-colors placeholder-slate-600"
                          placeholder={lang === 'id' ? 'Nama Anda...' : 'Your name...'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Language Card */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                          <Globe size={18} />
                        </div>
                        <div>
                          <span className="font-extrabold text-[14px] text-slate-200 block">{lang === 'id' ? 'Bahasa Aplikasi' : 'App Language'}</span>
                          <span className="text-[11px] text-slate-400">{lang === 'id' ? 'Bahasa tampilan navigasi.' : 'Localization of text content.'}</span>
                        </div>
                      </div>
                      <div className="flex bg-slate-950/60 p-1 border border-slate-850 rounded-xl">
                        <button 
                          onClick={() => setLang('id')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${lang === 'id' ? 'bg-indigo-500 text-slate-950 font-black' : 'text-slate-400'}`}
                        >
                          ID
                        </button>
                        <button 
                          onClick={() => setLang('en')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${lang === 'en' ? 'bg-indigo-500 text-slate-950 font-black' : 'text-slate-400'}`}
                        >
                          EN
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Themes selection Card */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col gap-4">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{lang === 'id' ? 'Tema Warna Aplikasi' : 'Application Theme'}</h4>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { id: 'slate', name: 'Slate', color: 'bg-slate-700' },
                        { id: 'light', name: 'Light', color: 'bg-slate-200' },
                        { id: 'cool', name: 'Cool Blue', color: 'bg-blue-600' },
                        { id: 'pink', name: 'Pink Rose', color: 'bg-rose-500' },
                        { id: 'cute', name: 'Warm Amber', color: 'bg-amber-500' }
                      ].map((theme) => {
                        const isCurrent = appTheme === theme.id;
                        return (
                          <button 
                            key={theme.id}
                            onClick={() => {
                              setAppTheme(theme.id);
                              showNotificationToast(lang === 'id' ? `Tema diganti ke ${theme.name}` : `Theme changed to ${theme.name}`);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-2xl transition-all cursor-pointer ${
                              isCurrent 
                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 font-extrabold shadow-sm' 
                                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full ${theme.color} border border-slate-950/40 shrink-0`} />
                            <span className="text-xs font-bold">{theme.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Wallpaper uploads (Only in Pro Mode) */}
                  {!isLiteMode ? (
                    <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col gap-4">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{lang === 'id' ? 'Kustomisasi Wallpaper (Pro)' : 'Custom Wallpapers (Pro)'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Box 1: Custom wallpaper */}
                        <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
                          <span className="text-[11px] font-extrabold text-slate-300 block">{lang === 'id' ? 'Latar Belakang Utama' : 'Main Background Wallpaper'}</span>
                          <div className="flex gap-2">
                            <label className="flex-1 py-2 px-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-black uppercase text-center rounded-xl cursor-pointer transition-all">
                              {lang === 'id' ? 'Unggah' : 'Upload'}
                              <input type="file" accept="image/*" onChange={handleWallpaperUpload} className="hidden" />
                            </label>
                            {localCustomWallpaper && (
                              <button 
                                onClick={async () => {
                                  const { deleteLargeItem } = await import('../utils/db');
                                  await deleteLargeItem('noto_custom_wallpaper');
                                  setLocalCustomWallpaper(null);
                                  window.dispatchEvent(new Event('noto_wallpaper_changed'));
                                  showNotificationToast(lang === 'id' ? 'Wallpaper dihapus!' : 'Wallpaper cleared!');
                                }}
                                className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                              >
                                {lang === 'id' ? 'Hapus' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Box 2: Banner wallpaper */}
                        <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
                          <span className="text-[11px] font-extrabold text-slate-300 block">{lang === 'id' ? 'Latar Belakang Kotak Profil' : 'Profile Box Wallpaper'}</span>
                          <div className="flex gap-2">
                            <label className="flex-1 py-2 px-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-black uppercase text-center rounded-xl cursor-pointer transition-all">
                              {lang === 'id' ? 'Unggah' : 'Upload'}
                              <input type="file" accept="image/*" onChange={handleBannerWallpaperUpload} className="hidden" />
                            </label>
                            {localBannerWallpaper && (
                              <button 
                                onClick={async () => {
                                  const { deleteLargeItem } = await import('../utils/db');
                                  await deleteLargeItem('noto_banner_wallpaper');
                                  setLocalBannerWallpaper(null);
                                  window.dispatchEvent(new Event('noto_banner_wallpaper_changed'));
                                  showNotificationToast(lang === 'id' ? 'Wallpaper dihapus!' : 'Wallpaper cleared!');
                                }}
                                className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                              >
                                {lang === 'id' ? 'Hapus' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                      <p className="text-center text-xs text-slate-400">
                        {lang === 'id' 
                          ? '💡 Kustomisasi Wallpaper dinonaktifkan di Mode Lite. Aktifkan Mode Pro untuk mengganti latar belakang.' 
                          : '💡 Wallpaper settings are disabled in Lite Mode. Switch to Pro Mode to customize background.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: SECURITY */}
              {activeSection === 'security' && (
                <div className="space-y-6">
                  {/* Security PIN status */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Lock size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-[15px] text-slate-100 block">{lang === 'id' ? 'Kunci Keamanan PIN' : 'Passcode PIN Security'}</span>
                        <span className="text-xs text-slate-400 mt-1 block">
                          {appPin 
                            ? (lang === 'id' ? '✅ Proteksi PIN sedang AKTIF.' : '✅ PIN Protection is active.')
                            : (lang === 'id' ? '❌ Proteksi PIN TIDAK aktif.' : '❌ PIN Protection is not active.')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      {!appPin ? (
                        <button 
                          onClick={() => {
                            setPinInput('');
                            setPinModalMode('create');
                          }}
                          className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer text-center transition-all shadow-md shadow-indigo-500/10"
                        >
                          {lang === 'id' ? 'Aktifkan PIN Keamanan' : 'Enable Security PIN'}
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setPinInput('');
                              setPinModalMode('verify');
                            }}
                            className="flex-1 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-extrabold text-xs uppercase tracking-wider rounded-2xl cursor-pointer text-center transition-all border border-indigo-500/20"
                          >
                            {lang === 'id' ? 'Ubah PIN' : 'Change PIN'}
                          </button>
                          <button 
                            onClick={() => {
                              setPinInput('');
                              setPinModalMode('remove');
                            }}
                            className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl cursor-pointer text-center transition-all border border-rose-500/25"
                          >
                            {lang === 'id' ? 'Nonaktifkan PIN' : 'Disable PIN'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* PIN Change logs */}
                  {appPin && (
                    <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-4">
                      <button 
                        onClick={() => setShowPinHistoryDropdown(!showPinHistoryDropdown)}
                        className="w-full flex items-center justify-between text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <HistoryIcon size={16} className="text-indigo-400" />
                          <span className="font-extrabold text-[13px] text-slate-300">{lang === 'id' ? 'Log Riwayat PIN' : 'PIN History Logs'}</span>
                        </div>
                        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${showPinHistoryDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showPinHistoryDropdown && (
                        <div className="pt-2 space-y-3 border-t border-slate-800/50 animate-in fade-in duration-200">
                          {pinHistory.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic text-center py-2">{lang === 'id' ? 'Belum ada riwayat penggantian PIN.' : 'No PIN replacement history yet.'}</p>
                          ) : (
                            pinHistory.map((entry: any, index: number) => {
                              const isCurrent = entry.endDate === null;
                              return (
                                <div key={entry.id} className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${isCurrent ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-slate-950/30 border-slate-850/80'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase text-indigo-400">PIN #{pinHistory.length - index}</span>
                                    <span className="text-[9px] font-mono font-bold text-slate-500">
                                      {new Date(entry.startDate).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')}
                                    </span>
                                  </div>
                                  
                                  {/* Segmented input test tool inside audit logs */}
                                  <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-900">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 shrink-0">{lang === 'id' ? 'TES' : 'TEST'}:</span>
                                    <input 
                                      type="password" 
                                      maxLength={4}
                                      placeholder="••••"
                                      onChange={async (e) => {
                                        const val = e.target.value;
                                        if (val.length === 4) {
                                          const { hashPin } = await import('../utils');
                                          const h = await hashPin(val);
                                          if (h === entry.hashedPin) {
                                            e.target.style.borderColor = '#10b981';
                                            e.target.style.color = '#10b981';
                                            e.target.value = lang === 'id' ? 'OK ✓' : 'OK ✓';
                                            setTimeout(() => {
                                              e.target.style.borderColor = '';
                                              e.target.style.color = '';
                                              e.target.value = '';
                                            }, 2000);
                                          } else {
                                            e.target.style.borderColor = '#ef4444';
                                            e.target.style.color = '#ef4444';
                                            setTimeout(() => {
                                              e.target.style.borderColor = '';
                                              e.target.style.color = '';
                                              e.target.value = '';
                                            }, 1500);
                                          }
                                        }
                                      }}
                                      className="flex-1 min-w-0 bg-transparent text-center font-mono text-xs text-slate-300 placeholder-slate-700 outline-none transition-colors border border-transparent rounded px-1"
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: DATABASE & BACKUP */}
              {activeSection === 'backup' && (
                <div className="space-y-6">
                  {/* Database Actions Cards */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col gap-4">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{lang === 'id' ? 'Ekspor & Impor Database' : 'Database Export & Import'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        onClick={handleExportClick}
                        className="flex items-center gap-3.5 p-3.5 bg-slate-950/45 hover:bg-slate-950/85 border border-slate-850 rounded-2xl transition-all text-left cursor-pointer active:scale-95 group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Download size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-200 leading-none group-hover:text-indigo-400 transition-colors">{t('backupExport')}</p>
                          <p className="text-[10px] text-slate-500 mt-1.5 leading-none">{lang === 'id' ? 'Unduh file cadangan data' : 'Download data file'}</p>
                        </div>
                      </button>

                      <button 
                        onClick={handleImportClick}
                        className="flex items-center gap-3.5 p-3.5 bg-slate-950/45 hover:bg-slate-950/85 border border-slate-850 rounded-2xl transition-all text-left cursor-pointer active:scale-95 group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                          <Upload size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-200 leading-none group-hover:text-indigo-400 transition-colors">{t('restoreImport')}</p>
                          <p className="text-[10px] text-slate-500 mt-1.5 leading-none">{lang === 'id' ? 'Unggah file data' : 'Upload data file'}</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Auto-backup trigger settings */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl">
                    {renderAutoBackupSettings()}
                  </div>

                  {/* DANGER ZONE (Directly inside Backup, as requested!) */}
                  <div className="p-5 sm:p-6 bg-rose-950/15 border border-rose-900/25 rounded-3xl space-y-4">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <AlertTriangle size={12} /> {lang === 'id' ? 'Zona Bahaya' : 'Danger Zone'}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-500/5 border border-rose-500/15 rounded-2xl">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-[13px] text-rose-400">{lang === 'id' ? 'Hapus Semua Data' : 'Hard Reset All Data'}</span>
                        <span className="text-[10px] text-slate-400 leading-normal mt-1">{lang === 'id' ? 'Menghapus seluruh database dan catatan harian secara permanen.' : 'Permanently wipe out all records.'}</span>
                      </div>
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-slate-950 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors text-center shrink-0"
                      >
                        {lang === 'id' ? 'Reset' : 'Reset'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: ABOUT & DIAGNOSTICS */}
              {activeSection === 'about' && (
                <div className="space-y-6">
                  {/* System Care */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[14px] text-slate-200">{lang === 'id' ? 'Perawatan Sistem' : 'System Care'}</span>
                      <span className="text-xs text-slate-400 leading-normal mt-0.5">{lang === 'id' ? 'Segarkan cache aplikasi jika terjadi kesalahan layar.' : 'Refresh app storage cache if glitches occur.'}</span>
                    </div>
                    <button
                      onClick={handleRefreshApp}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/10 shrink-0"
                    >
                      {lang === 'id' ? 'Segarkan Noto' : 'Refresh Noto'}
                    </button>
                  </div>

                  {/* Notification Test */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[14px] text-slate-200">{lang === 'id' ? 'Uji Coba Notifikasi' : 'Notification Test Tool'}</span>
                        <span className="text-xs text-slate-400 leading-normal mt-0.5">{lang === 'id' ? 'Menguji pengingat sistem untuk memastikan alarm bekerja.' : 'Verify system alerts permission is operational.'}</span>
                      </div>
                      <button
                        onClick={triggerTestNotif}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-indigo-400 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer shrink-0 border border-indigo-500/10"
                      >
                        {lang === 'id' ? 'Kirim Tes' : 'Trigger Test'}
                      </button>
                    </div>

                    {testNotifMsg && (
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 animate-in fade-in duration-200">
                        <p className="text-[10px] text-slate-300 font-semibold leading-relaxed">{testNotifMsg}</p>
                      </div>
                    )}
                  </div>

                  {/* Document Links */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col gap-3">
                    <button 
                      onClick={() => setShowPrivacyPolicy(true)}
                      className="w-full flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl border border-slate-850 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 flex items-center justify-center">
                          <HelpCircle size={14} />
                        </div>
                        <span className="font-bold text-xs text-slate-200">{lang === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy'}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </button>

                    <button 
                      onClick={() => setShowUpdateNotes(true)}
                      className="w-full flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl border border-slate-850 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 flex items-center justify-center">
                          <Info size={14} />
                        </div>
                        <span className="font-bold text-xs text-slate-200">{lang === 'id' ? 'Tentang Aplikasi Noto' : 'About Noto Application'}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION: NOTO AI SETTINGS */}
              {activeSection === 'ai' && (
                <div className="space-y-6">
                  {/* Privacy Disclaimer Card */}
                  <div className="p-5 sm:p-6 bg-indigo-950/15 border border-indigo-900/30 rounded-3xl space-y-3">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <ShieldCheck size={12} /> Privacy Promise & BYOK Philosophy
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {lang === 'id' 
                        ? 'Noto didesain sebagai aplikasi Offline-First & Privacy-First. Kami percaya data dan kontrol AI harus sepenuhnya berada di tangan Anda.'
                        : 'Noto is built to be Offline-First & Privacy-First. We believe your data and AI control should belong completely to you.'}
                    </p>
                    <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                      <li>{lang === 'id' ? 'API Key disimpan secara lokal di perangkat Anda (IndexedDB).' : 'Your API Key is saved locally in this device (IndexedDB).'}</li>
                      <li>{lang === 'id' ? 'Kunci Anda TIDAK PERNAH dikirim atau disimpan ke server Noto.' : 'Your key is NEVER sent to or stored on Noto servers.'}</li>
                      <li>{lang === 'id' ? 'Semua permintaan obrolan AI dikirim langsung dari browser Anda ke Google Gemini.' : 'All AI chat requests are sent directly from your browser to Google Gemini.'}</li>
                    </ul>
                  </div>

                  {/* AI Provider & Form Section */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                        {lang === 'id' ? 'AI Provider' : 'AI Provider'}
                      </label>
                      <div className="p-4 bg-slate-950/45 border border-indigo-500/25 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                            <Bot size={16} />
                          </div>
                          <div>
                            <span className="font-extrabold text-[13px] text-slate-100 block">Google Gemini</span>
                            <span className="text-[10px] text-slate-400 leading-none">gemini-1.5-flash / gemini-1.5-pro</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider rounded-lg">
                          {lang === 'id' ? 'Aktif' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                          {lang === 'id' ? 'Google Gemini API Key' : 'Google Gemini API Key'}
                        </label>
                        {geminiApiKey && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {lang === 'id' ? 'Tersimpan Lokal' : 'Locally Saved'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={testApiKey}
                          onChange={(e) => {
                            setTestApiKey(e.target.value);
                            setConnectionStatus('idle');
                            setConnectionError(null);
                          }}
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl pl-4 pr-11 py-3 text-slate-100 text-sm outline-none focus:border-indigo-500/40 transition-all placeholder-slate-700"
                          placeholder={lang === 'id' ? 'Masukkan AIzaSy...' : 'Enter AIzaSy...'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
                        >
                          {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Connection Status Indicator */}
                    {connectionStatus !== 'idle' && (
                      <div className={`p-4 rounded-2xl border text-xs leading-relaxed transition-all ${
                        connectionStatus === 'testing' ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300' :
                        connectionStatus === 'connected' ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-300' :
                        'bg-rose-500/5 border-rose-500/25 text-rose-300'
                      }`}>
                        <div className="flex items-center gap-2 font-bold mb-1">
                          {connectionStatus === 'testing' && <RefreshCw size={14} className="animate-spin text-indigo-400" />}
                          {connectionStatus === 'connected' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                          {connectionStatus === 'error' && <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />}
                          <span>
                            {connectionStatus === 'testing' && (lang === 'id' ? 'Menguji Koneksi...' : 'Testing Connection...')}
                            {connectionStatus === 'connected' && (lang === 'id' ? 'Terhubung (API Key Valid)' : 'Connected (Valid API Key)')}
                            {connectionStatus === 'error' && (lang === 'id' ? 'Koneksi Gagal' : 'Connection Failed')}
                          </span>
                        </div>
                        {connectionStatus === 'error' && connectionError && (
                          <p className="text-[11px] text-slate-400 font-semibold mt-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">{connectionError}</p>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={async () => {
                          if (!testApiKey.trim()) {
                            setConnectionStatus('error');
                            setConnectionError(lang === 'id' ? 'Masukkan API Key terlebih dahulu!' : 'Please enter an API Key first!');
                            return;
                          }

                          setConnectionStatus('testing');
                          setConnectionError(null);

                          try {
                            const response = await fetch(
                              `/api/ai/test-key`,
                              {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  apiKey: testApiKey.trim(),
                                  lang
                                })
                              }
                            );

                            if (response.ok) {
                              setConnectionStatus('connected');
                              showNotificationToast(lang === 'id' ? 'Koneksi Berhasil! API Key Anda valid.' : 'Connection Successful! Your API Key is valid.');
                            } else {
                              const errorData = await response.json().catch(() => ({}));
                              let errMsg = errorData?.error || (lang === 'id' ? 'API Key tidak valid' : 'Invalid API Key');
                              setConnectionStatus('error');
                              setConnectionError(errMsg);
                            }
                          } catch (err: any) {
                            console.error(err);
                            setConnectionStatus('error');
                            setConnectionError(err.message || (lang === 'id' ? 'Gagal menghubungi Google Gemini API' : 'Failed to reach Google Gemini API'));
                          }
                        }}
                        disabled={connectionStatus === 'testing'}
                        className="flex-1 min-w-[120px] px-4 py-3 bg-slate-800 hover:bg-slate-750 text-indigo-400 border border-indigo-500/10 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {connectionStatus === 'testing' ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            {lang === 'id' ? 'Menguji...' : 'Testing...'}
                          </>
                        ) : (
                          lang === 'id' ? 'Uji Koneksi' : 'Test Connection'
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (!testApiKey.trim()) {
                            showNotificationToast(lang === 'id' ? 'Harap masukkan API Key terlebih dahulu!' : 'Please enter an API Key first!');
                            return;
                          }
                          setGeminiApiKey(testApiKey.trim());
                          setConnectionStatus('connected');
                          showNotificationToast(lang === 'id' ? 'API Key berhasil disimpan secara lokal!' : 'API Key successfully saved locally!');
                        }}
                        disabled={!testApiKey.trim() || connectionStatus === 'testing'}
                        className="flex-1 min-w-[120px] px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/10 disabled:opacity-50"
                      >
                        {lang === 'id' ? 'Simpan' : 'Save'}
                      </button>

                      {geminiApiKey && (
                        <button
                          onClick={() => {
                            setGeminiApiKey(null);
                            setTestApiKey('');
                            setConnectionStatus('idle');
                            setConnectionError(null);
                            showNotificationToast(lang === 'id' ? 'API Key berhasil dihapus!' : 'API Key successfully removed!');
                          }}
                          className="w-full sm:w-auto px-4 py-3 bg-rose-950/30 hover:bg-rose-900/30 text-rose-400 border border-rose-500/15 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Trash2 size={12} />
                          {lang === 'id' ? 'Hapus API Key' : 'Delete API Key'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Accordion/Collapsible Guide Section */}
                  <div className="p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-4">
                    <button
                      onClick={() => setShowGuide(!showGuide)}
                      className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-950 text-slate-400 flex items-center justify-center border border-slate-850 group-hover:text-indigo-400 transition-colors">
                          <HelpCircle size={14} />
                        </div>
                        <div>
                          <span className="font-extrabold text-[13px] text-slate-200 block group-hover:text-indigo-400 transition-colors">
                            {lang === 'id' ? 'Cara Mendapatkan API Key Gratis' : 'How to Get a Free API Key'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {lang === 'id' ? 'Panduan langkah demi langkah 1 menit' : '1-minute step-by-step tutorial'}
                          </span>
                        </div>
                      </div>
                      <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`} />
                    </button>

                    {showGuide && (
                      <div className="pt-3 border-t border-slate-800/30 space-y-4 animate-in fade-in duration-200">
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {lang === 'id' 
                            ? 'Google menyediakan akses API Key gratis untuk model Gemini 1.5 Flash melalui Google AI Studio. Ikuti panduan sederhana ini:'
                            : 'Google provides free API Key access for Gemini 1.5 Flash models through Google AI Studio. Follow these simple steps:'}
                        </p>
                        
                        <div className="space-y-3">
                          {[
                            {
                              step: '1',
                              text_id: 'Buka Google AI Studio dengan menekan tautan di bawah ini.',
                              text_en: 'Open Google AI Studio by clicking the link button below.',
                              action: (
                                <a
                                  href="https://aistudio.google.com/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-bold mt-1.5 hover:bg-indigo-500/20 transition-all cursor-pointer"
                                >
                                  <span>Google AI Studio</span>
                                  <ExternalLink size={10} />
                                </a>
                              )
                            },
                            {
                              step: '2',
                              text_id: 'Masuk (Sign in) menggunakan Akun Google Anda.',
                              text_en: 'Sign in using your standard Google Account.'
                            },
                            {
                              step: '3',
                              text_id: 'Klik tombol biru "Get API Key" (Dapatkan API Key) di kiri atas halaman.',
                              text_en: 'Click the blue "Get API Key" button in the upper left corner.'
                            },
                            {
                              step: '4',
                              text_id: 'Klik tombol "Create API Key" (Buat API Key). Pilih "Create API Key in new project" (Buat API Key di proyek baru).',
                              text_en: 'Click "Create API Key". Choose "Create API Key in new project".'
                            },
                            {
                              step: '5',
                              text_id: 'Salin API Key Anda (berawalan AIzaSy...).',
                              text_en: 'Copy your API Key (starts with AIzaSy...).'
                            },
                            {
                              step: '6',
                              text_id: 'Tempelkan API Key tersebut ke kolom input di atas, lakukan "Uji Koneksi" dan klik "Simpan".',
                              text_en: 'Paste it in the field above, click "Test Connection" and then click "Save".'
                            }
                          ].map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-start bg-slate-950/30 p-3 rounded-2xl border border-slate-850/60">
                              <span className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-indigo-500/25 mt-0.5">
                                {item.step}
                              </span>
                              <div className="text-[11px] text-slate-300 leading-relaxed">
                                <p>{lang === 'id' ? item.text_id : item.text_en}</p>
                                {item.action}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* POPUP MODAL: SECURITY PIN ENTRY / VERIFY / CHANGE / REMOVE */}
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

            {/* PREMIUM SEGMENTED 4-BOX PIN INPUT (Eliminates the 2-digit bug!) */}
            <div className="relative w-full max-w-[240px] mx-auto mb-5">
              {/* Invisible real text field overlay */}
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={4}
                autoFocus
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePinSubmit();
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {/* Premium boxes */}
              <div className="flex justify-between gap-3.5 pointer-events-none">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = index < pinInput.length;
                  const isCurrent = index === pinInput.length;
                  return (
                    <div 
                      key={index}
                      className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl font-extrabold transition-all duration-150 ${
                        isFilled 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                          : isCurrent
                            ? 'border-indigo-500/50 bg-slate-950/50 text-indigo-300'
                            : 'border-slate-800 bg-slate-950/20 text-slate-600'
                      }`}
                    >
                      {isFilled ? '•' : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {(pinModalMode === 'create' || pinModalMode === 'change') && (
              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  value={pinQuestionInput}
                  onChange={e => setPinQuestionInput(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-slate-50 text-sm outline-none focus:border-indigo-500/60 transition-all placeholder-slate-600"
                  placeholder={t('securityQuestionPlaceholder')}
                />
                <input
                  type="text"
                  value={pinAnswerInput}
                  onChange={e => setPinAnswerInput(e.target.value)}
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
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-200 bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button 
                disabled={pinInput.length !== 4 || ((pinModalMode === 'create' || pinModalMode === 'change') && (!pinQuestionInput.trim() || !pinAnswerInput.trim()))}
                onClick={handlePinSubmit}
                className={`flex-1 py-3 rounded-2xl text-slate-950 text-sm font-extrabold transition-all cursor-pointer ${pinInput.length === 4 && (!['create', 'change'].includes(pinModalMode) || (pinQuestionInput.trim() && pinAnswerInput.trim())) ? 'bg-indigo-400 hover:bg-indigo-300 shadow-md shadow-indigo-500/20' : 'bg-slate-850 text-slate-500 cursor-not-allowed opacity-50'}`}
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: HARD RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-red-400 mb-2">{t('reset')}</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {t('resetConfirmDescription')}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 bg-slate-800 transition-colors cursor-pointer"
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
                className="px-4 py-2 rounded-xl text-white text-sm font-bold bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
              >
                {t('yesReset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: MANUAL EXPORT / IMPORT CONFIRMATION */}
      {backupModalMode && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`bg-slate-900 border border-slate-800/80 p-5 rounded-[2rem] w-full max-w-lg shadow-2xl relative ${backupError ? 'animate-pulse border-red-500/50' : ''} max-h-[90vh] flex flex-col`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <Database size={18} className="text-indigo-400" />
                {backupModalMode === 'export' ? (lang === 'id' ? 'Opsi Ekspor Cadangan' : 'Export Options') : (lang === 'id' ? 'Konfirmasi Impor Data' : 'Restore Backup')}
              </h3>
              <button 
                onClick={() => setBackupModalMode(null)}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
              {backupModalMode === 'export' ? (
                <>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'id' 
                      ? 'Pilih komponen data yang ingin dimasukkan ke file cadangan:' 
                      : 'Choose which data components to include in the backup file:'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { key: 'notes', label: lang === 'id' ? 'Catatan & Buku' : 'Notes & Journals' },
                      { key: 'tasks', label: lang === 'id' ? 'Tugas & Agenda' : 'Tasks & Alarms' },
                      { key: 'transactions', label: lang === 'id' ? 'Keuangan' : 'Finance Logs' },
                      { key: 'moods', label: lang === 'id' ? 'Mood harian' : 'Daily Moods' },
                      { key: 'userProfile', label: lang === 'id' ? 'Profil & Streak' : 'UserProfile' },
                      { key: 'settings', label: lang === 'id' ? 'Pengaturan PIN/App' : 'App Settings' }
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2.5 p-3 bg-slate-950/40 hover:bg-slate-950/85 border border-slate-850 rounded-xl cursor-pointer transition-all">
                        <input 
                          type="checkbox" 
                          checked={(exportOptions as any)[opt.key]}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                          className="rounded border-slate-800 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-xs font-bold text-slate-300 truncate">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">{lang === 'id' ? 'Proteksi Enkripsi Sandi (Opsional)' : 'Encryption Password (Optional)'}</span>
                    <p className="text-[10px] text-slate-500 leading-normal">{lang === 'id' ? 'Masukkan sandi untuk mengamankan file cadangan. Jika dikosongkan, file tidak terenkripsi.' : 'Enter a password to encrypt backup file. If empty, the file remains in raw text.'}</p>
                    <input 
                      type="password"
                      value={backupPassword}
                      onChange={e => setBackupPassword(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none focus:border-indigo-500/40 placeholder-slate-600 font-mono"
                      placeholder={lang === 'id' ? 'Kata sandi cadangan...' : 'Backup password...'}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 text-amber-400 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-extrabold block">{lang === 'id' ? 'Perhatian Pemulihan!' : 'Restore Warning!'}</span>
                      <span className="text-[11px] leading-relaxed block mt-1">
                        {lang === 'id' 
                          ? 'Pemulihan data cadangan ini akan menimpa dan mengganti seluruh database Anda saat ini.' 
                          : 'Restoring backup data will overwrite and replace your current application records completely.'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">{lang === 'id' ? 'Masukkan Sandi Dekripsi' : 'Decrypt Password Required'}</span>
                    <p className="text-[10px] text-slate-500 leading-normal">{lang === 'id' ? 'Jika file cadangan Anda menggunakan kata sandi enkripsi, silakan masukkan untuk membuka.' : 'If your backup file was encrypted with a password, enter it below to restore.'}</p>
                    <input 
                      type="password"
                      value={backupPassword}
                      onChange={e => setBackupPassword(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none focus:border-indigo-500/40 placeholder-slate-600 font-mono"
                      placeholder={lang === 'id' ? 'Kata sandi cadangan...' : 'Decrypt password...'}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800/50">
              <button 
                onClick={() => setBackupModalMode(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-2xl transition-all cursor-pointer text-center"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={backupModalMode === 'export' ? processExport : processImport}
                className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer text-center shadow-lg"
              >
                {backupModalMode === 'export' ? (lang === 'id' ? 'Unduh Cadangan' : 'Export File') : (lang === 'id' ? 'Pulihkan Data' : 'Import File')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: VERIFY AUTO BACKUP PIN */}
      {showAutoBackupEnableVerify && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full flex flex-col relative overflow-hidden shadow-2xl text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-extrabold text-slate-100 font-sans">{lang === 'id' ? 'Verifikasi PIN Cadangan' : 'Verify Backup PIN'}</h3>
              <p className="text-[11px] text-slate-400 leading-normal mt-1.5">{lang === 'id' ? 'Masukkan PIN Cadangan Otomatis Anda untuk menyimpan perubahan frekuensi.' : 'Please enter your Auto-Backup PIN to confirm frequency alteration.'}</p>
            </div>

            {/* Segmented PIN input */}
            <div className="relative w-full max-w-[240px] mx-auto mb-5">
              <input
                ref={enableVerifyInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                value={autoBackupEnableVerifyPin}
                onChange={e => setAutoBackupEnableVerifyPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && autoBackupEnableVerifyPin.length === 4) {
                    handleAutoBackupVerifySubmit();
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex justify-between gap-3 pointer-events-none">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = index < autoBackupEnableVerifyPin.length;
                  const isCurrent = index === autoBackupEnableVerifyPin.length;
                  return (
                    <div 
                      key={index}
                      className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-150 ${
                        isFilled 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                          : isCurrent
                            ? 'border-indigo-500/50 bg-slate-950/50 text-indigo-300'
                            : 'border-slate-800 bg-slate-950/20 text-slate-600'
                      }`}
                    >
                      {isFilled ? '•' : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {autoBackupEnableVerifyError && (
              <p className="text-[10px] text-red-400 font-bold text-center mb-4 animate-pulse">{lang === 'id' ? '❌ PIN Cadangan salah!' : '❌ Incorrect Backup PIN!'}</p>
            )}

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setShowAutoBackupEnableVerify(false);
                  setAutoBackupEnableVerifyPin('');
                  setPendingAutoBackupFreq(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-bold text-slate-400 transition-all cursor-pointer border border-slate-800/85"
              >
                {t('cancel')}
              </button>
              <button 
                type="button" 
                onClick={handleAutoBackupVerifySubmit}
                disabled={autoBackupEnableVerifyPin.length !== 4}
                className={`flex-1 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg ${
                  autoBackupEnableVerifyPin.length === 4
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-slate-950 shadow-indigo-500/10'
                    : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed shadow-none border border-slate-850'
                }`}
              >
                {lang === 'id' ? 'Verifikasi' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: SETUP AUTO BACKUP PIN */}
      {showAutoBackupPinSetup && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full flex flex-col relative overflow-hidden shadow-2xl text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                <Key size={20} />
              </div>
              <h3 className="text-base font-extrabold text-slate-100 font-sans">
                {autoBackupPinSetupStep === 1 
                  ? (lang === 'id' ? 'Buat PIN Cadangan Otomatis' : 'Create Auto-Backup PIN')
                  : (lang === 'id' ? 'Konfirmasi PIN Cadangan' : 'Confirm Auto-Backup PIN')}
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal mt-1.5">
                {autoBackupPinSetupStep === 1 
                  ? (lang === 'id' 
                      ? 'Buat PIN 4 digit terpisah khusus untuk mengenkripsi file cadangan otomatis Anda.' 
                      : 'Create a separate 4-digit PIN used specifically to encrypt your automatic backup files.')
                  : (lang === 'id' 
                      ? 'Masukkan kembali PIN yang baru saja Anda buat untuk konfirmasi.' 
                      : 'Re-enter the PIN you just created to confirm.')}
              </p>
            </div>

            {/* Segmented PIN input */}
            <div className="relative w-full max-w-[240px] mx-auto mb-5">
              <input
                ref={pinSetupInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                value={autoBackupPinSetupStep === 1 ? autoBackupPinSetupPin : autoBackupPinSetupConfirm}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (autoBackupPinSetupStep === 1) setAutoBackupPinSetupPin(val);
                  else setAutoBackupPinSetupConfirm(val);
                }}
                onKeyDown={e => {
                  const currentVal = autoBackupPinSetupStep === 1 ? autoBackupPinSetupPin : autoBackupPinSetupConfirm;
                  if (e.key === 'Enter' && currentVal.length === 4) {
                    handleAutoBackupPinSetupSubmit();
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex justify-between gap-3 pointer-events-none">
                {[0, 1, 2, 3].map((index) => {
                  const currentVal = autoBackupPinSetupStep === 1 ? autoBackupPinSetupPin : autoBackupPinSetupConfirm;
                  const isFilled = index < currentVal.length;
                  const isCurrent = index === currentVal.length;
                  return (
                    <div 
                      key={index}
                      className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-150 ${
                        isFilled 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                          : isCurrent
                            ? 'border-indigo-500/50 bg-slate-950/50 text-indigo-300'
                            : 'border-slate-800 bg-slate-950/20 text-slate-600'
                      }`}
                    >
                      {isFilled ? '•' : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {autoBackupPinSetupError && (
              <p className="text-[10px] text-red-400 font-bold text-center mb-4 animate-pulse">{lang === 'id' ? '❌ PIN konfirmasi tidak cocok!' : '❌ Confirmation PIN mismatch!'}</p>
            )}

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => {
                  if (autoBackupPinSetupStep === 2) {
                    setAutoBackupPinSetupStep(1);
                    setAutoBackupPinSetupConfirm('');
                  } else {
                    setShowAutoBackupPinSetup(false);
                    setAutoBackupPinSetupPin('');
                    setAutoBackupPinSetupConfirm('');
                    setPendingAutoBackupFreq(null);
                  }
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-bold text-slate-400 transition-all cursor-pointer border border-slate-800/85"
              >
                {autoBackupPinSetupStep === 2 ? (lang === 'id' ? 'Kembali' : 'Back') : t('cancel')}
              </button>
              <button 
                type="button" 
                onClick={handleAutoBackupPinSetupSubmit}
                disabled={(autoBackupPinSetupStep === 1 ? autoBackupPinSetupPin.length : autoBackupPinSetupConfirm.length) !== 4}
                className={`flex-1 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg ${
                  (autoBackupPinSetupStep === 1 ? autoBackupPinSetupPin.length : autoBackupPinSetupConfirm.length) === 4
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-slate-950 shadow-indigo-500/10'
                    : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed shadow-none border border-slate-850'
                }`}
              >
                {autoBackupPinSetupStep === 1 ? (lang === 'id' ? 'Lanjut' : 'Next') : (lang === 'id' ? 'Simpan' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: CHANGE AUTO BACKUP PIN */}
      {showAutoBackupPinChange && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full flex flex-col relative overflow-hidden shadow-2xl text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                <Key size={20} />
              </div>
              <h3 className="text-base font-extrabold text-slate-100 font-sans">
                {autoBackupPinChangeStep === 1 
                  ? (lang === 'id' ? 'Verifikasi PIN Lama' : 'Verify Old PIN')
                  : autoBackupPinChangeStep === 2
                    ? (lang === 'id' ? 'Masukkan PIN Baru' : 'Enter New PIN')
                    : (lang === 'id' ? 'Konfirmasi PIN Baru' : 'Confirm New PIN')}
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal mt-1.5">
                {autoBackupPinChangeStep === 1 
                  ? (lang === 'id' ? 'Masukkan PIN Cadangan Otomatis aktif saat ini.' : 'Enter your active Auto-Backup PIN.')
                  : autoBackupPinChangeStep === 2
                    ? (lang === 'id' ? 'Masukkan PIN 4 digit baru khusus cadangan berikutnya.' : 'Enter a new 4-digit PIN.')
                    : (lang === 'id' ? 'Masukkan kembali PIN baru untuk konfirmasi.' : 'Re-enter your new PIN to confirm.')}
              </p>
            </div>

            {/* Segmented PIN input */}
            <div className="relative w-full max-w-[240px] mx-auto mb-5">
              <input
                ref={pinChangeInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                value={
                  autoBackupPinChangeStep === 1 
                    ? autoBackupPinChangeCurrent 
                    : autoBackupPinChangeStep === 2 
                      ? autoBackupPinChangeNew 
                      : autoBackupPinChangeConfirm
                }
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (autoBackupPinChangeStep === 1) setAutoBackupPinChangeCurrent(val);
                  else if (autoBackupPinChangeStep === 2) setAutoBackupPinChangeNew(val);
                  else setAutoBackupPinChangeConfirm(val);
                }}
                onKeyDown={e => {
                  const currentVal = autoBackupPinChangeStep === 1 
                    ? autoBackupPinChangeCurrent 
                    : autoBackupPinChangeStep === 2 
                      ? autoBackupPinChangeNew 
                      : autoBackupPinChangeConfirm;
                  if (e.key === 'Enter' && currentVal.length === 4) {
                    handleAutoBackupPinChangeSubmit();
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex justify-between gap-3 pointer-events-none">
                {[0, 1, 2, 3].map((index) => {
                  const currentVal = autoBackupPinChangeStep === 1 
                    ? autoBackupPinChangeCurrent 
                    : autoBackupPinChangeStep === 2 
                      ? autoBackupPinChangeNew 
                      : autoBackupPinChangeConfirm;
                  const isFilled = index < currentVal.length;
                  const isCurrent = index === currentVal.length;
                  return (
                    <div 
                      key={index}
                      className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-150 ${
                        isFilled 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                          : isCurrent
                            ? 'border-indigo-500/50 bg-slate-950/50 text-indigo-300'
                            : 'border-slate-800 bg-slate-950/20 text-slate-600'
                      }`}
                    >
                      {isFilled ? '•' : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {autoBackupPinChangeError && (
              <p className="text-[10px] text-red-400 font-bold text-center mb-4 animate-pulse">
                {autoBackupPinChangeErrorType === 'wrong_current' 
                  ? (lang === 'id' ? '❌ PIN Cadangan Lama salah!' : '❌ Incorrect Old PIN!')
                  : (lang === 'id' ? '❌ PIN Baru konfirmasi tidak cocok!' : '❌ Confirmation PIN mismatch!')}
              </p>
            )}

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => {
                  if (autoBackupPinChangeStep === 3) {
                    setAutoBackupPinChangeStep(2);
                    setAutoBackupPinChangeConfirm('');
                  } else if (autoBackupPinChangeStep === 2) {
                    setAutoBackupPinChangeStep(1);
                    setAutoBackupPinChangeNew('');
                  } else {
                    setShowAutoBackupPinChange(false);
                    setAutoBackupPinChangeCurrent('');
                  }
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-bold text-slate-400 transition-all cursor-pointer border border-slate-800/85"
              >
                {autoBackupPinChangeStep > 1 ? (lang === 'id' ? 'Kembali' : 'Back') : t('cancel')}
              </button>
              <button 
                type="button" 
                onClick={handleAutoBackupPinChangeSubmit}
                disabled={
                  (autoBackupPinChangeStep === 1 
                    ? autoBackupPinChangeCurrent.length 
                    : autoBackupPinChangeStep === 2 
                      ? autoBackupPinChangeNew.length 
                      : autoBackupPinChangeConfirm.length) !== 4
                }
                className={`flex-1 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg ${
                  (autoBackupPinChangeStep === 1 
                    ? autoBackupPinChangeCurrent.length 
                    : autoBackupPinChangeStep === 2 
                      ? autoBackupPinChangeNew.length 
                      : autoBackupPinChangeConfirm.length) === 4
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-slate-950 shadow-indigo-500/10'
                    : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed shadow-none border border-slate-850'
                }`}
              >
                {autoBackupPinChangeStep === 1 
                  ? (lang === 'id' ? 'Verifikasi' : 'Verify')
                  : autoBackupPinChangeStep === 2
                    ? (lang === 'id' ? 'Lanjut' : 'Next')
                    : (lang === 'id' ? 'Simpan' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRIVACY POLICY */}
      {showPrivacyPolicy && (
        <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} lang={lang} t={t} />
      )}

      {/* MODAL: UPDATE NOTES / ABOUT APP */}
      {showUpdateNotes && (
        <UpdateNotesModal isOpen={showUpdateNotes} onClose={() => setShowUpdateNotes(false)} lang={lang} t={t} />
      )}

      {/* Toast Notification popup */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 border border-slate-850 px-4.5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-xs font-extrabold text-slate-200">
            {toastMessage}
          </p>
        </div>
      )}
    </div>
  );
}
