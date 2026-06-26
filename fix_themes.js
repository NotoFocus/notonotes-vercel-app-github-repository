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

      content = content.replace(/border-white\/5/g, 'border-slate-800');
      content = content.replace(/placeholder-slate-700/g, 'placeholder-slate-500');
      content = content.replace(/bg-white\/20 border-white\/30/g, 'bg-slate-800/30 border-slate-600');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done');
