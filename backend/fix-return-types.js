const fs = require('fs');
const path = require('path');

// Fix personalizedCurriculumController.ts
const personalizedCurriculumPath = path.join(__dirname, 'src/controllers/personalizedCurriculumController.ts');
let personalizedContent = fs.readFileSync(personalizedCurriculumPath, 'utf8');

// Add return types to methods
const methodsToFix = [
  'getCurriculum',
  'createCurriculum', 
  'updateProgress',
  'getRecommendations',
  'updateStudySchedule',
  'getAnalytics',
  'completeRecommendation'
];

methodsToFix.forEach(method => {
  const regex = new RegExp(`static async ${method}\\(req: AuthRequest, res: Response\\)`, 'g');
  personalizedContent = personalizedContent.replace(regex, `static async ${method}(req: AuthRequest, res: Response): Promise<void>`);
});

fs.writeFileSync(personalizedCurriculumPath, personalizedContent);

// Fix reservationController.ts
const reservationPath = path.join(__dirname, 'src/controllers/reservationController.ts');
let reservationContent = fs.readFileSync(reservationPath, 'utf8');

// Add return types to exported functions
const exportedFunctions = [
  'bookReservation',
  'getReservations',
  'cancelReservation',
  'updateReservation',
  'getReservationDetails'
];

exportedFunctions.forEach(func => {
  const regex = new RegExp(`export const ${func} = async \\(req: AuthRequest, res: Response\\)`, 'g');
  reservationContent = reservationContent.replace(regex, `export const ${func} = async (req: AuthRequest, res: Response): Promise<void>`);
});

fs.writeFileSync(reservationPath, reservationContent);

console.log('Return types added successfully to both controllers!');