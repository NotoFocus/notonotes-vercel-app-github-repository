import fs from 'fs';

const filesToFix = [
  'src/screens/PuzzleScreen.tsx',
  'src/screens/TicTacToeScreen.tsx',
  'src/screens/GameScreen.tsx'
];

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-slate-800  mb-2/g, 'text-slate-100 mb-2');
  fs.writeFileSync(file, content);
});
