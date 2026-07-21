import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# We need to replace the PinScreen function with a new version.
# Let's find where it starts and ends.
start_idx = content.find('function PinScreen({ correctPin,')
end_idx = content.find('export default function App() {')

if start_idx != -1 and end_idx != -1:
    pinscreen_code = """function PinScreen({ correctPin, onUnlock, appTheme, lang }: { correctPin: string, onUnlock: () => void, appTheme: string, lang: 'id' | 'en' }) {
  const t = useTranslation(lang);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const { user, recordPinChange, pinRecoveryQuestion, pinRecoveryAnswer, setPinRecoveryQuestion, setPinRecoveryAnswer } = useAppStore();

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotNameInput, setForgotNameInput] = useState('');

  const handleForgotPinSubmit = async () => {
    const isCorrect = pinRecoveryAnswer 
      ? forgotNameInput.trim().toLowerCase() === pinRecoveryAnswer.trim().toLowerCase()
      : forgotNameInput.trim().toLowerCase() === (user?.name || '').trim().toLowerCase();

    if (isCorrect) {
      await recordPinChange(null);
      setPinRecoveryQuestion(null);
      setPinRecoveryAnswer(null);
      setForgotModalVisible(false);
    } else {
      setError(true);
      setForgotNameInput('');
      setTimeout(() => setError(false), 500);
    }
  };

  const checkPin = async () => {
    if (input.length !== 4) return;
    const { hashPin } = await import('./utils');
    const hashed = await hashPin(input);
    if (hashed === correctPin || input === correctPin) {
      if (input === correctPin && input !== hashed) {
        await recordPinChange(hashed);
      }
      setTimeout(onUnlock, 150);
    } else {
      setError(true);
      setTimeout(() => {
        setInput('');
        setError(false);
      }, 800);
    }
  };

  const getThemeClass = () => {
    let base = '';
    if (appTheme === 'light') base = 'light-theme bg-slate-950';
    else if (appTheme === 'ecy') base = 'ecy-theme bg-slate-950';
    else if (appTheme === 'cool') base = 'cool-theme';
    else if (appTheme === 'cute') base = 'cute-theme';
    else if (appTheme === 'wallpaper') base = 'wallpaper-theme bg-transparent';
    else base = 'bg-slate-950';
    
    return base;
  };

  return (
    <div className={`min-h-screen w-full flex justify-center items-center ${getThemeClass()} relative overflow-hidden`}>
      <OfflineIndicator lang={lang} />
      <div className="w-full h-full min-h-[100dvh] md:min-h-0 md:h-auto md:max-w-xl md:rounded-[2rem] relative flex flex-col items-center justify-center text-slate-200 font-sans p-8 md:p-12 shadow-2xl sm:border-x md:border border-slate-800 bg-slate-950 backdrop-blur-md">
        <Lock className="w-12 h-12 text-indigo-500 mb-6" />
        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">{t('pinLocked')}</h2>
        <p className="text-slate-400 text-sm md:text-base mb-12">{t('enterPin')}</p>
        
        <CustomKeypad 
          value={input} 
          onChange={val => {
            setInput(val);
            setError(false);
          }} 
          onEnter={checkPin} 
          error={error} 
        />

        <button 
          type="button"
          onClick={() => setForgotModalVisible(true)}
          className="mt-6 text-sm text-slate-400 hover:text-indigo-400 transition-colors font-medium border-b border-transparent hover:border-indigo-400"
        >
          {t('forgotPin') || 'Lupa PIN?'}
        </button>

        {forgotModalVisible && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-50 rounded-[2rem]">
            <div className={`bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl ${error ? 'animate-pulse border-red-500/50' : ''}`}>
              <h3 className="text-lg md:text-xl font-bold text-slate-50 mb-2">{t('resetPin') || 'Reset PIN'}</h3>
              <p className="text-sm text-slate-400 mb-6">{t('resetPinDesc') || 'Jawab pertanyaan keamanan Anda untuk memverifikasi dan menghapus PIN.'}</p>
              {pinRecoveryQuestion && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mb-6">
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-2 block">
                    {lang === 'id' ? 'Pertanyaan' : 'Question'}
                  </span>
                  <p className="text-sm text-slate-200">{pinRecoveryQuestion}</p>
                </div>
              )}
              <input 
                type="text"
                autoFocus
                value={forgotNameInput}
                onChange={e => {
                  setForgotNameInput(e.target.value);
                  setError(false);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleForgotPinSubmit();
                }}
                placeholder={pinRecoveryQuestion ? (lang === 'id' ? 'Jawaban Anda...' : 'Your answer...') : (lang === 'id' ? 'Masukkan nama Anda...' : 'Enter your name...')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 text-sm outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600 mb-6"
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setForgotModalVisible(false);
                    setForgotNameInput('');
                  }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="button"
                  onClick={handleForgotPinSubmit}
                  disabled={!forgotNameInput.trim()}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lang === 'id' ? 'Verifikasi' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"""
    new_content = content[:start_idx] + pinscreen_code + content[end_idx:]
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)

