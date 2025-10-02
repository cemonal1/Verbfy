const fs = require('fs');
const path = require('path');

// Get all controller files
const controllersDir = path.join(__dirname, 'src/controllers');
const controllerFiles = fs.readdirSync(controllersDir).filter(file => file.endsWith('.ts'));

console.log('Found controller files:', controllerFiles);

controllerFiles.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix return statements - replace "return res.status(...).json(...);" with "res.status(...).json(...); return;"
  content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^;]+)\);/g, 'res.status($1).json($2);\n      return;');
  
  // Also handle cases without semicolon at the end
  content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^}]+}\s*)\)/g, 'res.status($1).json($2)\n      return;');
  
  // Add return types to exported functions with Request
  content = content.replace(/export const (\w+) = async \(req: Request, res: Response\)/g, 
    'export const $1 = async (req: Request, res: Response): Promise<void>');
  
  // Add return types to exported functions with AuthRequest
  content = content.replace(/export const (\w+) = async \(req: AuthRequest, res: Response\)/g, 
    'export const $1 = async (req: AuthRequest, res: Response): Promise<void>');
  
  // Add return types to static methods
  content = content.replace(/static async (\w+)\(req: AuthRequest, res: Response\)/g, 
    'static async $1(req: AuthRequest, res: Response): Promise<void>');
  
  // Add return types to static methods with Request
  content = content.replace(/static async (\w+)\(req: Request, res: Response\)/g, 
    'static async $1(req: Request, res: Response): Promise<void>');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});

console.log('All controllers have been fixed!');