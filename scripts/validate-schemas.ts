/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { ModuleContentSchema, RoadmapSchema } from '../types/schemas';

// Mock Nanoid (21 chars)
const mockModuleId = 'module_id_12345678901'; // 21 chars
const mockRoadmapId = 'road_map_id_123456789'; // 21 chars

console.log('--- STARTING SCHEMA VALIDATION ---');

// Helper to inspect error
function inspectError(e: any) {
  if (e instanceof z.ZodError) {
    console.log('Is ZodError');
    console.log('Keys:', Object.keys(e));
    console.log('Issues:', JSON.stringify(e.issues, null, 2));
    return e.issues || [];
  }
  return [];
}

// 1. Test Valid Module
const validModule = {
  id: mockModuleId,
  order: 1,
  title: 'Understanding TypeScript Types',
  context: 'This is important because types prevent runtime errors.',
  docUrl: 'https://www.typescriptlang.org/docs/',
  challenge: 'Create a simple interface for a User object without using any code blocks.',
};

try {
  ModuleContentSchema.parse(validModule);
  console.log('✅ Valid Module passed');
} catch (e) {
  console.error('❌ Valid Module failed:', e);
}

// 2. Test Invalid Module (Code in Challenge)
const invalidModuleCode = {
  ...validModule,
  challenge: 'Write function test() {}', // Too short (24 chars < 30) AND contains code
};

try {
  ModuleContentSchema.parse(invalidModuleCode);
  console.error('❌ Invalid Module (Code) passed (Should have failed)');
} catch (e: any) {
  const issues = inspectError(e);
  const hasCodeError = issues.some((i: any) => i.message.includes('Challenge cannot contain code snippets'));
  
  if (hasCodeError) {
    console.log('✅ Invalid Module (Code) correctly rejected');
  } else {
    console.error('❌ Invalid Module (Code) failed with wrong error:', JSON.stringify(issues));
  }
}

// 3. Test Invalid Module (Bad URL)
const invalidModuleUrl = {
  ...validModule,
  docUrl: 'http://insecure.com',
};

try {
  ModuleContentSchema.parse(invalidModuleUrl);
  console.error('❌ Invalid Module (URL) passed (Should have failed)');
} catch (e: any) {
  const issues = inspectError(e);
  const hasUrlError = issues.some((i: any) => i.message.includes('Must be a valid HTTPS URL'));
  
  if (hasUrlError) {
    console.log('✅ Invalid Module (URL) correctly rejected');
  } else {
    console.error('❌ Invalid Module (URL) failed with wrong error:', JSON.stringify(issues));
  }
}

// 4. Test Invalid Module (Context Missing Keywords)
const invalidModuleContext = {
  ...validModule,
  context: 'This is a context without the magic words.',
};

try {
  ModuleContentSchema.parse(invalidModuleContext);
  console.error('❌ Invalid Module (Context) passed (Should have failed)');
} catch (e: any) {
  const issues = inspectError(e);
  const hasContextError = issues.some((i: any) => i.message.includes('Context must explain WHY'));
  
  if (hasContextError) {
    console.log('✅ Invalid Module (Context) correctly rejected');
  } else {
    console.error('❌ Invalid Module (Context) failed with wrong error:', JSON.stringify(issues));
  }
}

// 5. Test Valid Roadmap
const validRoadmap = {
  id: mockRoadmapId,
  title: 'Learn TypeScript',
  topic: 'TypeScript',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  modules: [
    { ...validModule, id: 'module_1_123456789012', order: 1 },
    { ...validModule, id: 'module_2_123456789012', order: 2 },
    { ...validModule, id: 'module_3_123456789012', order: 3 },
  ],
};

try {
  RoadmapSchema.parse(validRoadmap);
  console.log('✅ Valid Roadmap passed');
} catch (e) {
  console.error('❌ Valid Roadmap failed:', e);
}

// 6. Test Invalid Roadmap (Unsorted Modules)
const invalidRoadmapSort = {
  ...validRoadmap,
  modules: [
    { ...validModule, id: 'module_2_123456789012', order: 2 },
    { ...validModule, id: 'module_1_123456789012', order: 1 },
    { ...validModule, id: 'module_3_123456789012', order: 3 },
  ],
};

try {
  RoadmapSchema.parse(invalidRoadmapSort);
  console.error('❌ Invalid Roadmap (Unsorted) passed (Should have failed)');
} catch (e: any) {
  const issues = inspectError(e);
  const hasSortError = issues.some((i: any) => i.message.includes('Modules must be strictly sorted'));
  
  if (hasSortError) {
    console.log('✅ Invalid Roadmap (Unsorted) correctly rejected');
  } else {
    console.error('❌ Invalid Roadmap (Unsorted) failed with wrong error:', JSON.stringify(issues));
  }
}

console.log('--- VALIDATION COMPLETE ---');
