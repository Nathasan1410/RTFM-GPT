import { NextResponse } from 'next/server';
import { GenerateRequestSchema, GenerateResponseSchema, type GenerateResponse } from '@/types/schemas';
import { z } from 'zod';
import { getAIClient } from '@/lib/ai';
import { RoadmapAgentSystem } from '@/lib/agents';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, version = 'lite' } = GenerateRequestSchema.parse(body);

    const cleanTopic = topic.trim();
    if (cleanTopic.length < 3) {
      return NextResponse.json(
        { error: 'Topic must be at least 3 characters long' },
        { status: 400 }
      );
    }

    const groqKey = req.headers.get('x-api-key-groq') || undefined;
    const cerebrasKey = req.headers.get('x-api-key-cerebras') || undefined;

    if (!groqKey && !cerebrasKey) {
      return NextResponse.json(
        { error: 'Missing AI API key. Add Groq or Cerebras key in Settings.' },
        { status: 400 }
      );
    }

    let validated: GenerateResponse;

    if (version === 'pro') {
      const agentSystem = new RoadmapAgentSystem({
        groq: groqKey,
        cerebras: cerebrasKey,
      });
      validated = await agentSystem.generatePro(cleanTopic);
    } else {
      const { client, defaultModel } = getAIClient({ groq: groqKey, cerebras: cerebrasKey });

      const systemPrompt = `
You are a Brutal Tech Mentor & Project Architect.
Your goal is to break down the user's request: "${topic}" into a "Project-Based Micro-Chunking" roadmap.

PHILOSOPHY:
- "Guide me to build ONE SPECIFIC REAL PRODUCT, not teaching framework abstractly."
- Step N+1 depends on Step N.
- Each step must have a CONCRETE DELIVERABLE (verifiable code).

CONSTRAINT:
- DO NOT provide code snippets in the "challenge" field.
- "context" must explain the WHY (use words like 'because', 'important', 'essential') and be laser-focused on the specific step.
- "verificationCriteria" must be a list of 3-5 specific checks for the AI Judge (e.g., "Contains <img> tag", "CSS uses object-fit: cover").
- "groundTruth" is the CORRECT solution code for this step.
- "starterCode" is the initial boilerplate (optional).

JSON Structure:
{
  "title": "Project Title (e.g., Product Review Card)",
  "modules": [
    {
      "order": 1,
      "title": "Step Title (e.g., Setup Container)",
      "context": "Explanation of the concept (Box Model, etc.) and why it is essential...",
      "docs": [
        { "title": "MDN Box Model", "url": "https://developer.mozilla.org/..." }
      ],
      "challenge": "Specific instruction on what to build...",
      "verificationCriteria": [
        "Check for div with class 'card'",
        "Check width is fixed or max-width",
        "Check padding is applied"
      ],
      "groundTruth": "<div class='card'>...</div>",
      "starterCode": "<!-- Write your code here -->"
    }
  ]
}
Generate 5-7 micro-steps.
`;

      const completion = await (client as any).chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a rigorous learning roadmap for: ${cleanTopic}` }
        ],
        model: defaultModel,
        temperature: 0.7,
        max_completion_tokens: 4000,
        response_format: { type: 'json_object' },
      }) as any;

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Failed to generate content');
      }

      let cleanContent = content;
      const markdownMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (markdownMatch) {
        cleanContent = markdownMatch[1];
      }

      let json;
      try {
        json = JSON.parse(cleanContent);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        console.error("Raw Content:", content);
        throw new Error('Invalid JSON format received from AI');
      }

      validated = GenerateResponseSchema.parse(json);
    }
    
    return NextResponse.json(validated);
  } catch (error) {
    console.error('API Error:', error);

    // Handle 402 Payment Required (Groq/Cerebras generic)
    if (error instanceof Error && error.message.includes('402')) {
      return NextResponse.json(
        { error: 'Payment Required. Please check your API plan.' },
        { status: 402 }
      );
    }
    // Handle 404 Model Not Found
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Model not found. Please check your API key and model availability.' },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message.includes('No AI API Key found')) {
      return NextResponse.json(
        { error: 'Missing AI API key. Add Groq or Cerebras key in Settings.' },
        { status: 400 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
