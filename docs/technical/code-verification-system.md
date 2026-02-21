# Code Verification System

This document describes the comprehensive code verification system implemented for the project.

## Overview

The code verification system ensures that all code changes meet quality standards before being merged into the main branch or deployed to production. It includes static analysis, unit testing, security scanning, and automated quality gates.

## Components

### 1. Static Analysis (ESLint)

**Configuration**: [`eslint.config.mjs`](../../eslint.config.mjs)

**Features**:
- Next.js core web vitals and TypeScript rules
- Security vulnerability detection (eslint-plugin-security)
- Import organization and dependency management
- Accessibility checks (eslint-plugin-jsx-a11y)
- Custom rules for code quality

**Security Rules**:
- Detect object injection attacks
- Detect unsafe regular expressions
- Detect buffer vulnerabilities
- Detect child process usage
- Detect timing attacks
- Detect eval usage

**Quality Rules**:
- No `any` types (enforce explicit typing)
- No unused variables
- Import ordering and deduplication
- No console statements (except warn/error)
- No debugger statements

### 2. TypeScript Type Checking

**Configuration**: [`tsconfig.json`](../../tsconfig.json)

**Strict Mode Enabled**:
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

### 3. Unit Testing (Vitest)

**Configuration**: [`vitest.config.ts`](../../vitest.config.ts)

**Features**:
- jsdom environment for React component testing
- Coverage reporting with multiple formats (text, JSON, HTML, lcov)
- Test timeout: 10 seconds
- Global test utilities enabled

**Coverage Thresholds**:
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

**Available Scripts**:
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

### 4. Security Vulnerability Scanning

**Script**: [`scripts/security-audit.js`](../../scripts/security-audit.js)

**Features**:
- npm audit integration
- Automatic vulnerability classification
- JSON report generation
- Threshold enforcement

**Security Policies**:
- **Critical vulnerabilities**: Not allowed (blocks deployment)
- **High vulnerabilities**: Not allowed (blocks deployment)
- **Moderate vulnerabilities**: Maximum 5 allowed
- **Low vulnerabilities**: No strict limit

**Available Scripts**:
- `npm run audit` - Run npm audit
- `npm run audit:fix` - Automatically fix vulnerabilities
- `npm run audit:check` - Run custom security audit with thresholds

### 5. Quality Gates

**Comprehensive Verification**: [`scripts/verify.js`](../../scripts/verify.js)

The verification system runs all checks in sequence and generates a unified report:

1. **ESLint Static Analysis** - Checks code quality and security
2. **TypeScript Type Checking** - Ensures type safety
3. **Unit Tests** - Validates test suite passes
4. **Test Coverage** - Ensures minimum 80% coverage
5. **Security Audit** - Scans for vulnerabilities
6. **Build Verification** - Ensures project builds successfully
7. **Manifest Verification** - Checks PWA manifest exists

**Exit Codes**:
- `0` - All checks passed
- `1` - Critical errors or threshold violations

**Report Location**: `reports/verification-report.json`

## Pre-Commit Hooks

**Configuration**: [`.husky/pre-commit`](../../.husky/pre-commit)

**Actions on Commit**:
1. Run lint-staged on staged files
2. Run TypeScript type checking
3. Run unit tests

**If any check fails**, the commit is blocked and you must fix the issues.

## CI/CD Pipeline

**Configuration**: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

### Verification Job

Runs on all pushes and pull requests to main/develop branches:

1. Checkout code
2. Setup Node.js 18
3. Install dependencies (npm ci)
4. Run ESLint
5. Run TypeScript type check
6. Run unit tests
7. Generate and upload coverage reports
8. Check coverage thresholds (80% minimum)
9. Run security audit
10. Build project
11. Upload verification reports

### Deploy Job

Runs only on successful verification of pushes to main branch:

1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Build for production
5. Deploy (configure deployment commands)

## Verification Report Format

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "ESLint": {
      "passed": true,
      "message": "No errors, 5 warnings",
      "severity": "error"
    },
    "TypeScript": {
      "passed": true,
      "message": "No type errors found",
      "severity": "error"
    },
    "Unit Tests": {
      "passed": true,
      "message": "7/7 tests passed",
      "severity": "error"
    },
    "Test Coverage": {
      "passed": true,
      "message": "Lines: 85%, Functions: 82%, Branches: 80%, Statements: 85%",
      "severity": "error"
    },
    "Security Audit": {
      "passed": true,
      "message": "No critical or high vulnerabilities",
      "severity": "error"
    },
    "Build": {
      "passed": true,
      "message": "Build successful",
      "severity": "error"
    },
    "PWA Manifest": {
      "passed": true,
      "message": "manifest.json exists",
      "severity": "warning"
    }
  },
  "summary": {
    "passed": 7,
    "failed": 0,
    "warnings": 0
  },
  "status": "PASS"
}
```

## What Constitutes "Verified" Code

Code is considered **verified** when:

1. ✅ **All ESLint rules pass** - No errors, warnings acceptable but should be addressed
2. ✅ **TypeScript compilation succeeds** - No type errors
3. ✅ **All unit tests pass** - 100% test success rate
4. ✅ **Coverage meets thresholds** - Minimum 80% on all metrics
5. ✅ **No critical/high security vulnerabilities** - Security scan passes
6. ✅ **Production build succeeds** - No build errors
7. ✅ **All required files present** - PWA manifest, etc.

## Local Development Workflow

### Before Committing

```bash
# Run full verification
npm run verify

# Or run individual checks
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run audit:check
```

### Fixing Issues

1. **Linting errors**: Run `npm run lint:fix` to auto-fix, then manually address remaining issues
2. **Type errors**: Review TypeScript errors and fix type mismatches
3. **Test failures**: Run `npm run test:watch` to debug failing tests
4. **Coverage issues**: Write tests for uncovered code or refactor to reduce complexity
5. **Security vulnerabilities**: Run `npm run audit:fix` or update dependencies

### Commit Workflow

1. Stage your changes: `git add .`
2. Attempt to commit: `git commit -m "message"`
3. Pre-commit hooks run automatically
4. If any check fails, fix the issue and try again
5. Once all checks pass, commit succeeds

## Continuous Integration

All changes are automatically verified when:

- **Pushing to main/develop**: Full verification pipeline runs
- **Creating a pull request**: Full verification pipeline runs
- **Merging to main**: Deployment job triggers after successful verification

## Security Best Practices

1. **Never commit API keys**: Use `.env.local` for local development
2. **Regular dependency updates**: Run `npm audit:fix` regularly
3. **Review security alerts**: Address npm security advisories promptly
4. **Use secure coding practices**: Follow ESLint security rules
5. **Keep dependencies up to date**: Regularly update packages

## Troubleshooting

### Pre-commit hooks not running

```bash
# Reinstall husky
npm run prepare
```

### Tests timing out

- Check test timeout in `vitest.config.ts`
- Ensure async operations are properly awaited
- Mock external API calls

### Coverage not generating

- Ensure `@vitest/coverage-v8` is installed
- Check coverage configuration in `vitest.config.ts`
- Run `npm run test:coverage` instead of `npm test`

### Build failing in CI but passing locally

- Check Node.js version match
- Ensure dependencies are installed with `npm ci` in CI
- Review CI logs for specific errors

## Extending the System

### Adding New ESLint Rules

Edit [`eslint.config.mjs`](../../eslint.config.mjs) and add rules to the configuration.

### Adding New Test Files

Create test files with the pattern `*.test.ts` or `*.spec.ts` next to the source code.

### Adding New Verification Steps

Edit [`scripts/verify.js`](../../scripts/verify.js) and add a new step following the existing pattern.

## Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [npm Audit Documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)
