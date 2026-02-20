import { NextResponse } from 'next/server';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { GenerateRequestSchema, GenerateResponseSchema } from '@/types/schemas';
import { z } from 'zod';

// Rate limiting (simple in-memory)
const rateLimit = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimit.get(ip) || [];
  const validRequests = requests.filter(time => now - time < WINDOW_MS);
  
  if (validRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  validRequests.push(now);
  rateLimit.set(ip, validRequests);
  return true;
}

export async function POST(req: Request) {
  try {
    // Rate limit check
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = GenerateRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.issues },
        { status: 400 }
      );
    }
    
    const { topic, existingTitles } = parseResult.data;
    
    if (!process.env.CEREBRAS_API_KEY) {
       console.warn("CEREBRAS_API_KEY is missing. Using mock response.");
       // Mock response for testing without API key
       return NextResponse.json({
         title: `Learn ${topic} (Mock)`,
         modules: [
           {
             order: 1,
             title: "Introduction to " + topic,
             context: "Understanding the basics is essential because it sets the foundation for advanced concepts.",
             docUrl: "https://react.dev/learn",
             challenge: "Read the introduction and explain the core concept in your own words without using code snippets."
           },
           {
             order: 2,
             title: "Core Concepts",
             context: "This concept is important because it is used in almost every application you will build.",
             docUrl: "https://react.dev/reference/react",
             challenge: "Identify the three main characteristics described in the documentation."
           },
           {
             order: 3,
             title: "Advanced Usage",
             context: "Mastering this is essential for building scalable applications.",
             docUrl: "https://react.dev/learn/escape-hatches",
             challenge: "Describe the trade-offs mentioned in the 'Performance' section."
           }
         ]
       });
    }

    const client = new Cerebras({
      apiKey: process.env.CEREBRAS_API_KEY,
    });

    let systemPrompt = `
You are a Brutal Tech Mentor. Your goal is to create a learning roadmap for the user on the topic: "${topic}".
You must be direct, no fluff, demanding but constructive.

CONSTRAINT:
- DO NOT provide code snippets.
- DO NOT summarize documentation.
- YOU MUST reference specific sections in official documentation.
- The output must be valid JSON matching the schema below.
- docUrl must be from official documentation domains (e.g., react.dev, developer.mozilla.org, docs.python.org). Avoid blogs like medium.com.
- challenge must NOT contain code blocks or function definitions.
- context must explain WHY the module is important (use words like 'because', 'important', 'essential').

JSON Structure:
{
  "title": "Roadmap Title",
  "modules": [
    {
      "order": 1,
      "title": "Module Title",
      "context": "Explanation of why this is important...",
      "docUrl": "https://official.docs/...",
      "challenge": "Specific actionable challenge..."
    }
  ]
}
Generate 5-7 modules.
`;

    if (existingTitles && existingTitles.length > 0) {
      systemPrompt += `\n\nUser already has roadmaps: ${existingTitles.join(", ")}. Create something different or complementary. Avoid repeating the same structure if possible.`;
    }

    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a rigorous learning roadmap for: ${topic}` }
      ],
      model: 'llama-3.3-70b',
      temperature: 0.7,
      max_completion_tokens: 4000,
      response_format: { type: 'json_object' },
    }) as any;

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from AI');
    }

    // Parse JSON
    let json;
    try {
      json = JSON.parse(content);
    } catch (e) {
      // Fallback: try to extract JSON from markdown block
      const match = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (match) {
        json = JSON.parse(match[1] || match[0]);
      } else {
        throw new Error('Failed to parse JSON response');
      }
    }

    // Validate with Zod
    const validated = GenerateResponseSchema.parse(json);

    return NextResponse.json(validated);

  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'AI response validation failed', details: error.issues },
        { status: 502 } // Bad Gateway (upstream response invalid)
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
