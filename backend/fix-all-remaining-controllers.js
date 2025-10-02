const fs = require('fs');
const path = require('path');

// List of controllers and their methods that need fixing
const controllersToFix = [
  {
    file: 'notificationsController.ts',
    functions: ['markAsRead', 'deleteNotification']
  },
  {
    file: 'organizationController.ts',
    methods: ['createOrganization', 'getOrganization', 'updateOrganization', 'getOrganizationStats', 'manageAdmins', 'getOrganizationUsers', 'bulkOperations']
  }
];

controllersToFix.forEach(controller => {
  const filePath = path.join(__dirname, 'src/controllers', controller.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${controller.file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix return statements - replace "return res.status(...).json(...);" with "res.status(...).json(...); return;"
  content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^;]+)\);/g, 'res.status($1).json($2);\n      return;');
  
  // Also handle cases without semicolon at the end
  content = content.replace(/return res\.status\(([^)]+)\)\.json\(([^}]+}\s*)\)/g, 'res.status($1).json($2)\n      return;');
  
  // Add return types to exported functions
  if (controller.functions) {
    controller.functions.forEach(func => {
      const regex = new RegExp(`export const ${func} = async \\(req: Request, res: Response\\)`, 'g');
      content = content.replace(regex, `export const ${func} = async (req: Request, res: Response): Promise<void>`);
    });
  }
  
  // Add return types to static methods
  if (controller.methods) {
    controller.methods.forEach(method => {
      const regex = new RegExp(`static async ${method}\\(req: AuthRequest, res: Response\\)`, 'g');
      content = content.replace(regex, `static async ${method}(req: AuthRequest, res: Response): Promise<void>`);
    });
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${controller.file}`);
});

console.log('All remaining controllers have been fixed!');