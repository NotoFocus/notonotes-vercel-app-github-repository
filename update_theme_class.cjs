const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldThemeClass1 = `  const getThemeClass = () => {
    if (appTheme === 'light') return 'light-theme bg-slate-950';
    if (appTheme === 'pink') return 'pink-theme bg-slate-950';
    if (appTheme === 'cool') return 'cool-theme bg-transparent';
    if (appTheme === 'cute') return 'cute-theme bg-transparent';
    if (appTheme === 'wallpaper') return 'wallpaper-theme bg-transparent';
    return 'bg-slate-950';
  };`;

const newThemeClass1 = `  const getThemeClass = () => {
    if (appTheme === 'light') return 'light-theme bg-slate-950';
    if (appTheme === 'pink') return 'pink-theme bg-slate-950';
    if (appTheme === 'cool') return 'cool-theme bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950';
    if (appTheme === 'cute') return 'cute-theme bg-gradient-to-br from-rose-50 via-slate-950 to-orange-50';
    if (appTheme === 'wallpaper') return 'wallpaper-theme bg-transparent';
    return 'bg-slate-950';
  };`;

code = code.replace(oldThemeClass1, newThemeClass1);
code = code.replace(oldThemeClass1, newThemeClass1); // Replace the other one for PinScreen

fs.writeFileSync('src/App.tsx', code);
