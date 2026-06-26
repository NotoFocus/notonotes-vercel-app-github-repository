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

      content = content.replace(/bg-slate-900\/50/g, 'bg-slate-900/80');
      content = content.replace(/bg-slate-950\/50/g, 'bg-slate-950/80');
      content = content.replace(/bg-slate-950\/60/g, 'bg-slate-950/80');
      content = content.replace(/bg-slate-800\/50/g, 'bg-slate-800/80');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed opacity', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done');
