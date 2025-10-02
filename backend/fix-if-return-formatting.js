const fs = require('fs');
const path = require('path');

// Find all TypeScript files in controllers directory
const controllersDir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(controllersDir).filter(file => file.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix if statements that don't have proper braces and return statements
  // Pattern: if (condition) res.status(...).json(...);
  //          return;
  // Should be: if (condition) {
  //              res.status(...).json(...);
  //              return;
  //            }
  
  content = content.replace(/if\s*\([^)]+\)\s*res\.(status\([^)]+\)\.json\([^;]+\)|json\([^;]+\));\s*return;/g, (match) => {
    const lines = match.split('\n');
    const ifLine = lines[0].trim();
    const resLine = lines[1] ? lines[1].trim() : '';
    
    // Extract the condition and response
    const conditionMatch = ifLine.match(/if\s*\(([^)]+)\)\s*(.*)/);
    if (conditionMatch) {
      const condition = conditionMatch[1];
      const response = conditionMatch[2] || resLine;
      
      return `if (${condition}) {
        ${response}
        return;
      }`;
    }
    return match;
  });
  
  // Fix standalone if statements without braces
  content = content.replace(/if\s*\([^)]+\)\s*res\.(status\([^)]+\)\.json\([^;]+\)|json\([^;]+\));(?!\s*return)/g, (match) => {
    const conditionMatch = match.match(/if\s*\(([^)]+)\)\s*(.*)/);
    if (conditionMatch) {
      const condition = conditionMatch[1];
      const response = conditionMatch[2];
      
      return `if (${condition}) {
        ${response}
        return;
      }`;
    }
    return match;
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed if-return formatting in ${file}`);
});

console.log('All if-return formatting fixed!');