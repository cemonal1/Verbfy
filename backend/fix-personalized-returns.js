const fs = require('fs');
const path = require('path');

const personalizedPath = path.join(__dirname, 'src/controllers/personalizedCurriculumController.ts');
let content = fs.readFileSync(personalizedPath, 'utf8');

// Fix return statements - replace "return res.status(...).json(...);" with "res.status(...).json(...); return;"
content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^;]+)\);/g, 'res.status($1).json($2);\n        return;');

// Also handle cases without semicolon at the end
content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^}]+}\s*)\)/g, 'res.status($1).json($2)\n        return;');

fs.writeFileSync(personalizedPath, content);

console.log('Fixed all return statements in personalizedCurriculumController.ts!');