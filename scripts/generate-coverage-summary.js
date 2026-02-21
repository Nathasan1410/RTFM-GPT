const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const coverageDir = path.join(__dirname, '../coverage');
const lcovInfoPath = path.join(coverageDir, 'lcov.info');
const summaryPath = path.join(coverageDir, 'coverage-summary.json');

if (fs.existsSync(lcovInfoPath)) {
  try {
    const lcovContent = fs.readFileSync(lcovInfoPath, 'utf-8');
    
    let totalLines = 0;
    let coveredLines = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalStatements = 0;
    let coveredStatements = 0;
    
    const lines = lcovContent.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('LF:')) {
        totalLines += parseInt(line.substring(3));
      } else if (line.startsWith('LH:')) {
        coveredLines += parseInt(line.substring(3));
      } else if (line.startsWith('FNF:')) {
        totalFunctions += parseInt(line.substring(4));
      } else if (line.startsWith('FNH:')) {
        coveredFunctions += parseInt(line.substring(4));
      } else if (line.startsWith('BRF:')) {
        totalBranches += parseInt(line.substring(4));
      } else if (line.startsWith('BRH:')) {
        coveredBranches += parseInt(line.substring(4));
      }
    });
    
    const linePct = totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0;
    const functionPct = totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0;
    const branchPct = totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0;
    
    const summary = {
      total: {
        lines: { total: totalLines, covered: coveredLines, pct: linePct },
        functions: { total: totalFunctions, covered: coveredFunctions, pct: functionPct },
        branches: { total: totalBranches, covered: coveredBranches, pct: branchPct },
        statements: { total: totalStatements, covered: coveredStatements, pct: linePct },
      }
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('Coverage summary generated:', JSON.stringify(summary.total, null, 2));
  } catch (error) {
    console.error('Error generating coverage summary:', error.message);
  }
} else {
  console.log('lcov.info not found, skipping summary generation');
}
