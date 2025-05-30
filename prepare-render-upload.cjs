const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing VibeTribe Backend for Render Upload');
console.log('===============================================');

const backendDir = path.join(__dirname, 'backend');
const deployDir = path.join(__dirname, 'render-deploy');

// Create deployment directory
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true });
}
fs.mkdirSync(deployDir);

// Copy essential files
const filesToCopy = [
  'package.json',
  'package-lock.json',
  'render.yaml',
  'Procfile',
  '.renderignore'
];

const dirsToCopy = [
  'dist',
  'migrations'
];

console.log('📦 Copying essential files...');

// Copy files
filesToCopy.forEach(file => {
  const src = path.join(backendDir, file);
  const dest = path.join(deployDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`⚠️  ${file} not found, skipping`);
  }
});

// Copy directories
dirsToCopy.forEach(dir => {
  const src = path.join(backendDir, dir);
  const dest = path.join(deployDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`✅ Copied ${dir}/ directory`);
  } else {
    console.log(`⚠️  ${dir}/ not found, skipping`);
  }
});

// Copy Firebase service account file if it exists
const firebaseFile = 'socialmm-c0c2d-firebase-adminsdk-fbsvc-ea1eb647d1.json';
const firebaseSrc = path.join(backendDir, firebaseFile);
const firebaseDest = path.join(deployDir, firebaseFile);
if (fs.existsSync(firebaseSrc)) {
  fs.copyFileSync(firebaseSrc, firebaseDest);
  console.log(`✅ Copied ${firebaseFile}`);
}

console.log('');
console.log('🎯 Deployment package ready!');
console.log(`📁 Location: ${deployDir}`);
console.log('');
console.log('📋 Next Steps:');
console.log('1. Zip the render-deploy folder');
console.log('2. Go to Render.com');
console.log('3. Create new Web Service');
console.log('4. Choose "Upload from computer"');
console.log('5. Upload the zip file');
console.log('6. Configure environment variables');
console.log('');
console.log('📖 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions');
