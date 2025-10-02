const fs = require('fs');
const path = require('path');

// Find all TypeScript files in controllers directory
const controllersDir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(controllersDir).filter(file => file.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix duplicate Promise<void> return types
  content = content.replace(/: Promise<void>: Promise<void>/g, ': Promise<void>');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed duplicate return types in ${file}`);
});

console.log('All duplicate return types fixed!');