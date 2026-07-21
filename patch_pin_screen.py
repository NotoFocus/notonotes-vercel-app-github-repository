import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

new_handle = """  const handleKeyPress = async (key: string) => {
    if (key === 'backspace') {
      setInput(prev => prev.slice(0, -1));
      setError(false);
      return;
    }
    
    if (input.length >= 4) return;
    
    const newVal = input + key;
    setInput(newVal);
    setError(false);
    
    if (newVal.length === 4) {
      const { hashPin } = await import('./utils');
      const hashed = await hashPin(newVal);
      if (hashed === correctPin || newVal === correctPin) {
        if (newVal === correctPin && newVal !== hashed) {
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
    }
  };

  const getThemeClass = () => {"""

content = content.replace("  const getThemeClass = () => {", new_handle)

new_ui = """        <div className="w-full max-w-[280px] mb-8">
          <div className={`flex justify-center gap-4 mb-8 ${error ? 'animate-pulse' : ''}`}>
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-5 h-5 rounded-full transition-all duration-300 ${
                  input.length > i 
                    ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                    : error ? 'bg-red-500/20' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num.toString())}
                className="aspect-square rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-2xl font-semibold text-slate-200 transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
            <div className="aspect-square"></div>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="aspect-square rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-2xl font-semibold text-slate-200 transition-all active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('backspace')}
              className="aspect-square rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-xl font-semibold text-slate-400 hover:text-slate-200 transition-all active:scale-95"
            >
              ⌫
            </button>
          </div>
        </div>"""

old_ui = """        <div className="w-full max-w-[280px] mb-12">
          <input
            type="password"
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={4}
            value={input}
            onChange={async (e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setInput(val);
              setError(false);
              
              if (val.length === 4) {
                const { hashPin } = await import('./utils');
                const hashed = await hashPin(val);
                if (hashed === correctPin || val === correctPin) { // support legacy plaintext pin
                  if (val === correctPin && val !== hashed) {
                    await recordPinChange(hashed); // seamlessly upgrade to hash
                  }
                  setTimeout(onUnlock, 150);
                } else {
                  setError(true);
                  setTimeout(() => {
                    setInput('');
                    setError(false);
                  }, 800);
                }
              }
            }}
            placeholder="••••"
            className={`w-full text-center text-3xl tracking-[0.5em] font-mono bg-slate-900/80 border-2 py-4 px-6 rounded-2xl outline-none transition-all ${
              error 
                ? 'border-red-500 bg-red-500/10 text-red-400 animate-pulse' 
                : 'border-slate-800 focus:border-indigo-500 focus:bg-slate-950 focus:shadow-[0_0_15px_rgba(99,102,241,0.25)] text-indigo-400'
            }`}
            autoFocus
          />
        </div>"""

content = content.replace(old_ui, new_ui)

with open('src/App.tsx', 'w') as f:
    f.write(content)
