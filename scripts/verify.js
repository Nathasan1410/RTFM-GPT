const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running verification checks...');

let errors = 0;

// 1. Check .env.local exists
if (!fs.existsSync(path.join(__dirname, '../.env.local'))) {
  console.warn('⚠️  .env.local not found. Skipping API key check.');
} else {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
  if (!envContent.includes('CEREBRAS_API_KEY=')) {
    console.error('❌ CEREBRAS_API_KEY missing in .env.local');
    errors++;
  } else {
    console.log('✅ .env.local check passed');
  }
}

// 2. Check TypeScript
try {
  console.log('Checking TypeScript...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed');
} catch (e) {
  console.error('❌ TypeScript check failed');
  errors++;
}

// 3. Check Manifest
if (!fs.existsSync(path.join(__dirname, '../public/manifest.json'))) {
  console.error('❌ public/manifest.json missing');
  errors++;
} else {
  console.log('✅ Manifest check passed');
}

if (errors > 0) {
  console.error(`\n❌ Verification failed with ${errors} errors.`);
  process.exit(1);
} else {
  console.log('\n✨ All verification checks passed!');
}
