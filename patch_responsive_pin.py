import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

new_ui = """        <div className="w-full max-w-[340px] mb-8">
          <div className={`flex justify-center gap-6 sm:gap-8 mb-12 min-h-[24px] items-center ${error ? 'animate-pulse' : ''}`}>
            {[0, 1, 2, 3].map(i => {
              const isFilled = input.length > i;
              return (
                <div 
                  key={i} 
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300 ${
                    isFilled 
                      ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110' 
                      : error ? 'bg-red-500/50' : 'bg-slate-800/80'
                  }`}
                />
              );
            })}
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num.toString())}
                className="w-full aspect-square rounded-full bg-transparent hover:bg-slate-800/60 active:bg-slate-700 flex items-center justify-center text-3xl sm:text-4xl font-light text-slate-200 transition-colors"
              >
                {num}
              </button>
            ))}
            <div className="w-full aspect-square"></div>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="w-full aspect-square rounded-full bg-transparent hover:bg-slate-800/60 active:bg-slate-700 flex items-center justify-center text-3xl sm:text-4xl font-light text-slate-200 transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('backspace')}
              className="w-full aspect-square rounded-full bg-transparent hover:bg-slate-800/60 active:bg-slate-700 flex items-center justify-center text-2xl sm:text-3xl text-slate-400 hover:text-slate-200 transition-colors"
            >
              ⌫
            </button>
          </div>
        </div>"""

content = re.sub(r'<div className="w-full max-w-\[280px\] mb-8">.*?</button>\s*</div>\s*</div>', new_ui, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
