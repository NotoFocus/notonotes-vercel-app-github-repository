const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

const target1 = /\{\/\* Profile Card Banner \*\/\}[\s\S]*?\{\/\* Categorized Menu List \*\/\}/;

const replacement1 = `{/* Profile Card Banner */}
              <div className={isLiteMode ? "p-4 bg-slate-900/20 border border-slate-800/50 rounded-3xl flex items-center justify-between gap-4 relative overflow-hidden" : "p-6 bg-slate-900/40 border border-slate-800/80 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden"}>
                {!isLiteMode && <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />}
                
                <div className={isLiteMode ? "flex items-center gap-4 w-full" : "flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row w-full sm:w-auto"}>
                  <div className={isLiteMode ? "w-14 h-14 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0" : "w-16 h-16 rounded-full bg-slate-950 border-2 border-indigo-500/20 overflow-hidden flex items-center justify-center shrink-0"}>
                    {user.avatarUrl === 'indexeddb:user_avatar' ? (
                      <div className="w-full h-full bg-slate-800 animate-pulse" />
                    ) : user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={isLiteMode ? 20 : 24} className="text-slate-400" />
                    )}
                  </div>
                  <div className={isLiteMode ? "flex-1" : ""}>
                    <h2 className={isLiteMode ? "text-base font-bold text-slate-100" : "text-lg font-black text-slate-100 tracking-tight"}>
                      {lang === 'id' ? \`Halo, \${user.name || 'Pengguna'}!\` : \`Hello, \${user.name || 'User'}!\`}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isLiteMode 
                        ? (lang === 'id' ? 'Tampilan Lite' : 'Lite Mode')
                        : (lang === 'id' ? 'Tampilan Pro aktif dengan penyesuaian visual penuh.' : 'Pro mode active with full personalization.')
                      }
                    </p>
                  </div>
                </div>

                {streak > 0 && !isLiteMode && (
                  <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center gap-2 shrink-0 self-center sm:self-auto animate-pulse">
                    <span className="text-base">🔥</span>
                    <span className="text-xs font-black text-amber-400">{streak} {lang === 'id' ? 'Hari Beruntun' : 'Day Streak'}</span>
                  </div>
                )}
                {streak > 0 && isLiteMode && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-bold text-amber-500">{streak}</span>
                  </div>
                )}
              </div>

              {/* Mode Selector Option (Pro vs Lite switch) */}
              <div className={isLiteMode ? "p-4 bg-slate-900/20 border border-slate-800/50 rounded-3xl flex items-center justify-between gap-4" : "p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"}>
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={isLiteMode ? "w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0" : "w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0"}>
                    <Smartphone size={isLiteMode ? 20 : 18} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={isLiteMode ? "font-bold text-[15px] text-slate-200" : "font-bold text-[14px] text-slate-200"}>{lang === 'id' ? 'Tipe Tampilan' : 'Display Mode'}</span>
                    {!isLiteMode && <span className="text-xs text-slate-400 leading-normal mt-0.5">{lang === 'id' ? 'Sembunyikan fitur tambahan (Games, Wallpaper) agar lebih fokus.' : 'Hide extra features (Games, Wallpaper) for a cleaner layout.'}</span>}
                  </div>
                </div>

                <div className={isLiteMode ? "flex bg-slate-950/40 p-1 border border-slate-800/60 rounded-xl shrink-0" : "flex bg-slate-950/60 p-1 border border-slate-850 rounded-xl shrink-0 w-full sm:w-auto"}>
                  <button
                    onClick={() => {
                      setIsLiteMode(true);
                      showNotificationToast(lang === 'id' ? 'Mode Lite aktif! Tampilan sangat bersih.' : 'Lite Mode active! Clean interface.');
                    }}
                    className={\`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center \${
                      isLiteMode ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }\`}
                  >
                    Lite ⚡
                  </button>
                  <button
                    onClick={() => {
                      setIsLiteMode(false);
                      showNotificationToast(lang === 'id' ? 'Mode Pro aktif! Semua fitur kustomisasi terbuka.' : 'Pro Mode active! All customizations enabled.');
                    }}
                    className={\`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center \${
                      !isLiteMode ? 'bg-indigo-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }\`}
                  >
                    Pro 👑
                  </button>
                </div>
              </div>

              {/* Categorized Menu List */}`;

code = code.replace(target1, replacement1);
fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
