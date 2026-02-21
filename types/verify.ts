import { z } from 'zod';

export const CheckResultSchema = z.object({
  category: z.enum(['lint', 'type', 'ai']),
  status: z.enum(['PASS', 'FAIL', 'WARNING']),
  message: z.string(),
  details: z.any().optional(),
});

export type CheckResult = z.infer<typeof CheckResultSchema>;

export const VerifyRequestSchema = z.object({
  userCode: z.string().max(10000),
  requirements: z.array(z.string()),
  topic: z.string().optional(),
});

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

export const VerifyResponseSchema = z.object({
  status: z.enum(['PASS', 'FAIL', 'PARTIAL']),
  feedback: z.string(),
  hints: z.array(z.string()).optional(),
  checks: z.array(CheckResultSchema).optional(),
});

export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;
