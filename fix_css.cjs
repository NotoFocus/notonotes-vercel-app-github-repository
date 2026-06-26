const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src/index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const lightThemeAdditions = `
  --color-emerald-400: #059669;
  --color-rose-400: #e11d48;
  --color-indigo-400: #4f46e5;
  --color-orange-400: #ea580c;
  --color-amber-400: #d97706;
  --color-cyan-400: #0891b2;
  
  --color-emerald-500: #047857;
  --color-rose-500: #be123c;
  --color-indigo-500: #4338ca;
  --color-orange-500: #c2410c;
`;

const pinkThemeAdditions = `
  --color-emerald-400: #059669;
  --color-rose-400: #e11d48;
  --color-orange-400: #ea580c;
  --color-amber-400: #d97706;
  --color-cyan-400: #0891b2;
  
  --color-emerald-500: #047857;
  --color-rose-500: #be123c;
  --color-orange-500: #c2410c;
`;

if (!cssContent.includes('--color-emerald-400: #059669')) {
  cssContent = cssContent.replace(/\.light-theme \{/, '.light-theme {' + lightThemeAdditions);
  cssContent = cssContent.replace(/\.pink-theme \{/, '.pink-theme {' + pinkThemeAdditions);
  
  // Fix pink-theme indigo-400 to be darker
  cssContent = cssContent.replace(/--color-indigo-400: #f472b6;/g, '--color-indigo-400: #be185d;'); // pink-700
  
  fs.writeFileSync(cssPath, cssContent);
  console.log('Fixed index.css');
}
