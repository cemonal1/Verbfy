const fs = require('fs');
const path = require('path');

// Find all TypeScript files in controllers directory
const controllersDir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(controllersDir).filter(file => file.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix all remaining return res.status(...).json(...) patterns
  content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^;]+)\);/g, 'res.status($1).json($2);\n      return;');
  
  // Fix all remaining return res.status(...).send(...) patterns
  content = content.replace(/return res\.status\(([^)]+)\)\.send\(([^;]+)\);/g, 'res.status($1).send($2);\n      return;');
  
  // Fix all remaining return res.json(...) patterns
  content = content.replace(/return res\.json\(([^;]+)\);/g, 'res.json($1);\n      return;');
  
  // Fix all remaining return res.send(...) patterns
  content = content.replace(/return res\.send\(([^;]+)\);/g, 'res.send($1);\n      return;');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed remaining returns in ${file}`);
});

console.log('All remaining return statements fixed!');