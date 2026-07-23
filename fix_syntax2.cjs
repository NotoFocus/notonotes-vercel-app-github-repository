const fs = require('fs');
let code = fs.readFileSync('src/screens/AICompanionScreen.tsx', 'utf8');

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\)\}\s*<\/span>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\)\}/;

code = code.replace(regex, `                      </div>
                    </div>
                  </div>
                </div>
              );
            })}`);

fs.writeFileSync('src/screens/AICompanionScreen.tsx', code);
