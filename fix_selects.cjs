const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

// For appTheme select
code = code.replace(
  /<select([\\s\\S]*?)<\/select>/,
  (match, p1) => {
    return `<div className="flex items-center gap-1">\n                <select${p1}</select>\n                <ChevronRight className="w-4 h-4 text-slate-600" />\n              </div>`;
  }
);

// For lang select
code = code.replace(
  /<select([\\s\\S]*?)<\/select>/g,
  (match, p1) => {
    if (match.includes('value={lang}')) {
      return `<div className="flex items-center gap-1">\n                <select${p1}</select>\n                <ChevronRight className="w-4 h-4 text-slate-600" />\n              </div>`;
    }
    return match; // Already replaced the first one hopefully
  }
);

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
