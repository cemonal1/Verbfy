const fs = require('fs');
const path = require('path');

// Read the roleController.ts file
const filePath = path.join(__dirname, 'src/controllers/roleController.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all return res.status(...) patterns with res.status(...) followed by return;
content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^}]+})\);/g, 'res.status($1).json($2);\n        return;');

// Add return types to methods that don't have them
const methodsToFix = [
  'getRole',
  'updateRole'
];

methodsToFix.forEach(method => {
  const regex = new RegExp(`static async ${method}\\(req: AuthRequest, res: Response\\) \\{`, 'g');
  content = content.replace(regex, `static async ${method}(req: AuthRequest, res: Response): Promise<void> {`);
});

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed all return statements in roleController.ts');