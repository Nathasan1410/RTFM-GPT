import { NextResponse } from 'next/server';
import { VerifyRequestSchema, VerifyResponseSchema, CheckResult } from '@/types/verify';
import { getAIClient } from '@/lib/ai';
import * as ts from 'typescript';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = VerifyRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { userCode, requirements, topic } = parseResult.data;
    
    const groqKey = req.headers.get('x-api-key-groq') || undefined;
    const cerebrasKey = req.headers.get('x-api-key-cerebras') || undefined;

    const { client, defaultModel } = getAIClient({ groq: groqKey, cerebras: cerebrasKey });

    const checks: CheckResult[] = [];

    try {
      const { ESLint } = await import('eslint');
      
      const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: {
          languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
              window: 'readonly',
              document: 'readonly',
              console: 'readonly',
              setTimeout: 'readonly',
              setInterval: 'readonly',
              clearTimeout: 'readonly',
              clearInterval: 'readonly',
            },
          },
          rules: {
            'no-console': 'warn',
            'no-unused-vars': 'error',
            'no-undef': 'error',
            'semi': 'error',
            'quotes': ['error', 'single'],
            'eqeqeq': 'error',
            'no-var': 'error',
          },
        },
      });

      const results = await eslint.lintText(userCode);

      const errors = results.flatMap(r => r.messages.filter(m => m.severity === 2));
      const warnings = results.flatMap(r => r.messages.filter(m => m.severity === 1));

      if (errors.length > 0) {
        checks.push({
          category: 'lint',
          status: 'FAIL',
          message: `Found ${errors.length} linting error(s)`,
          details: errors.map(e => ({
            line: e.line,
            column: e.column,
            message: e.message,
            ruleId: e.ruleId,
          })),
        });
      } else if (warnings.length > 0) {
        checks.push({
          category: 'lint',
          status: 'WARNING',
          message: `Found ${warnings.length} warning(s) but no errors`,
          details: warnings.map(w => ({
            line: w.line,
            column: w.column,
            message: w.message,
            ruleId: w.ruleId,
          })),
        });
      } else {
        checks.push({
          category: 'lint',
          status: 'PASS',
          message: 'No linting errors or warnings found',
        });
      }
    } catch (error) {
      checks.push({
        category: 'lint',
        status: 'WARNING',
        message: 'ESLint check failed to run',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        lib: ['ES2020', 'DOM'],
        jsx: ts.JsxEmit.React,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        resolveJsonModule: true,
      };

      const sourceFile = ts.createSourceFile(
        'temp.tsx',
        userCode,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const host = ts.createCompilerHost(compilerOptions);
      const program = ts.createProgram(['temp.tsx'], compilerOptions, {
        ...host,
        getSourceFile: (fileName) => {
          if (fileName === 'temp.tsx') {
            return sourceFile;
          }
          return host.getSourceFile(fileName, ts.ScriptTarget.Latest);
        },
      });

      const diagnostics = [
        ...program.getSemanticDiagnostics(sourceFile),
        ...program.getSyntacticDiagnostics(sourceFile),
      ];

      const errors = diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
      const warnings = diagnostics.filter(d => d.category === ts.DiagnosticCategory.Warning);

      if (errors.length > 0) {
        const errorMessages = errors.map(d => {
          const lineInfo = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : null;
          const line = lineInfo?.line ?? 0;
          const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
          return `${line + 1}: ${message}`;
        });

        checks.push({
          category: 'type',
          status: 'FAIL',
          message: `Found ${errors.length} TypeScript error(s)`,
          details: errorMessages,
        });
      } else if (warnings.length > 0) {
        const warningMessages = warnings.map(d => {
          const lineInfo = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : null;
          const line = lineInfo?.line ?? 0;
          const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
          return `${line + 1}: ${message}`;
        });

        checks.push({
          category: 'type',
          status: 'WARNING',
          message: `Found ${warnings.length} TypeScript warning(s)`,
          details: warningMessages,
        });
      } else {
        checks.push({
          category: 'type',
          status: 'PASS',
          message: 'No TypeScript errors found',
        });
      }
    } catch (error) {
      checks.push({
        category: 'type',
        status: 'WARNING',
        message: 'TypeScript check failed to run',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    const lintFailed = checks.some(c => c.category === 'lint' && c.status === 'FAIL');
    const typeFailed = checks.some(c => c.category === 'type' && c.status === 'FAIL');

    let aiCheck: CheckResult;

    if (lintFailed || typeFailed) {
      aiCheck = {
        category: 'ai',
        status: 'WARNING',
        message: 'AI verification skipped due to linting/type errors. Fix those first.',
      };
    } else {
      try {
        const systemPrompt = `
You are a Strict Code Judge for a programming tutorial.
Your goal is to verify if USER CODE meets specific REQUIREMENTS.

CONTEXT:
Topic: ${topic || 'General Web Development'}

REQUIREMENTS:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

INSTRUCTIONS:
1. Analyze the USER CODE against the REQUIREMENTS.
2. If ALL requirements are met, status is "PASS".
3. If ANY requirement is missing or incorrect, status is "FAIL".
4. Provide specific feedback referencing the missing requirement.
5. Provide a helpful hint (not the solution) if failed.

JSON RESPONSE FORMAT:
{
  "status": "PASS" | "FAIL" | "PARTIAL",
  "feedback": "Detailed explanation...",
  "hints": ["Hint 1", "Hint 2"]
}
`;

        const completion = await (client as any).chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `USER CODE:\n\n${userCode}` }
          ],
          model: defaultModel,
          temperature: 0.1,
          max_completion_tokens: 1000,
          response_format: { type: 'json_object' },
        }) as any;

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content from AI');

        let json;
        try {
          json = JSON.parse(content);
        } catch {
          const match = content.match(/\{[\s\S]*\}/);
          if (match) json = JSON.parse(match[0]);
          else throw new Error('Failed to parse JSON');
        }

        const validated = VerifyResponseSchema.parse(json);
        aiCheck = {
          category: 'ai',
          status: validated.status === 'PASS' ? 'PASS' : 'FAIL',
          message: validated.feedback,
          details: validated.hints || [],
        };
      } catch (error) {
        aiCheck = {
          category: 'ai',
          status: 'WARNING',
          message: 'AI verification failed to run',
          details: error instanceof Error ? error.message : String(error),
        };
      }
    }

    checks.push(aiCheck);

    const allPassed = checks.every(c => c.status === 'PASS');
    const hasFailures = checks.some(c => c.status === 'FAIL');
    const hasWarnings = checks.some(c => c.status === 'WARNING');

    let finalStatus: 'PASS' | 'FAIL' | 'PARTIAL';
    if (hasFailures) {
      finalStatus = 'FAIL';
    } else if (allPassed) {
      finalStatus = 'PASS';
    } else {
      finalStatus = 'PARTIAL';
    }

    const overallFeedback = checks.map(c => {
      const icon = c.status === 'PASS' ? '✅' : c.status === 'FAIL' ? '❌' : '⚠️';
      const category = c.category === 'lint' ? 'Code Quality' : c.category === 'type' ? 'Type Safety' : 'AI Review';
      return `${icon} ${category}: ${c.message}`;
    }).join('\n');

    const hints: string[] = [];
    checks.forEach(c => {
      if (c.status === 'FAIL' && c.details) {
        if (Array.isArray(c.details)) {
          hints.push(...c.details);
        } else if (typeof c.details === 'string') {
          hints.push(c.details);
        }
      }
    });

    const response = {
      status: finalStatus,
      feedback: overallFeedback,
      hints,
      checks,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Verify API Error:', error);
    if (error instanceof Error && error.message.includes('No AI API Key found')) {
      return NextResponse.json(
        { error: 'Missing AI API key. Add Groq or Cerebras key in Settings.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
