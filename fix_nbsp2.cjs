const fs = require('fs');

function fixNbsp(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    code = code.split("note.content.replace(/<br\\s*\\/?>/gi, ' ').replace(/<[^>]*>?/gm, '').replace(/\\s+/g, ' ').trim()").join("note.content.replace(/<br\\s*\\/?>/gi, ' ').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\\s+/g, ' ').trim()");
    fs.writeFileSync(filePath, code);
}

fixNbsp('src/screens/HomeScreen.tsx');
fixNbsp('src/screens/SearchScreen.tsx');
