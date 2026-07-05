const fs = require('fs');

function fixNbsp(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    code = code.split("replace(/&nbsp;/g, ' ').replace(/&bnsp;/g, ' ')").join("replace(/&nbsp;?/gi, ' ').replace(/&bnsp;?/gi, ' ')");
    fs.writeFileSync(filePath, code);
}

fixNbsp('src/screens/HomeScreen.tsx');
fixNbsp('src/screens/SearchScreen.tsx');
