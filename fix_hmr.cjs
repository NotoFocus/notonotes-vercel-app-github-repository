const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const vite = await viteModule\.createServer\(\{/,
  `const vite = await viteModule.createServer({
        server: { 
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
        },`
);

// We need to clean up the existing 'server: { middlewareMode: true }'
code = code.replace(
  /server: \{ middlewareMode: true \},/,
  ''
);

fs.writeFileSync('server.ts', code);
