import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add handleKeyPress
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
old_handle = """  const getThemeClass = () => {"""

if "const handleKeyPress =" not in content:
    content = content.replace(old_handle, new_handle, 1)

new_ui = """        <div className="w-full max-w-[280px] mb-8">
          <div className="mb-8">
            <div
              className={`w-full flex items-center justify-center text-3xl tracking-[0.5em] font-mono bg-slate-900/80 border-2 py-4 px-6 rounded-2xl transition-all h-[72px] ${
                error 
                  ? 'border-red-500 bg-red-500/10 text-red-400 animate-pulse' 
                  : 'border-indigo-500 bg-slate-950 shadow-[0_0_15px_rgba(99,102,241,0.25)] text-indigo-400'
              }`}
            >
              {input.length === 0 ? (
                <span className="text-slate-600 opacity-50 tracking-[0.5em]">••••</span>
              ) : (
                <span>{Array.from({ length: input.length }).map(() => '•').join('')}</span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-y-4 gap-x-6 justify-items-center max-w-[240px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num.toString())}
                className="w-16 h-16 rounded-full bg-slate-900/40 hover:bg-slate-800 border border-slate-800/60 flex items-center justify-center text-2xl font-medium text-slate-200 transition-all active:scale-95 active:bg-slate-700"
              >
                {num}
              </button>
            ))}
            <div className="w-16 h-16"></div>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="w-16 h-16 rounded-full bg-slate-900/40 hover:bg-slate-800 border border-slate-800/60 flex items-center justify-center text-2xl font-medium text-slate-200 transition-all active:scale-95 active:bg-slate-700"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('backspace')}
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all active:scale-95 active:bg-slate-700"
            >
              ⌫
            </button>
          </div>
        </div>"""

old_ui_regex = r'<div className="relative w-full max-w-\[240px\] mx-auto mb-12">.*?</div>\s*</div>'

import re
content = re.sub(r'<div className="relative w-full max-w-\[240px\] mx-auto mb-12">.*?</div>\s*</div>', new_ui, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
