const fs = require('fs');
const path = require('path');

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG icon template
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.125)}" fill="#3b82f6"/>
  <g transform="translate(${size * 0.25}, ${size * 0.25}) scale(${size / 192})">
    <path d="M24 72L48 24L72 72H60L48 48L36 72H24Z" fill="white"/>
    <circle cx="48" cy="48" r="4" fill="white"/>
    <text x="48" y="84" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">Verbfy</text>
  </g>
</svg>`;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons for each size
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

// Create shortcut icons
const shortcuts = [
  { name: 'teacher-shortcut.svg', icon: 'teacher' },
  { name: 'lesson-shortcut.svg', icon: 'lesson' },
  { name: 'practice-shortcut.svg', icon: 'practice' }
];

shortcuts.forEach(({ name, icon }) => {
  let iconPath = '';
  let iconColor = '#3b82f6';
  
  switch (icon) {
    case 'teacher':
      iconPath = 'M48 20C42 20 37 25 37 31C37 37 42 42 48 42C54 42 59 37 59 31C59 25 54 20 48 20ZM48 48C38 48 20 53 20 63V72H76V63C76 53 58 48 48 48Z';
      iconColor = '#10b981';
      break;
    case 'lesson':
      iconPath = 'M76 20H20C16 20 12 24 12 28V68C12 72 16 76 20 76H76C80 76 84 72 84 68V28C84 24 80 20 76 20ZM72 64H24V32H72V64Z';
      iconColor = '#f59e0b';
      break;
    case 'practice':
      iconPath = 'M48 12C28 12 12 28 12 48C12 68 28 84 48 84C68 84 84 68 84 48C84 28 68 12 48 12ZM48 76C32 76 20 64 20 48C20 32 32 20 48 20C64 20 76 32 76 48C76 64 64 76 48 76Z';
      iconColor = '#8b5cf6';
      break;
  }
  
  const svgContent = `<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="12" fill="${iconColor}"/>
  <path d="${iconPath}" fill="white"/>
</svg>`;
  
  const filepath = path.join(iconsDir, name);
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${name}`);
});

console.log('All PWA icons generated successfully!');