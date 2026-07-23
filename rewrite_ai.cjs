const fs = require('fs');
let code = fs.readFileSync('src/screens/AICompanionScreen.tsx', 'utf8');

// 1. Remove the left sidebar (md:flex w-[320px]...)
const leftSidebarRegex = /\{\/\* Left Side: Info & Guidelines Panel \(Hidden on small mobile\) \*\/\}.*?\{\/\* Right Side: Conversation Panel \*\/\}/s;
code = code.replace(leftSidebarRegex, '{/* Conversation Panel */}');

// 2. Adjust the main container to center everything
code = code.replace(
  /<div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">/,
  '<div className="flex-1 overflow-hidden flex flex-col relative">'
);

// 3. Right side flex wrapper should be centered basically, but let's keep the wrapper and add max-w inside it.
code = code.replace(
  /\{\/\* Active Note Context Banner \*\/\}/,
  '<div className="w-full max-w-4xl mx-auto flex flex-col h-full">\n          {/* Active Note Context Banner */}'
);

// We need to close this max-w-4xl wrapper after the form.
code = code.replace(
  /<\/form>\n        <\/div>\n      <\/div>\n      \{\/\* CONSENT DIALOG MODAL \*\/\}/,
  '</form>\n          </div>\n        </div>\n      </div>\n      {/* CONSENT DIALOG MODAL */}'
);

fs.writeFileSync('src/screens/AICompanionScreen.tsx', code);
