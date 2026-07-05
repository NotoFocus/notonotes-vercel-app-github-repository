const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// For cool-theme, add a cool gradient to slate-950
code = code.replace(
  '--color-slate-950: #04060b;   /* Deep Dark Void */',
  '--color-slate-950: #0a0a0a;   /* Base dark */'
);

// We can inject a background-image gradient into the root or classes if we want.
// Actually, it's easier to modify App.tsx getThemeClass to return Tailwind gradient classes.

fs.writeFileSync('src/index.css', code);
