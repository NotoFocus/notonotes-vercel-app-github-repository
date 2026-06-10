import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function walk(dir) {
  let results = [];
  const list = readdirSync(dir);
  list.forEach(function(file) {
    file = join(dir, file);
    const stat = statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  let oldLength = content.length;
  content = content.replace(/bg-slate-950\/95  /g, 'bg-slate-950/95 ');
  content = content.replace(/bg-slate-900  /g, 'bg-slate-900 ');
  content = content.replace(/bg-slate-950\/80  /g, 'bg-slate-950/80 ');
  if (content.length !== oldLength) {
    writeFileSync(file, content);
  }
}
console.log('Done cleaning spaces');
