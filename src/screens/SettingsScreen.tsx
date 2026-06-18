import React, { useState } from 'react';
import { 
  Moon, Download, Upload, Bell, Lock, FileText, Smartphone, 
  ChevronRight, User, Globe, Clock, Key, Trash2, Info, Shield, MessageCircle
} from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';

export default function SettingsScreen({ appTheme, setAppTheme }: { appTheme: string, setAppTheme: (t: 'dark' | 'light' | 'pink') => void }) {
  const { transactions, notes, tasks, user, updateUser, appPin, setAppPin, setIsUnlocked, importData, clearAllData, lang, setLang, streak, reminderActive, setReminderActive, reminderTime, setReminderTime } = useAppStore();
  const t = useTranslation(lang);

  const [pinModalMode, setPinModalMode] = useState<'create' | 'verify' | 'change' | 'remove' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showUpdateNotes, setShowUpdateNotes] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify({ notes, tasks, transactions });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'noto_backup.json';
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage(t('toastExportSuccess'));
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            if (data.notes && data.tasks) {
              const parsedTransactions = data.transactions || [];
              const seenTxIds = new Set();
              const uniqueTransactions = parsedTransactions.map((t: any) => {
                if (seenTxIds.has(t.id)) t.id = crypto.randomUUID();
                seenTxIds.add(t.id);
                return t;
              });

              const seenTaskIds = new Set();
              const uniqueTasks = data.tasks.map((t: any) => {
                if (seenTaskIds.has(t.id)) t.id = crypto.randomUUID();
                seenTaskIds.add(t.id);
                return t;
              });

              const seenNoteIds = new Set();
              const uniqueNotes = data.notes.map((n: any) => {
                if (seenNoteIds.has(n.id)) n.id = crypto.randomUUID();
                seenNoteIds.add(n.id);
                return n;
              });
              
              importData(uniqueNotes, uniqueTasks, uniqueTransactions);
              setToastMessage(t('toastImportSuccess'));
              setTimeout(() => setToastMessage(null), 3000);
            } else {
              setToastMessage(t('toastImportInvalid'));
              setTimeout(() => setToastMessage(null), 3000);
            }
          } catch(e) {
            setToastMessage(t('toastImportCorrupt'));
            setTimeout(() => setToastMessage(null), 3000);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200">
      <div className="flex-none h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center">
        <span className="font-bold text-2xl text-slate-50 tracking-tight">{t('settingsMenu')}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 w-full">
        <div className="w-full px-6 py-6 space-y-8">
          
          {/* AKUN & TAMPILAN */}
        <section>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-3 flex items-center gap-2"><Smartphone size={14}/> {t('appearance')}</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <User size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('nickname')}</span>
              </div>
              <input 
                type="text" 
                value={user.name}
                onChange={(e) => updateUser({ ...user, name: e.target.value })}
                placeholder="Masukkan nama"
                className="bg-transparent text-indigo-400 font-bold text-sm outline-none text-right w-1/2 placeholder-slate-600"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Moon size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{lang === 'id' ? 'Tema Aplikasi' : 'App Theme'}</span>
              </div>
              <select 
                value={appTheme}
                onChange={(e) => setAppTheme(e.target.value as 'dark' | 'light' | 'pink')}
                className="bg-transparent text-indigo-400 font-bold text-sm outline-none cursor-pointer text-right"
              >
                <option value="dark">{lang === 'id' ? 'Gelap' : 'Dark'}</option>
                <option value="light">{lang === 'id' ? 'Terang' : 'Light'}</option>
                <option value="pink">{lang === 'id' ? 'Ecy' : 'Ecy'}</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 px-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Globe size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('lang')}</span>
              </div>
              <select 
                value={lang} onChange={(e) => setLang(e.target.value as 'id' | 'en')}
                className="bg-transparent text-indigo-400 font-bold text-sm outline-none cursor-pointer text-right"
              >
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </section>

        {/* NOTIFIKASI & HABIT */}
        <section>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-3 flex items-center gap-2"><Bell size={14}/> {t('notifications')}</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${reminderActive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'} flex items-center justify-center`}>
                  <Bell size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-slate-300">
                    {t('appReminder')}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">{reminderActive ? t('activeLabel') : t('inactiveLabel')}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setReminderActive(!reminderActive);
                  if (!reminderActive && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                    Notification.requestPermission().catch(() => {});
                  }
                }} 
                className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors ${reminderActive ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${reminderActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className={`flex items-center justify-between p-4 px-5 transition-opacity ${!reminderActive ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Clock size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('reminderTime')}</span>
              </div>
              <input 
                type="time" 
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                disabled={!reminderActive}
                className="bg-slate-800 text-indigo-400 font-bold px-3 py-1.5 rounded-lg text-sm border-none outline-none appearance-none"
              />
            </div>
          </div>
        </section>

        {/* DATA & CADANGAN */}
        <section>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-3 flex items-center gap-2"><FileText size={14}/> {t('dataBackup')}</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
            <button onClick={handleExport} className="flex items-center justify-between p-4 px-5 hover:bg-slate-800/50 transition-colors border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Download size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('backupExport')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
            <button onClick={handleImport} className="flex items-center justify-between p-4 px-5 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Upload size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('restoreImport')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </section>

        {/* PRIVASI & KEAMANAN */}
        <section>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-3 flex items-center gap-2"><Lock size={14}/> {t('securityAdvanced')}</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${appPin ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'} flex items-center justify-center`}>
                  <Lock size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('pinLock')}</span>
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
                className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors ${appPin ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${appPin ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {appPin && (
              <button 
                onClick={() => {
                  setPinInput('');
                  setPinError(false);
                  setPinModalMode('verify');
                }}
                className="flex items-center justify-between p-4 px-5 hover:bg-slate-800/50 transition-colors border-b border-slate-800 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Key size={16} />
                  </div>
                  <span className="font-medium text-sm text-slate-300">{t('changePin')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            )}

            <button 
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-between p-4 px-5 hover:bg-red-500/5 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors">
                  <Trash2 size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-red-500">{t('reset')}</span>
                  <span className="text-xs text-slate-500 mt-0.5">{t('resetConfirm')}</span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* TENTANG APLIKASI */}
        <section className="pb-8">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-3 flex items-center gap-2"><Info size={14}/> {t('aboutApp')}</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Smartphone size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('appVersion')}</span>
              </div>
              <span className="font-bold text-sm text-slate-500">v1.2.0</span>
            </div>

            <button onClick={() => setShowUpdateNotes(true)} className="flex items-center justify-between p-4 px-5 hover:bg-slate-800/50 transition-colors border-b border-slate-800 w-full text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <FileText size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('updateNotes')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <button onClick={() => setShowPrivacyPolicy(true)} className="flex items-center justify-between p-4 px-5 hover:bg-slate-800/50 transition-colors border-b border-slate-800 w-full text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Shield size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('privacyPolicy')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <div className="flex flex-col p-4 px-5 border-b border-slate-800 bg-slate-900/50">
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {lang === 'id' 
                  ? 'Saran dan kritik Anda sangat berarti bagi kami. Silakan hubungi Instagram Noto.' 
                  : 'Your suggestions and feedback are very meaningful to us. Please contact Noto on Instagram.'}
              </p>
              <button 
                onClick={() => window.open('https://instagram.com/noto.grow', '_blank')} 
                className="flex items-center justify-center gap-2 p-3 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-colors w-full border border-indigo-500/20"
              >
                <MessageCircle size={16} />
                <span className="font-semibold text-sm">@noto.grow</span>
              </button>
            </div>
          </div>
          
          <div className="mt-6 mb-2 mx-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              {lang === 'id'
                ? 'Noto saat ini masih dalam tahap pengembangan dan belum ada versi Aplikasi.'
                : 'Noto is currently still in development and does not have an App version yet.'}
            </p>
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-600">NOTO</p>
            <p className="text-[10px] text-slate-700 mt-1">{t('madeWithSimplicity')}</p>
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
                onKeyDown={e => {
                  if (e.key === 'Enter' && pinInput.length === 4) {
                    if (pinModalMode === 'create' || pinModalMode === 'change') {
                      setAppPin(pinInput);
                      setIsUnlocked(true);
                      setPinModalMode(null);
                    } else if (pinModalMode === 'verify') {
                      if (pinInput === appPin) {
                        setPinInput('');
                        setPinError(false);
                        setPinModalMode('change');
                      } else {
                        setPinError(true);
                        setPinInput('');
                        setTimeout(() => setPinError(false), 500);
                      }
                    } else if (pinModalMode === 'remove') {
                      if (pinInput === appPin) {
                        setAppPin(null);
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
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setPinModalMode(null);
                    setPinInput('');
                    setPinError(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  disabled={pinInput.length !== 4}
                  onClick={() => {
                    if (pinModalMode === 'create' || pinModalMode === 'change') {
                      setAppPin(pinInput);
                      setIsUnlocked(true);
                      setPinModalMode(null);
                    } else if (pinModalMode === 'verify') {
                      if (pinInput === appPin) {
                        setPinInput('');
                        setPinError(false);
                        setPinModalMode('change');
                      } else {
                        setPinError(true);
                        setPinInput('');
                        setTimeout(() => setPinError(false), 500);
                      }
                    } else if (pinModalMode === 'remove') {
                      if (pinInput === appPin) {
                        setAppPin(null);
                        setPinModalMode(null);
                      } else {
                        setPinError(true);
                        setPinInput('');
                        setTimeout(() => setPinError(false), 500);
                      }
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors ${pinInput.length === 4 ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
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
                  onClick={() => {
                    clearAllData();
                    setShowResetConfirm(false);
                    setTimeout(() => {
                      window.location.reload();
                    }, 100);
                  }}
                  className="px-4 py-2 rounded-xl text-white text-sm font-bold bg-red-500 hover:bg-red-600 transition-colors"
                >
                  {t('yesReset')}
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
                  <div className="bg-slate-800/50 h-[1px] w-full"></div>
                  <div>
                    <h5 className="font-semibold text-emerald-400 mb-1 flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{t('privacyPolicy5')}</span>
                    </h5>
                    <p className="pl-6 opacity-90 text-xs">{t('privacyPolicy6')}</p>
                  </div>
                  <div className="bg-slate-800/50 h-[1px] w-full"></div>
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
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-800 pt-5">
                  <h4 className="font-bold text-slate-50 text-lg mb-3">{t('auditChecklistTitle')}</h4>
                  <ul className="space-y-2 list-disc pl-5 text-emerald-400 text-xs font-medium">
                    <li><span className="text-slate-300">{t('auditChecklist1')}</span></li>
                    <li><span className="text-slate-300">{t('auditChecklist2')}</span></li>
                    <li><span className="text-slate-300">{t('auditChecklist3')}</span></li>
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
                <p><strong>Noto v1.2.0</strong></p>
                <p>{t('aboutAppDesc')}</p>
                <p><strong>{t('aboutAppWhatsNew')}</strong></p>
                <ul className="list-disc pl-5 space-y-2">
                  <li className="text-emerald-400"><strong>{t('aboutAppFeat1')}</strong> <span className="text-slate-300">{t('aboutAppFeat1Desc')}</span></li>
                  <li><strong>{t('aboutAppFeat7')}</strong> {t('aboutAppFeat7Desc')}</li>
                  <li><strong>{t('aboutAppFeat8')}</strong> {t('aboutAppFeat8Desc')}</li>
                  <li><strong>{t('aboutAppFeat2')}</strong> {t('aboutAppFeat2Desc')}</li>
                  <li><strong>{t('aboutAppFeat3')}</strong> {t('aboutAppFeat3Desc')}</li>
                  <li><strong>{t('aboutAppFeat4')}</strong> {t('aboutAppFeat4Desc')}</li>
                  <li><strong>{t('aboutAppFeat10')}</strong> {t('aboutAppFeat10Desc')}</li>
                  <li><strong>{t('aboutAppFeat5')}</strong> {t('aboutAppFeat5Desc')}</li>
                  <li><strong>{t('aboutAppFeat6')}</strong> {t('aboutAppFeat6Desc')}</li>
                  <li><strong>{t('aboutAppFeat9')}</strong> {t('aboutAppFeat9Desc')}</li>
                </ul>
                
                <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center leading-relaxed">
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

