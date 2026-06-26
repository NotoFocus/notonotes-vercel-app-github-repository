import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/screens/GamesHubScreen.tsx',
  'src/screens/GameScreen.tsx',
  'src/screens/TicTacToeScreen.tsx',
  'src/screens/PuzzleScreen.tsx',
  'src/screens/TetrisScreen.tsx'
];

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace combinations like 'bg-white dark:bg-slate-900' with 'bg-slate-900'
  content = content.replace(/bg-white\s+dark:bg-slate-([0-9]+)/g, 'bg-slate-$1');
  
  // Replace text-slate-xxx dark:text-slate-yyy with just text-slate-yyy
  content = content.replace(/text-slate-[0-9]+\s+dark:text-slate-([0-9]+)/g, 'text-slate-$1');
  
  // Replace border-slate-xxx dark:border-slate-yyy with just border-slate-yyy
  content = content.replace(/border-slate-[0-9]+\s+dark:border-slate-([0-9]+)/g, 'border-slate-$1');
  
  // Replace bg-slate-xxx dark:bg-slate-yyy with just bg-slate-yyy
  content = content.replace(/bg-slate-[0-9]+(\/[0-9]+)?\s+dark:bg-slate-([0-9]+)(\/[0-9]+)?/g, 'bg-slate-$2$3');
  
  // Replace specific colors
  content = content.replace(/text-([a-z]+)-[0-9]+\s+dark:text-\1-([0-9]+)/g, 'text-$1-$2');
  content = content.replace(/bg-([a-z]+)-[0-9]+(\/[0-9]+)?\s+dark:bg-\1-([0-9]+)(\/[0-9]+)?/g, 'bg-$1-$3$4');
  content = content.replace(/border-([a-z]+)-[0-9]+\s+dark:border-\1-([0-9]+)/g, 'border-$1-$2');
  content = content.replace(/hover:bg-slate-[0-9]+\s+dark:hover:bg-slate-([0-9]+)/g, 'hover:bg-slate-$1');
  
  // Clean up any remaining dark: classes manually if they are single
  content = content.replace(/dark:([a-z0-9:-]+)/g, '');
  
  // cleanup extra spaces left by the replacement inside class names
  content = content.replace(/className="\s+/g, 'className="');
  
  fs.writeFileSync(file, content);
});
