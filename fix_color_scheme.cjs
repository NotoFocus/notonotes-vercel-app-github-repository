const fs = require('fs');
const path = require('path');

const tasksScreenPath = path.join(__dirname, 'src/screens/TasksScreen.tsx');
let content = fs.readFileSync(tasksScreenPath, 'utf8');
content = content.replace(/style=\{\{ colorScheme: 'dark' \}\}/g, '');
fs.writeFileSync(tasksScreenPath, content);
console.log('Removed inline colorScheme from TasksScreen');

const cssPath = path.join(__dirname, 'src/index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

if (!cssContent.includes('color-scheme: light;')) {
  cssContent = cssContent.replace(/\.light-theme \{/, '.light-theme {\n  color-scheme: light;');
  cssContent = cssContent.replace(/\.pink-theme \{/, '.pink-theme {\n  color-scheme: light;');
  cssContent = cssContent.replace(/html, body \{/, 'html, body {\n    color-scheme: dark;');
  fs.writeFileSync(cssPath, cssContent);
  console.log('Added color-scheme to index.css');
}
