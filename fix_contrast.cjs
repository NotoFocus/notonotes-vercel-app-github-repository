const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      // Improve contrast by using slate-400 instead of slate-500
      // In Tailwind v4 with this app's themes:
      // Dark theme: slate-400 is light grey (#94a3b8) - better contrast on dark bg
      // Light theme: slate-400 is dark grey (#475569) - better contrast on light bg
      content = content.replace(/text-slate-500/g, 'text-slate-400');
      content = content.replace(/placeholder-slate-500/g, 'placeholder-slate-400');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done');
