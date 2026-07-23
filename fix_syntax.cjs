const fs = require('fs');
let code = fs.readFileSync('src/screens/AICompanionScreen.tsx', 'utf8');

// Find the first {messages.map and remove the duplicated end part
// We can just use string replace.
const duplicateEnd = `                      </span>
                    </div>
                  </div>
                </div>
              );
            })}`;

code = code.replace(duplicateEnd, '');

fs.writeFileSync('src/screens/AICompanionScreen.tsx', code);
