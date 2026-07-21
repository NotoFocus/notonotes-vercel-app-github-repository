import re

with open('src/screens/SettingsScreen.tsx', 'r') as f:
    content = f.read()

# I will write a regex to replace each block of <input ... opacity-0 ... /> ... </div> with the new keypad.
# Wait, each one has different state variables (e.g. pinInput, autoBackupEnableVerifyPin, autoBackupPinSetupConfirm)
# So a reusable component is best.

# Insert the component at the top of the file, after imports.
keypad_component = """
function CustomKeypad({ value, onChange, onEnter, error, maxLength = 4 }: { value: string, onChange: (val: string) => void, onEnter?: () => void, error?: boolean, maxLength?: number }) {
  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= maxLength) return;
    const newVal = value + key;
    onChange(newVal);
    if (newVal.length === maxLength && onEnter) {
      setTimeout(onEnter, 50);
    }
  };

  return (
    <div className="w-full max-w-[280px] mx-auto mb-6">
      <div className={`flex justify-center gap-4 mb-8 min-h-[20px] items-center ${error ? 'animate-pulse' : ''}`}>
        {Array.from({ length: maxLength }).map((_, i) => {
          const isFilled = value.length > i;
          return (
            <div 
              key={i} 
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                isFilled 
                  ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)] scale-110' 
                  : error ? 'bg-red-500/50' : 'bg-slate-800/80'
              }`}
            />
          );
        })}
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => handleKeyPress(num.toString())}
            className="w-full aspect-square rounded-full bg-transparent hover:bg-slate-800/60 active:bg-slate-700 flex items-center justify-center text-2xl sm:text-3xl font-light text-slate-200 transition-colors"
          >
            {num}
          </button>
        ))}
        <div className="w-full aspect-square"></div>
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          className="w-full aspect-square rounded-full bg-transparent hover:bg-slate-800/60 active:bg-slate-700 flex items-center justify-center text-2xl sm:text-3xl font-light text-slate-200 transition-colors"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('backspace')}
          className="w-full aspect-square rounded-full bg-transparent hover:bg-slate-800/60 active:bg-slate-700 flex items-center justify-center text-xl sm:text-2xl text-slate-400 hover:text-slate-200 transition-colors"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
"""

if "function CustomKeypad" not in content:
    content = content.replace("export default function SettingsScreen(", keypad_component + "\nexport default function SettingsScreen(")

with open('src/screens/SettingsScreen.tsx', 'w') as f:
    f.write(content)
