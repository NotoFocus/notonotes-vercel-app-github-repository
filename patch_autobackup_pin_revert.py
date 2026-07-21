import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

new_backup_ui = """              <div className="relative w-full max-w-[200px] mx-auto mb-6">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={enteredAutoBackupPin}
                  autoComplete="off"
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setEnteredAutoBackupPin(val);
                    setEnteredAutoBackupPinError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && enteredAutoBackupPin.length === 4) {
                      executeAutoBackup();
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                  autoFocus
                />
                <div className="flex justify-center gap-4 pointer-events-none">
                  {[0, 1, 2, 3].map(i => {
                    const isFilled = enteredAutoBackupPin.length > i;
                    const isActive = enteredAutoBackupPin.length === i;
                    return (
                      <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${
                          isFilled 
                            ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] scale-110' 
                            : enteredAutoBackupPinError 
                              ? 'bg-red-500/40' 
                              : isActive 
                                ? 'bg-slate-700/80 scale-125 ring-2 ring-indigo-500/50' 
                                : 'bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>"""

old_backup_ui = """              <div className="relative">
                <div className={`flex justify-center gap-3 mb-6 ${enteredAutoBackupPinError ? 'animate-pulse' : ''}`}>
                  {[0, 1, 2, 3].map(i => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        enteredAutoBackupPin.length > i 
                          ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                          : enteredAutoBackupPinError ? 'bg-red-500/20' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        if (enteredAutoBackupPin.length < 4) {
                          setEnteredAutoBackupPin(prev => prev + num);
                          setEnteredAutoBackupPinError(false);
                        }
                      }}
                      className="aspect-square rounded-xl bg-slate-900/40 hover:bg-slate-800 border border-slate-800/60 flex items-center justify-center text-xl font-semibold text-slate-300 transition-all active:scale-95"
                    >
                      {num}
                    </button>
                  ))}
                  <div className="aspect-square"></div>
                  <button
                    type="button"
                    onClick={() => {
                      if (enteredAutoBackupPin.length < 4) {
                        setEnteredAutoBackupPin(prev => prev + '0');
                        setEnteredAutoBackupPinError(false);
                      }
                    }}
                    className="aspect-square rounded-xl bg-slate-900/40 hover:bg-slate-800 border border-slate-800/60 flex items-center justify-center text-xl font-semibold text-slate-300 transition-all active:scale-95"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnteredAutoBackupPin(prev => prev.slice(0, -1));
                      setEnteredAutoBackupPinError(false);
                    }}
                    className="aspect-square rounded-xl bg-slate-900/40 hover:bg-slate-800 border border-slate-800/60 flex items-center justify-center text-lg font-semibold text-slate-500 hover:text-slate-300 transition-all active:scale-95"
                  >
                    ⌫
                  </button>
                </div>
              </div>"""

content = content.replace(old_backup_ui, new_backup_ui)

with open('src/App.tsx', 'w') as f:
    f.write(content)
