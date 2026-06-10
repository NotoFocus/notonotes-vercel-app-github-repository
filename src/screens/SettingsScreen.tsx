import React, { useState } from 'react';
import { 
  Moon, Download, Upload, Bell, Lock, FileText, Smartphone, 
  ChevronRight, User, Globe, Clock, Key, Trash2, Info, Shield, MessageCircle
} from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';

export default function SettingsScreen({ isDarkMode, toggleDark }: { isDarkMode: boolean, toggleDark: () => void }) {
  const { notes, tasks, user, updateUser, appPin, setAppPin, setIsUnlocked, importData, clearAllData, lang, setLang, streak, reminderActive, setReminderActive, reminderTime, setReminderTime } = useAppStore();
  const t = useTranslation(lang);

  const [pinModalMode, setPinModalMode] = useState<'create' | 'verify' | 'change' | 'remove' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showUpdateNotes, setShowUpdateNotes] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify({ notes, tasks });
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
              
              importData(uniqueNotes, uniqueTasks);
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
        <span className="font-bold text-lg text-slate-50 tracking-tight">{t('settingsMenu')}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar pb-6 space-y-8">
        
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
                <span className="font-medium text-sm text-slate-300">{t('darkTheme')}</span>
              </div>
              <button 
                onClick={toggleDark}
                className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                 <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
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
              <span className="font-bold text-sm text-slate-500">v1.0.0</span>
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

            <button onClick={() => window.open('https://instagram.com/noto.grow', '_blank')} className="flex items-center justify-between p-4 px-5 hover:bg-slate-800/50 transition-colors w-full text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <MessageCircle size={16} />
                </div>
                <span className="font-medium text-sm text-slate-300">{t('contactDeveloper')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-600">NOTO</p>
            <p className="text-[10px] text-slate-700 mt-1">{t('madeWithSimplicity')}</p>
          </div>
        </section>

        {pinModalMode && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-50">
            <div className={`bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm ${pinError ? 'animate-pulse border-red-500/50' : ''}`}>
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
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm">
              <h3 className="text-lg font-bold text-red-400 mb-2">{t('reset')}</h3>
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
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col">
              <h3 className="text-xl font-bold text-slate-50 mb-4">{t('privacyPolicy')}</h3>
              <div className="overflow-y-auto pr-2 flex-1 space-y-4 mb-6 custom-scrollbar text-sm text-slate-300">
                <p><strong>{t('privacyPolicy1')}</strong></p>
                <p>{t('privacyPolicy2')}</p>
                <p><strong>{t('privacyPolicy3')}</strong> {t('privacyPolicy4')}</p>
                <p><strong>{t('privacyPolicy5')}</strong> {t('privacyPolicy6')}</p>
                <p><strong>{t('privacyPolicy7')}</strong> {t('privacyPolicy8')}</p>
                <p>{t('privacyPolicy9')}</p>
              </div>
              <button 
                onClick={() => setShowPrivacyPolicy(false)}
                className="w-full py-3 rounded-xl text-white text-sm font-bold bg-indigo-500 hover:bg-indigo-600 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* Update Notes / About App Modal */}
        {showUpdateNotes && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col">
              <h3 className="text-xl font-bold text-slate-50 mb-4">{t('aboutAppTitle')}</h3>
              <div className="overflow-y-auto pr-2 flex-1 space-y-4 mb-6 custom-scrollbar text-sm text-slate-300">
                <p><strong>Noto v1.0.0</strong></p>
                <p>{t('aboutAppDesc')}</p>
                <p><strong>{t('aboutAppWhatsNew')}</strong></p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>{t('aboutAppFeat1')}</strong> {t('aboutAppFeat1Desc')}</li>
                  <li><strong>{t('aboutAppFeat2')}</strong> {t('aboutAppFeat2Desc')}</li>
                  <li><strong>{t('aboutAppFeat3')}</strong> {t('aboutAppFeat3Desc')}</li>
                  <li><strong>{t('aboutAppFeat4')}</strong> {t('aboutAppFeat4Desc')}</li>
                  <li><strong>{t('aboutAppFeat5')}</strong> {t('aboutAppFeat5Desc')}</li>
                  <li><strong>{t('aboutAppFeat6')}</strong> {t('aboutAppFeat6Desc')}</li>
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

