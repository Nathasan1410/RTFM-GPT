/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running Comprehensive Verification Checks...\n');

const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  checks: {},
  summary: { passed: 0, failed: 0, warnings: 0 },
  status: 'PASS'
};

function recordCheck(name, passed, message, severity = 'error') {
  report.checks[name] = { passed, message, severity };
  if (passed) {
    report.summary.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    if (severity === 'error') {
      report.summary.failed++;
      console.error(`❌ ${name}: ${message}`);
    } else {
      report.summary.warnings++;
      console.warn(`⚠️  ${name}: ${message}`);
    }
  }
}

try {
  console.log('📋 Step 1: ESLint Static Analysis');
  try {
    execSync('npx eslint . --ext .ts,.tsx --max-warnings=999', { stdio: 'pipe' });
    recordCheck('ESLint', true, 'Linting passed (warnings allowed)');
  } catch (error) {
    recordCheck('ESLint', false, 'Linting failed');
  }

  console.log('\n🔧 Step 2: TypeScript Type Checking');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    recordCheck('TypeScript', true, 'No type errors found');
  } catch (error) {
    recordCheck('TypeScript', false, 'Type errors found');
  }

  console.log('\n🧪 Step 3: Unit Tests');
  try {
    const testOutput = execSync('npx vitest run --reporter=json', { stdio: 'pipe' });
    const testResults = JSON.parse(testOutput);
    const totalTests = testResults.numTotalTests;
    const passedTests = testResults.numPassedTests;
    const failedTests = testResults.numFailedTests;
    
    if (failedTests === 0 && totalTests > 0) {
      recordCheck('Unit Tests', true, `${passedTests}/${totalTests} tests passed`);
    } else if (totalTests === 0) {
      recordCheck('Unit Tests', false, 'No tests found', 'warning');
    } else {
      recordCheck('Unit Tests', false, `${passedTests}/${totalTests} tests passed, ${failedTests} failed`);
    }
  } catch (error) {
    recordCheck('Unit Tests', false, 'Tests failed');
  }

  console.log('\n📊 Step 4: Test Coverage');
  try {
    execSync('npm run test:coverage', { stdio: 'pipe' });
    
    execSync('node scripts/generate-coverage-summary.js', { stdio: 'pipe' });
    
    const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
      const linePct = coverageData.total?.lines?.pct || 0;
      const functionPct = coverageData.total?.functions?.pct || 0;
      const branchPct = coverageData.total?.branches?.pct || 0;
      const statementPct = coverageData.total?.statements?.pct || 0;
      
      const meetsThreshold = linePct >= 80 && functionPct >= 80 && statementPct >= 80;
      const message = `Lines: ${linePct}%, Functions: ${functionPct}%, Branches: ${branchPct}%, Statements: ${statementPct}%`;
      
      if (meetsThreshold) {
        recordCheck('Test Coverage', true, `${message} (Branches: ${branchPct}% - warning)`);
      } else {
        recordCheck('Test Coverage', false, `${message} (Minimum 80% required)`, 'warning');
      }
    } else {
      recordCheck('Test Coverage', false, 'Coverage report not found', 'warning');
    }
  } catch (error) {
    recordCheck('Test Coverage', false, 'Coverage check failed', 'warning');
  }

  console.log('\n🔒 Step 5: Security Vulnerability Scan');
  try {
    execSync('npm run audit:check', { stdio: 'pipe' });
    recordCheck('Security Audit', true, 'No critical or high vulnerabilities');
  } catch (error) {
    recordCheck('Security Audit', false, 'Security vulnerabilities found', 'warning');
  }

  console.log('\n🏗️  Step 6: Build Verification');
  try {
    execSync('npm run build', { stdio: 'pipe' });
    recordCheck('Build', true, 'Build successful');
  } catch (error) {
    recordCheck('Build', false, 'Build failed');
  }

  console.log('\n📝 Step 7: Manifest Verification');
  if (fs.existsSync(path.join(__dirname, '../public/manifest.json'))) {
    recordCheck('PWA Manifest', true, 'manifest.json exists');
  } else {
    recordCheck('PWA Manifest', false, 'manifest.json missing', 'warning');
  }

  fs.writeFileSync(path.join(reportsDir, 'verification-report.json'), JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log('📋 Verification Summary');
  console.log('='.repeat(50));
  console.log(`Passed:  ${report.summary.passed}`);
  console.log(`Failed:  ${report.summary.failed}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  console.log('='.repeat(50));

  if (report.summary.failed > 0) {
    report.status = 'FAIL';
    console.log('\n❌ Verification FAILED!');
    console.log('Please fix the errors above before deploying.');
    process.exit(1);
  } else if (report.summary.warnings > 0) {
    report.status = 'WARNING';
    console.log('\n⚠️  Verification completed with WARNINGS!');
    console.log('Review the warnings before deploying.');
    process.exit(0);
  } else {
    report.status = 'PASS';
    console.log('\n✨ All verification checks PASSED!');
    console.log('Code is verified and ready for deployment.');
    process.exit(0);
  }
} catch (error) {
  console.error('\n💥 Unexpected error during verification:', error.message);
  report.status = 'ERROR';
  fs.writeFileSync(path.join(reportsDir, 'verification-report.json'), JSON.stringify(report, null, 2));
  process.exit(1);
}
