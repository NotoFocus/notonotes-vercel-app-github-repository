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

      content = content.replace(/bg-indigo-900\/20/g, 'bg-indigo-500/10');
      content = content.replace(/bg-indigo-900\/10/g, 'bg-indigo-500/5');
      content = content.replace(/from-indigo-900\/40/g, 'from-indigo-500/10');
      content = content.replace(/bg-indigo-900\/30/g, 'bg-indigo-500/15');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done');
