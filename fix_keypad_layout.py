import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    new_keypad = """function CustomKeypad({ value = '', onChange, onEnter, error, maxLength = 4 }: { value?: string, onChange: (val: string) => void, onEnter?: () => void, error?: boolean, maxLength?: number }) {
  const safeValue = value || '';
  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      onChange(safeValue.slice(0, -1));
      return;
    }
    if (safeValue.length >= maxLength) return;
    const newVal = safeValue + key;
    onChange(newVal);
    if (newVal.length === maxLength && onEnter) {
      setTimeout(onEnter, 50);
    }
  };

  return (
    <div className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] mx-auto mb-6">
      <div className={`flex justify-center gap-6 sm:gap-8 md:gap-10 mb-10 min-h-[24px] items-center ${error ? 'animate-pulse' : ''}`}>
        {Array.from({ length: maxLength }).map((_, i) => {
          const isFilled = safeValue.length > i;
          return (
            <div 
              key={i} 
              className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full transition-all duration-300 ${
                isFilled 
                  ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110' 
                  : error ? 'bg-red-500/50' : 'bg-slate-800/80'
              }`}
            />
          );
        })}
      </div>
      
      <div className="grid grid-cols-3 gap-3 sm:gap-5 md:gap-6 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => handleKeyPress(num.toString())}
            className="w-full aspect-square rounded-full bg-transparent hover:bg-slate-800/60 active:bg-slate-700 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-light text-slate-200 transition-colors"
          >
            {num}
          </button>
        ))}
        <div className="w-full aspect-square"></div>
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          className="w-full aspect-square rounded-full bg-transparent hover:bg-slate-800/60 active:bg-slate-700 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-light text-slate-200 transition-colors"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('backspace')}
          className="w-full aspect-square rounded-full bg-transparent hover:bg-slate-800/60 active:bg-slate-700 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl text-slate-400 hover:text-slate-200 transition-colors"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}"""

    content = re.sub(
        r'function CustomKeypad\(\{ value = \'\', onChange, onEnter, error, maxLength = 4 \}: \{ value\?: string, onChange: \(val: string\) => void, onEnter\?: \(\) => void, error\?: boolean, maxLength\?: number \}\) \{.*?\n\}\n',
        new_keypad + "\n",
        content,
        flags=re.DOTALL
    )

    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/App.tsx')
fix_file('src/screens/SettingsScreen.tsx')
