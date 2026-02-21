import { z } from 'zod';

// --- Module Schemas ---

export const ModuleContentSchema = z.object({
  id: z.string().length(21, "ID must be a 21-character nanoid"),
  order: z.number().int().min(1).max(10),
  title: z.string().min(5).max(100),
  context: z.string()
    .min(20)
    .max(300),
    // .regex(/(because|important|essential)/i, "Context must explain WHY (use 'because', 'important', or 'essential')"),
  docUrl: z.string().url().startsWith("https://", "Must be a valid HTTPS URL").optional(),
  docs: z.array(z.object({
    title: z.string().min(3).max(50),
    url: z.string().url()
  })).optional().default([]),
  challenge: z.string()
    .min(30)
    .max(500)
    .refine((val) => !/```|function\s+\w+\(/.test(val), "Challenge cannot contain code snippets (no code blocks or function declarations)"),
  // v2.0 New Fields
  verificationCriteria: z.array(z.string().min(5).max(150)).min(3).max(10).optional().default([]),
  groundTruth: z.string().optional(),
  starterCode: z.string().optional(),
});

export type ModuleContent = z.infer<typeof ModuleContentSchema>;

// --- Roadmap Schemas ---

export const RoadmapSchema = z.object({
  id: z.string().length(21, "ID must be a 21-character nanoid"),
  title: z.string().min(5).max(100),
  topic: z.string().min(3).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  modules: z.array(ModuleContentSchema)
    .min(3, "Roadmap must have at least 3 modules")
    .max(10, "Roadmap cannot have more than 10 modules")
    .refine(
      (modules) => {
        // Check if modules are sorted by order
        for (let i = 0; i < modules.length - 1; i++) {
          if (modules[i]!.order >= modules[i + 1]!.order) return false;
        }
        return true;
      },
      "Modules must be strictly sorted by order index (ascending)"
    ),
});

export type Roadmap = z.infer<typeof RoadmapSchema>;

// --- Progress Schemas ---

export const ProgressEntrySchema = z.object({
  roadmapId: z.string(),
  moduleId: z.string(),
  isCompleted: z.boolean(),
  completedAt: z.string().datetime().nullable(),
  // v2.0 New Fields
  userCode: z.string().optional(),
  verificationStatus: z.enum(['LOCKED', 'ACTIVE', 'VERIFIED', 'COMPLETED']).optional().default('ACTIVE'),
  attempts: z.number().optional().default(0),
});

export type ProgressEntry = z.infer<typeof ProgressEntrySchema>;

// --- AI Contract Schemas ---

export const GenerateRequestSchema = z.object({
  topic: z.string().min(3).max(100).trim(),
  existingTitles: z.array(z.string()).optional(),
  version: z.enum(['lite', 'pro']).default('lite'),
}).strict();

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const GenerateResponseSchema = z.object({
  title: z.string().min(5).max(100),
  modules: z.array(z.object({
    order: z.number().int().min(1).max(10),
    title: z.string().min(5).max(100),
    context: z.string()
      .min(20)
      .max(300),
      // .regex(/(because|important|essential)/i, "Context must explain WHY"),
    docUrl: z.string().url().startsWith("https://", "Must be a valid HTTPS URL").optional(),
    docs: z.array(z.object({
      title: z.string(),
      url: z.string().url()
    })).optional(),
    challenge: z.string()
      .min(30)
      .max(500)
      .refine((val) => !/```|function\s+\w+\(/.test(val), "Challenge cannot contain code snippets"),
  })).min(3).max(10),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

// --- Export/Import Schemas ---

export const ExportDataSchema = z.object({
  version: z.literal("1.0"),
  roadmaps: z.array(RoadmapSchema),
  progress: z.record(z.string(), ProgressEntrySchema), // Key is `${roadmapId}_${moduleId}`
});

export type ExportData = z.infer<typeof ExportDataSchema>;
