const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/index.ts',
  'src/routes/materials.ts',
  'src/middleware/monitoring.ts',
  'src/controllers/userController.ts',
  'src/controllers/freeMaterialController.ts',
  'src/routes/userRoutes.ts',
  'src/routes/auth.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix path import
    content = content.replace(/import path from 'path';/g, "import * as path from 'path';");
    
    // Fix fs import
    content = content.replace(/import fs from 'fs';/g, "import * as fs from 'fs';");
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed imports in ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('All import statements fixed!');