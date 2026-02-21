const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Running Security Audit...\n');

const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

let vulnerabilities = 0;
let criticalCount = 0;
let highCount = 0;
let moderateCount = 0;
let lowCount = 0;

try {
  console.log('📦 Running npm audit...');
  const auditOutput = execSync('npm audit --json', { encoding: 'utf-8' });
  const auditData = JSON.parse(auditOutput);

  if (auditData.vulnerabilities) {
    Object.values(auditData.vulnerabilities).forEach(vuln => {
      vulnerabilities++;
      if (vuln.severity === 'critical') criticalCount++;
      else if (vuln.severity === 'high') highCount++;
      else if (vuln.severity === 'moderate') moderateCount++;
      else if (vuln.severity === 'low') lowCount++;
    });
  }

  console.log(`\n📊 Vulnerability Summary:`);
  console.log(`   Critical: ${criticalCount}`);
  console.log(`   High:     ${highCount}`);
  console.log(`   Moderate: ${moderateCount}`);
  console.log(`   Low:      ${lowCount}`);
  console.log(`   Total:    ${vulnerabilities}`);

  fs.writeFileSync(
    path.join(reportsDir, 'security-audit.json'),
    JSON.stringify(auditData, null, 2)
  );

  if (criticalCount > 0 || highCount > 0) {
    console.log('\n❌ Critical or High vulnerabilities found. Please fix them before deploying.');
    process.exit(1);
  }

  if (moderateCount > 5) {
    console.log('\n⚠️  More than 5 moderate vulnerabilities found. Consider fixing them.');
    process.exit(1);
  }

  console.log('\n✅ Security audit passed!');
} catch (error) {
  if (error.stdout) {
    const auditData = JSON.parse(error.stdout);
    fs.writeFileSync(
      path.join(reportsDir, 'security-audit.json'),
      JSON.stringify(auditData, null, 2)
    );

    if (auditData.vulnerabilities) {
      Object.values(auditData.vulnerabilities).forEach(vuln => {
        vulnerabilities++;
        if (vuln.severity === 'critical') criticalCount++;
        else if (vuln.severity === 'high') highCount++;
        else if (vuln.severity === 'moderate') moderateCount++;
        else if (vuln.severity === 'low') lowCount++;
      });

      console.log(`\n📊 Vulnerability Summary:`);
      console.log(`   Critical: ${criticalCount}`);
      console.log(`   High:     ${highCount}`);
      console.log(`   Moderate: ${moderateCount}`);
      console.log(`   Low:      ${lowCount}`);
      console.log(`   Total:    ${vulnerabilities}`);
    }

    if (criticalCount > 0 || highCount > 0) {
      console.log('\n❌ Critical or High vulnerabilities found. Please fix them before deploying.');
      process.exit(1);
    }

    if (moderateCount > 5) {
      console.log('\n⚠️  More than 5 moderate vulnerabilities found. Consider fixing them.');
      process.exit(1);
    }
  }
  
  console.log('\n✅ Security audit passed!');
}
