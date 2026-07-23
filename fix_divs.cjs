const fs = require('fs');
let code = fs.readFileSync('src/screens/AICompanionScreen.tsx', 'utf8');

const target = /<\/form>\s*<\/div>\s*<\/div>\s*\{\/\* CONSENT DIALOG MODAL \*\/\}/;

code = code.replace(target, `          </form>
        </div>
      </div>
    </div>
    {/* CONSENT DIALOG MODAL */}`);

fs.writeFileSync('src/screens/AICompanionScreen.tsx', code);
