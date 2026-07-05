const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// We can add a custom background pattern to .cool-theme and .cute-theme body/html
// But since we apply the theme class to a div, we can just define CSS classes or inject it into the theme definition.

const oldCool = `.cool-theme {`;
const newCool = `.cool-theme {
  background-color: #04060b;
  background-image: radial-gradient(circle at 15% 50%, rgba(6, 182, 212, 0.08), transparent 25%),
                    radial-gradient(circle at 85% 30%, rgba(255, 107, 0, 0.08), transparent 25%);
`;

const oldCute = `.cute-theme {`;
const newCute = `.cute-theme {
  background-color: #fdf8eb;
  background-image: radial-gradient(circle at 20% 20%, rgba(244, 114, 182, 0.15), transparent 40%),
                    radial-gradient(circle at 80% 80%, rgba(251, 146, 60, 0.15), transparent 40%);
`;

code = code.replace(oldCool, newCool);
code = code.replace(oldCute, newCute);

fs.writeFileSync('src/index.css', code);
