const fs = require('fs');
let code = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');

code = code.replace(/className="flex-none flex flex-col items-center justify-center bg-white\/10 hover:bg-white\/20 backdrop-blur-sm border border-white\/20 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 cursor-pointer transition-all hover:scale-105 shadow-sm"/g, 'className="flex-none flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl px-3 py-2 sm:px-5 sm:py-4 cursor-pointer transition-all hover:scale-105 shadow-sm"');

code = code.replace(/<Flame className="w-6 h-6 text-orange-400 fill-orange-400 drop-shadow-sm mb-1" \/>/g, '<Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 fill-orange-400 drop-shadow-sm mb-1" />');

code = code.replace(/<span className="text-xl font-black text-white leading-none mb-1">\{streak\}<\/span>/g, '<span className="text-lg sm:text-xl font-black text-white leading-none mb-0.5 sm:mb-1">{streak}</span>');

code = code.replace(/<span className="text-\[10px\] font-bold uppercase tracking-widest text-indigo-100 opacity-90">Streak<\/span>/g, '<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-100 opacity-90">Streak</span>');

fs.writeFileSync('src/screens/HomeScreen.tsx', code);
