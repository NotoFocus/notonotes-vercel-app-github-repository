const fs = require('fs');

function fixNbsp(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    code = code.split("replace(/&nbsp;/g, ' ')").join("replace(/&nbsp;/g, ' ').replace(/&bnsp;/g, ' ')");
    fs.writeFileSync(filePath, code);
}

fixNbsp('src/screens/HomeScreen.tsx');
fixNbsp('src/screens/SearchScreen.tsx');
