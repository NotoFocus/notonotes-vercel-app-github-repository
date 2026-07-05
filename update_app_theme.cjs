const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldGetBg = `  const getBackgroundImageUrl = () => {
    if (appTheme === 'cool') {
      return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop";
    }
    if (appTheme === 'cute') {
      return "https://images.unsplash.com/photo-1559251606-c623743a6d76?q=80&w=1200&auto=format&fit=crop";
    }
    if (appTheme === 'wallpaper' && customWallpaper) {
      return customWallpaper;
    }
    return undefined;
  };`;

const newGetBg = `  const getBackgroundImageUrl = () => {
    if (appTheme === 'wallpaper' && customWallpaper) {
      return customWallpaper;
    }
    return undefined;
  };`;

code = code.replace(oldGetBg, newGetBg);

const oldOverlays = `        {(appTheme === 'cool' || appTheme === 'cute' || appTheme === 'wallpaper') && (
          <div className="absolute inset-0 bg-slate-950/40 z-0 pointer-events-none" />
        )}`;
const newOverlays = `        {appTheme === 'wallpaper' && (
          <div className="absolute inset-0 bg-slate-950/40 z-0 pointer-events-none" />
        )}`;

// It appears multiple times, let's replace all
code = code.replace(new RegExp(oldOverlays.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), newOverlays);

fs.writeFileSync('src/App.tsx', code);
