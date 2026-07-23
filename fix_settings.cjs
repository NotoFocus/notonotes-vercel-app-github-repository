const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

const target1 = /\{\/\* Categorized Menu List \*\/\}\s*<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">[\s\S]*?\{\/\* Minimal Brand Tag \*\/\}/;

const replacement1 = `{/* Categorized Menu List */}
              <div className={isLiteMode ? "flex flex-col gap-1 bg-slate-900/20 rounded-3xl p-2 border border-slate-800/50" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                {/* 1. Appearance Section Card */}
                <button 
                  onClick={() => setActiveSection('appearance')}
                  className={isLiteMode 
                    ? "p-4 text-left hover:bg-slate-800/40 rounded-2xl transition-all group cursor-pointer flex items-center gap-4"
                    : "p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                  }
                >
                  <div className={isLiteMode ? "w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0" : "w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform"}>
                    <Palette size={isLiteMode ? 20 : 18} />
                  </div>
                  <div className={isLiteMode ? "flex-1" : "mt-4"}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-indigo-400 transition-colors">{lang === 'id' ? 'Tampilan & Profil' : 'Appearance & Profile'}</span>
                      {!isLiteMode && <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Kelola nama, avatar, bahasa, tema.' : 'Manage name, avatar, app language, theme.'}</p>
                  </div>
                  {isLiteMode && <ChevronRight size={18} className="text-slate-500 group-hover:translate-x-1 transition-all shrink-0" />}
                </button>

                {/* 2. Security Section Card */}
                <button 
                  onClick={() => setActiveSection('security')}
                  className={isLiteMode 
                    ? "p-4 text-left hover:bg-slate-800/40 rounded-2xl transition-all group cursor-pointer flex items-center gap-4"
                    : "p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                  }
                >
                  <div className={isLiteMode ? "w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0" : "w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform"}>
                    <Lock size={isLiteMode ? 20 : 18} />
                  </div>
                  <div className={isLiteMode ? "flex-1" : "mt-4"}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-emerald-400 transition-colors">{lang === 'id' ? 'Keamanan PIN' : 'Security PIN'}</span>
                      {!isLiteMode && <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Kunci aplikasi dengan PIN 4-digit.' : 'Lock app using a 4-digit PIN.'}</p>
                  </div>
                  {isLiteMode && <ChevronRight size={18} className="text-slate-500 group-hover:translate-x-1 transition-all shrink-0" />}
                </button>

                {/* 3. Backup Section Card */}
                <button 
                  onClick={() => setActiveSection('backup')}
                  className={isLiteMode 
                    ? "p-4 text-left hover:bg-slate-800/40 rounded-2xl transition-all group cursor-pointer flex items-center gap-4"
                    : "p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                  }
                >
                  <div className={isLiteMode ? "w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0" : "w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform"}>
                    <Database size={isLiteMode ? 20 : 18} />
                  </div>
                  <div className={isLiteMode ? "flex-1" : "mt-4"}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-blue-400 transition-colors">{lang === 'id' ? 'Cadangan & Database' : 'Backup & Database'}</span>
                      {!isLiteMode && <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Ekspor, impor cadangan, dan reset data.' : 'Export, import backups, reset data.'}</p>
                  </div>
                  {isLiteMode && <ChevronRight size={18} className="text-slate-500 group-hover:translate-x-1 transition-all shrink-0" />}
                </button>

                {/* 5. AI Assistant Section Card */}
                <button 
                  onClick={() => setActiveSection('ai')}
                  className={isLiteMode 
                    ? "p-4 text-left hover:bg-slate-800/40 rounded-2xl transition-all group cursor-pointer flex items-center gap-4"
                    : "p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                  }
                >
                  <div className={isLiteMode ? "w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0" : "w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center group-hover:scale-105 transition-transform"}>
                    <Bot size={isLiteMode ? 20 : 18} />
                  </div>
                  <div className={isLiteMode ? "flex-1" : "mt-4"}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-orange-400 transition-colors">{lang === 'id' ? 'Pengaturan Noto AI' : 'Noto AI Settings'}</span>
                      {!isLiteMode && <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Konfigurasi provider & API Key mandiri.' : 'Configure provider & API Key.'}</p>
                  </div>
                  {isLiteMode && <ChevronRight size={18} className="text-slate-500 group-hover:translate-x-1 transition-all shrink-0" />}
                </button>

                {/* 6. Mini Games Section Card (Pro Mode only) */}
                {!isLiteMode && (
                  <button 
                    onClick={() => onNavigate && onNavigate('games-hub')}
                    className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Gamepad2 size={18} />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-rose-400 transition-colors">
                          {lang === 'id' ? 'Mini Games' : 'Mini Games'}
                        </span>
                        <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-normal">
                        {lang === 'id' ? 'Istirahat sejenak dengan pilihan game kasual.' : 'Take a short break with casual games.'}
                      </p>
                    </div>
                  </button>
                )}
                
                {/* 4. About Section Card */}
                <button 
                  onClick={() => setActiveSection('about')}
                  className={isLiteMode 
                    ? "p-4 text-left hover:bg-slate-800/40 rounded-2xl transition-all group cursor-pointer flex items-center gap-4"
                    : "p-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-left hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col justify-between min-h-[140px]"
                  }
                >
                  <div className={isLiteMode ? "w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0" : "w-10 h-10 rounded-2xl bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center justify-center group-hover:scale-105 transition-transform"}>
                    <Info size={isLiteMode ? 20 : 18} />
                  </div>
                  <div className={isLiteMode ? "flex-1" : "mt-4"}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[15px] text-slate-100 group-hover:text-slate-300 transition-colors">{lang === 'id' ? 'Tentang Noto' : 'About Noto'}</span>
                      {!isLiteMode && <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-all" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">{lang === 'id' ? 'Informasi legalitas dan uji sistem.' : 'Legal info and system diagnostic care.'}</p>
                  </div>
                  {isLiteMode && <ChevronRight size={18} className="text-slate-500 group-hover:translate-x-1 transition-all shrink-0" />}
                </button>
              </div>

              {/* Minimal Brand Tag */}`;

code = code.replace(target1, replacement1);
fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
