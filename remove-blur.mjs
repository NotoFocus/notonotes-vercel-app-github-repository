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
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  content = content.replace(/backdrop-blur(-\w+)?/g, '');
  content = content.replace(/bg-slate-900\/50/g, 'bg-slate-900');
  content = content.replace(/bg-slate-950\/80/g, 'bg-slate-950/95');
  writeFileSync(file, content);
}
console.log('Removed all backdrop-blur and updated opacity for better performance');
