const fs = require('fs');
let code = fs.readFileSync('src/screens/AICompanionScreen.tsx', 'utf8');

// 1. Initial state
code = code.replace(/useState\(10\);/g, 'useState(15);');

// 2. localStorage init
code = code.replace(/setItem\('noto_ai_credits_left', '10'\);/g, "setItem('noto_ai_credits_left', '15');");
code = code.replace(/setCreditsLeft\(10\);/g, 'setCreditsLeft(15);');

// 3. Error message check
code = code.replace(
  /if \(creditsLeft <= 0\) \{/g,
  'if (creditsLeft <= 0 && !geminiApiKey) {'
);

code = code.replace(
  /\(Maks 10 per hari\)/g,
  '(Maks 15 per hari)'
);

code = code.replace(
  /\(Max 10 per day\)/g,
  '(Max 15 per day)'
);

// 4. Update credits only if no API key
code = code.replace(
  /updateCredits\(Math.max\(0, creditsLeft - 1\)\);/g,
  'if (!geminiApiKey) updateCredits(Math.max(0, creditsLeft - 1));'
);

// 5. Info display
code = code.replace(
  /10 AI Credits/g,
  '15 AI Credits'
);

// 6. Badge display
const targetBadge = `{creditsLeft} {lang === 'id' ? 'Kredit' : 'Credits'}`;
const replacementBadge = `{geminiApiKey ? (lang === 'id' ? 'Kredit Tak Terbatas (BYOK)' : 'Unlimited (BYOK)') : \`\${creditsLeft} \${lang === 'id' ? 'Kredit' : 'Credits'}\`}`;
code = code.replace(targetBadge, replacementBadge);

fs.writeFileSync('src/screens/AICompanionScreen.tsx', code);
