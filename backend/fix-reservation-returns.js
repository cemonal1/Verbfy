const fs = require('fs');
const path = require('path');

const reservationPath = path.join(__dirname, 'src/controllers/reservationController.ts');
let content = fs.readFileSync(reservationPath, 'utf8');

// Fix return statements - replace "return res.status(...).json(...);" with "res.status(...).json(...); return;"
content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^;]+)\);/g, 'res.status($1).json($2);\n      return;');

// Also handle cases without semicolon at the end
content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^}]+}\s*)\)/g, 'res.status($1).json($2)\n      return;');

// Add return types to functions that don't have them yet
const functionsToFix = [
  'getTeacherBookings',
  'getReservationById'
];

functionsToFix.forEach(func => {
  const regex = new RegExp(`export const ${func} = async \\(req: AuthRequest, res: Response\\)`, 'g');
  content = content.replace(regex, `export const ${func} = async (req: AuthRequest, res: Response): Promise<void>`);
});

fs.writeFileSync(reservationPath, content);

console.log('Fixed all return statements in reservationController.ts!');