const fs = require('fs');
let code = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');

// Update Avatar sizing
code = code.replace(/className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white\/30 shadow-md shrink-0  bg-slate-800\/50 animate-pulse"/g, 'className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-white/30 shadow-md shrink-0 bg-slate-800/50 animate-pulse"');
code = code.replace(/className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white\/30 shadow-md shrink-0 "/g, 'className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-white/30 shadow-md shrink-0"');

// Update gap
code = code.replace(/<div className="flex gap-3 sm:gap-4 items-center flex-1 min-w-0">/g, '<div className="flex gap-2 sm:gap-4 items-center flex-1 min-w-0">');

// Update typography
code = code.replace(/<p className="text-indigo-100 text-\[11px\] font-bold tracking-widest uppercase mb-1 drop-shadow-sm truncate">\{getGreeting\(\)\}<\/p>/g, '<p className="text-indigo-100 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase mb-0.5 sm:mb-1 drop-shadow-sm truncate">{getGreeting()}</p>');

code = code.replace(/<h2 className="text-2xl sm:text-4xl font-black mb-1 tracking-tight text-white drop-shadow-sm truncate">\{t\('focusToday'\)\}<\/h2>/g, '<h2 className="text-xl sm:text-3xl font-black mb-0.5 sm:mb-1 tracking-tight text-white drop-shadow-sm truncate">{t(\'focusToday\')}</h2>');

code = code.replace(/<p className="text-indigo-50 text-sm font-medium mt-2 flex items-center gap-2">/g, '<p className="text-indigo-50 text-xs sm:text-sm font-medium mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-2">');

fs.writeFileSync('src/screens/HomeScreen.tsx', code);
