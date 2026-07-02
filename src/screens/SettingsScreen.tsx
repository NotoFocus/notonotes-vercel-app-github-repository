import React, { useState, useEffect } from 'react';
import { 
  Moon, Download, Upload, Bell, Lock, FileText, Smartphone, 
  ChevronRight, User, Globe, Clock, Key, Trash2, Info, Shield, MessageCircle, Gamepad2,
  AlertTriangle, Image as ImageIcon
} from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { ScreenItem } from '../App';
import { generateId, encryptData, decryptData, hashPin } from '../utils';
import { getLargeItem, setLargeItem, deleteLargeItem } from '../utils/db';

export default function SettingsScreen({ appTheme, setAppTheme, onNavigate }: { appTheme: string, setAppTheme: (t: any) => void, onNavigate?: (s: ScreenItem) => void }) {
  const { transactions, notes, tasks, user, updateUser, appPin, setAppPin, pinRecoveryQuestion, setPinRecoveryQuestion, pinRecoveryAnswer, setPinRecoveryAnswer, setIsUnlocked, importData, clearAllData, lang, setLang, streak, reminderActive, setReminderActive, reminderTime, setReminderTime } = useAppStore();
  const t = useTranslation(lang);

  const [localCustomWallpaper, setLocalCustomWallpaper] = useState<string | null>(null);
  const [localBannerWallpaper, setLocalBannerWallpaper] = useState<string | null>(null);

  useEffect(() => {
    getLargeItem('noto_custom_wallpaper').then(setLocalCustomWallpaper);
    getLargeItem('noto_banner_wallpaper').then(setLocalBannerWallpaper);
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

  const triggerTestNotif = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      window.Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          const title = t('notifTitleTest') || 'Uji Coba Notifikasi Noto! 🔔';
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
      const data = JSON.stringify({ notes, tasks, transactions });
      let finalData = data;
      
      if (backupPassword) {
        const { encryptData } = await import('../utils');
        finalData = await encryptData(data, backupPassword);
      }
      
      const blob = new Blob([finalData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'noto_backup.json';
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
      if (data.notes && data.tasks) {
        const parsedTransactions = data.transactions || [];
        const seenTxIds = new Set();
        const uniqueTransactions = parsedTransactions.map((t: any) => {
          if (seenTxIds.has(t.id)) t.id = generateId();
          seenTxIds.add(t.id);
          return t;
        });

        const seenTaskIds = new Set();
        const uniqueTasks = data.tasks.map((t: any) => {
          if (seenTaskIds.has(t.id)) t.id = generateId();
          seenTaskIds.add(t.id);
          return t;
        });

        const seenNoteIds = new Set();
        const uniqueNotes = data.notes.map((n: any) => {
          if (seenNoteIds.has(n.id)) n.id = generateId();
          seenNoteIds.add(n.id);
          return n;
        });
        
        importData(uniqueNotes, uniqueTasks, uniqueTransactions);
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
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200">
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
      <div className="flex-none min-h-[4rem] pt-[env(safe-area-inset-top)] border-b border-slate-800 bg-slate-900 px-6 flex items-center">
        <span className="font-bold text-2xl text-slate-50 tracking-tight">{t('settingsMenu')}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full">
        <div className="w-full px-4 sm:px-6 py-6 space-y-6 max-w-2xl mx-auto">
          
          {/* AKUN & TAMPILAN */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"><Smartphone size={16} className="text-indigo-400" /> {t('appearance')}</h3>
          <div className="bg-slate-800/40 border border-slate-800/60 rounded-3xl flex flex-col overflow-hidden">
            <div className="flex flex-col border-b border-slate-800/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <span className="font-bold text-[15px] text-slate-200">{lang === 'id' ? 'Foto Profil' : 'Profile Photo'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-xs cursor-pointer transition-colors">
                    {lang === 'id' ? 'Pilih' : 'Choose'}
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
                  {user.avatarUrl && (
                    <button 
                      onClick={() => updateUser({ ...user, avatarUrl: '' })}
                      className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold text-xs transition-colors"
                    >
                      {lang === 'id' ? 'Hapus' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3 w-1/2">
                <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner">
                  <User size={18} />
                </div>
                <span className="font-bold text-[15px] text-slate-200">{t('nickname')}</span>
              </div>
              <input 
                type="text" 
                value={user.name}
                onChange={(e) => updateUser({ ...user, name: e.target.value })}
                placeholder={t('enterNicknamePlaceholder')}
                className="bg-transparent text-indigo-400 font-bold text-[15px] outline-none text-right w-1/2 placeholder-slate-600 focus:text-indigo-300 transition-colors"
                maxLength={20}
              />
            </div>
            
            <div className="flex flex-col border-b border-slate-800/60">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner">
                    <Moon size={18} />
                  </div>
                  <span className="font-bold text-[15px] text-slate-200">{t('appThemeLabel')}</span>
                </div>
                <select 
                  value={appTheme}
                  onChange={(e) => setAppTheme(e.target.value as any)}
                  className="bg-transparent text-indigo-400 font-bold text-[15px] outline-none cursor-pointer text-right appearance-none focus:text-indigo-300 transition-colors"
                >
                  <option value="dark" className="bg-slate-900">{t('themeDark')}</option>
                  <option value="light" className="bg-slate-900">{t('themeLight')}</option>
                  <option value="pink" className="bg-slate-900">{t('themePink')}</option>
                  <option value="cool" className="bg-slate-900">{t('themeCool')}</option>
                  <option value="cute" className="bg-slate-900">{t('themeCute')}</option>
                  <option value="wallpaper" className="bg-slate-900">{t('themeWallpaper')}</option>
                </select>
              </div>

              {appTheme === 'wallpaper' && (
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3 bg-slate-900/30 border-t border-slate-800/30 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs text-slate-400">
                    {t('uploadWallpaperDesc')}
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 py-2.5 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-xs text-center cursor-pointer transition-colors">
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
                        className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold text-xs transition-colors"
                      >
                        {t('removeWallpaper')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col border-b border-slate-800/60">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner">
                    <ImageIcon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[15px] text-slate-200">{t('bannerWallpaperLabel')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-xs cursor-pointer transition-colors">
                    {lang === 'id' ? 'Pilih' : 'Choose'}
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
                      className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl font-bold text-xs transition-colors"
                    >
                      {lang === 'id' ? 'Hapus' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 pt-1 flex flex-col gap-1 bg-slate-900/10">
                <p className="text-xs text-slate-400">
                  {t('uploadBannerWallpaperDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner">
                  <Globe size={18} />
                </div>
                <span className="font-bold text-[15px] text-slate-200">{t('lang')}</span>
              </div>
              <select 
                value={lang} onChange={(e) => setLang(e.target.value as 'id' | 'en')}
                className="bg-transparent text-indigo-400 font-bold text-[15px] outline-none cursor-pointer text-right appearance-none focus:text-indigo-300 transition-colors"
              >
                <option value="id" className="bg-slate-900">Indonesia</option>
                <option value="en" className="bg-slate-900">English</option>
              </select>
            </div>
          </div>
        </section>

        {/* NOTIFIKASI & HABIT */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"><Bell size={16} className="text-orange-400" /> {t('notifications')}</h3>
          <div className="bg-slate-800/40 border border-slate-800/60 rounded-3xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${reminderActive ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-slate-800/80 text-slate-400'}`}>
                  <Bell size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-slate-200">
                    {t('appReminder')}
                  </span>
                  <span className="text-xs font-medium text-slate-400 mt-0.5">{reminderActive ? t('activeLabel') : t('inactiveLabel')}</span>
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
                className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors shadow-inner ${reminderActive ? 'bg-orange-500' : 'bg-slate-700/50 border border-slate-600/30'}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform shadow-sm ${reminderActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className={`flex items-center justify-between p-4 border-b border-slate-800/60 transition-all duration-300 ${!reminderActive ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner">
                  <Clock size={18} />
                </div>
                <span className="font-bold text-[15px] text-slate-200">{t('reminderTime')}</span>
              </div>
              <input 
                type="time" 
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                disabled={!reminderActive}
                className="bg-slate-900/80 border border-slate-700/50 text-orange-400 font-bold px-4 py-2 rounded-xl text-[15px] outline-none appearance-none hover:bg-slate-800 transition-colors cursor-pointer"
              />
            </div>

            {/* Test Notification Row */}
            <div className="p-4 bg-slate-900/20 flex flex-col gap-2">
              <button
                onClick={triggerTestNotif}
                className="w-full py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold rounded-2xl text-xs border border-orange-500/20 hover:border-orange-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Bell size={14} className="animate-bounce" />
                {t('sendTestNotification')}
              </button>
              {testNotifMsg && (
                <p className="text-[11px] text-slate-400 leading-normal text-center px-3 py-2 mt-1 bg-slate-950/40 border border-slate-800/60 rounded-xl animate-in fade-in duration-200">
                  {testNotifMsg}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* DATA & CADANGAN */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"><FileText size={16} className="text-emerald-400" /> {t('dataBackup')}</h3>
          <div className="bg-slate-800/40 border border-slate-800/60 rounded-3xl flex flex-col overflow-hidden">
            <button onClick={handleExportClick} className="flex items-center justify-between p-4 hover:bg-slate-800/60 transition-colors border-b border-slate-800/60 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-500/20">
                  <Download size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-slate-200">{t('backupExport')}</span>
                  <span className="text-[11px] font-medium text-slate-400 mt-0.5">{t('backupExportDesc')}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={handleImportClick} className="flex items-center justify-between p-4 hover:bg-slate-800/60 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center shadow-inner border border-sky-500/20">
                  <Upload size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-slate-200">{t('restoreImport')}</span>
                  <span className="text-[11px] font-medium text-slate-400 mt-0.5">{t('restoreImportDesc')}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </section>

        {/* PRIVASI & KEAMANAN */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"><Lock size={16} className="text-rose-400" /> {t('securityAdvanced')}</h3>
          <div className="bg-slate-800/40 border border-slate-800/60 rounded-3xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner transition-all ${appPin ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800/80 text-slate-400'}`}>
                  <Lock size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-slate-200">{t('pinLock')}</span>
                  <span className="text-[11px] font-medium text-slate-400 mt-0.5">{t('pinLockDesc')}</span>
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
                className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors shadow-inner ${appPin ? 'bg-rose-500' : 'bg-slate-700/50 border border-slate-600/30'}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform shadow-sm ${appPin ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {appPin && (
              <button 
                onClick={() => {
                  setPinInput('');
                  setPinError(false);
                  setPinModalMode('verify');
                }}
                className="flex items-center justify-between p-4 hover:bg-slate-800/60 transition-colors border-b border-slate-800/60 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner">
                    <Key size={18} />
                  </div>
                  <span className="font-bold text-[15px] text-slate-200">{t('changePin')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            )}

            <button 
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors shadow-inner border border-red-500/20">
                  <Trash2 size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-red-500">{t('reset')}</span>
                  <span className="text-[11px] font-medium text-slate-400 mt-0.5">{t('resetConfirm')}</span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* HIBURAN */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"><Gamepad2 size={16} className="text-purple-400" /> {t('entertainment')}</h3>
          <div className="bg-slate-800/40 border border-slate-800/60 rounded-3xl flex flex-col overflow-hidden">
            <button 
              onClick={() => onNavigate && onNavigate('games-hub')}
              className="flex items-center justify-between p-4 hover:bg-slate-800/60 transition-colors w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-inner border border-purple-500/20">
                  <Gamepad2 size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-slate-200">Mini Games</span>
                  <span className="text-[11px] font-medium text-slate-400 mt-0.5">{t('entertainmentDesc')}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </section>
        
        {/* TENTANG APLIKASI */}
        <section className="pb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"><Info size={16} className="text-sky-400" /> {t('aboutApp')}</h3>
          <div className="bg-slate-800/40 border border-slate-800/60 rounded-3xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner">
                  <Smartphone size={18} />
                </div>
                <span className="font-bold text-[15px] text-slate-200">{t('appVersion')}</span>
              </div>
              <span className="font-black text-[15px] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full text-center">v3.0</span>
            </div>

            <button onClick={() => setShowUpdateNotes(true)} className="flex items-center justify-between p-4 hover:bg-slate-800/60 transition-colors border-b border-slate-800/60 w-full text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner">
                  <FileText size={18} />
                </div>
                <span className="font-bold text-[15px] text-slate-200">{t('updateNotes')}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>

            <button onClick={() => setShowPrivacyPolicy(true)} className="flex items-center justify-between p-4 hover:bg-slate-800/60 transition-colors border-b border-slate-800/60 w-full text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 shadow-inner">
                  <Shield size={18} />
                </div>
                <span className="font-bold text-[15px] text-slate-200">{t('privacyPolicy')}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex flex-col p-4 bg-slate-900/30">
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4 text-center">
                {lang === 'id' 
                  ? 'Saran dan kritik Anda sangat berarti bagi kami. Silakan hubungi Instagram Noto.' 
                  : 'Your suggestions and feedback are very meaningful to us. Please contact Noto on Instagram.'}
              </p>
              <button 
                onClick={() => window.open('https://instagram.com/noto.grow', '_blank')} 
                className="flex items-center justify-center gap-2 p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all w-full border border-indigo-500/20 font-bold text-[15px] shadow-sm active:scale-95"
              >
                <MessageCircle size={18} />
                <span>@noto.grow</span>
              </button>
            </div>
          </div>
          
          <div className="mt-8 mb-4 mx-2 p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-sm hidden">
            <p className="text-xs text-slate-400 font-medium text-center leading-relaxed">
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

        {pinModalMode && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-50">
            <div className={`bg-slate-900 border border-slate-800 p-4 md:p-4 rounded-3xl w-full max-w-sm ${pinError ? 'animate-pulse border-red-500/50' : ''}`}>
              <h3 className="text-lg font-bold text-slate-50 mb-2">
                {pinModalMode === 'create' && t('createPin')}
                {(pinModalMode === 'verify' || pinModalMode === 'remove') && t('verifyPin')}
                {pinModalMode === 'change' && t('changePin')}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
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
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && pinInput.length === 4) {
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
                      if (hashed === appPin || pinInput === appPin) { // fallback for legacy plaintext pin
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
                      if (hashed === appPin || pinInput === appPin) { // fallback for legacy plaintext pin
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
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 tracking-[1em] text-center mb-4 outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••"
              />
              {(pinModalMode === 'create' || pinModalMode === 'change') && (
                <div className="space-y-3 mb-6">
                  <input
                    type="text"
                    value={pinQuestionInput}
                    onChange={e => setPinQuestionInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 text-sm outline-none focus:border-indigo-500 transition-colors"
                    placeholder={t('securityQuestionPlaceholder')}
                  />
                  <input
                    type="text"
                    value={pinAnswerInput}
                    onChange={e => setPinAnswerInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 text-sm outline-none focus:border-indigo-500 transition-colors"
                    placeholder={t('securityAnswerPlaceholder')}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setPinModalMode(null);
                    setPinInput('');
                    setPinQuestionInput('');
                    setPinAnswerInput('');
                    setPinError(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  disabled={pinInput.length !== 4 || ((pinModalMode === 'create' || pinModalMode === 'change') && (!pinQuestionInput.trim() || !pinAnswerInput.trim()))}
                  onClick={async () => {
                    const { hashPin } = await import('../utils');
                    if (pinModalMode === 'create' || pinModalMode === 'change') {
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
                  }}
                  className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors ${pinInput.length === 4 && (!['create', 'change'].includes(pinModalMode) || (pinQuestionInput.trim() && pinAnswerInput.trim())) ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-slate-800 text-slate-400 cursor-not-allowed'}`}
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
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-50">
            <div className={`bg-slate-900 border border-slate-800 p-4 md:p-4 rounded-3xl w-full max-w-sm ${backupError ? 'animate-pulse border-red-500/50' : ''}`}>
              <h3 className="text-lg font-bold text-slate-50 mb-2">
                {backupModalMode === 'export' ? t('backupPasswordTitle') : t('enterBackupPasswordTitle')}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {backupModalMode === 'export' 
                  ? t('backupExportPasswordDesc') 
                  : t('backupImportPasswordDesc')}
              </p>
              <input
                type="password"
                value={backupPassword}
                onChange={e => setBackupPassword(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (backupModalMode === 'export') processExport();
                    else processImport();
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 text-center mb-4 outline-none focus:border-indigo-500 transition-colors"
                placeholder="Password"
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setBackupModalMode(null);
                    setBackupPassword('');
                    setBackupFileContent(null);
                    setBackupError(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={backupModalMode === 'export' ? processExport : processImport}
                  className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors bg-indigo-500 hover:bg-indigo-600"
                >
                  {backupModalMode === 'export' ? (backupPassword ? t('exportWithEncryption') : t('exportWithoutEncryption')) : t('importLabel')}
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

