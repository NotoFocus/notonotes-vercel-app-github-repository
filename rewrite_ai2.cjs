const fs = require('fs');
let code = fs.readFileSync('src/screens/AICompanionScreen.tsx', 'utf8');

const target1 = /\{\/\* Quick-action pills for mobile layout \*\/\}\s*<div className="md:hidden grid grid-cols-3 gap-2 pb-4 border-b border-slate-800\/50">[\s\S]*?<\/button>\s*<\/div>/;

const replacement1 = `
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full px-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-6">
                  <Bot size={32} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-2">{lang === 'id' ? 'Ada yang bisa saya bantu?' : 'How can I help you today?'}</h2>
                <p className="text-sm text-slate-400 mb-8 text-center max-w-md">
                  {lang === 'id' 
                    ? 'Saya adalah asisten AI yang berjalan secara lokal untuk menjaga privasi Anda. Pilih salah satu tugas di bawah ini untuk memulai.' 
                    : 'I am a privacy-first AI assistant. Choose a task below to get started.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl">
                  <button
                    onClick={() => handleSend(lang === 'id' ? "Tolong beri saya analisis mood" : "Please give me a mood reflection", 'mood')}
                    className="flex flex-col items-start p-4 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <Smile size={20} className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-slate-200 text-sm mb-1">{lang === 'id' ? 'Analisis Mood' : 'Mood reflection'}</span>
                    <span className="text-xs text-slate-400">{lang === 'id' ? 'Tinjau suasana hati secara aman' : 'Securely analyze mood logs'}</span>
                  </button>
                  <button
                    onClick={() => handleSend(lang === 'id' ? "Bagaimana kondisi keuangan saya?" : "How is my financial performance?", 'finance')}
                    className="flex flex-col items-start p-4 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <Wallet size={20} className="text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-slate-200 text-sm mb-1">{lang === 'id' ? 'Keuangan Agregat' : 'Financial Summary'}</span>
                    <span className="text-xs text-slate-400">{lang === 'id' ? 'Ringkasan total pemasukan & pengeluaran' : 'Aggregated income & expenses'}</span>
                  </button>
                  <button
                    onClick={() => handleSend(lang === 'id' ? "Evaluasi disiplin saya" : "Evaluate my discipline", 'tasks')}
                    className="flex flex-col items-start p-4 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <CheckSquare size={20} className="text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-slate-200 text-sm mb-1">{lang === 'id' ? 'Kedisiplinan Kerja' : 'Discipline & Tasks'}</span>
                    <span className="text-xs text-slate-400">{lang === 'id' ? 'Analisis streak & penyelesaian tugas' : 'Analyze streak & completion rate'}</span>
                  </button>
                </div>
              </div>
            )}
`;

code = code.replace(target1, replacement1);

// Improve the chat bubble styling to look more like ChatGPT (no background for AI, just simple text, wider)
// The user bubble can be a rounded pill.
const chatBubbleRegex = /\{\/\* Chat Bubble \*\/\}.*?<div className="flex flex-col gap-1\.5 w-full overflow-hidden">/s;

// We will do a manual replace for the bubble styling part
fs.writeFileSync('src/screens/AICompanionScreen.tsx', code);
