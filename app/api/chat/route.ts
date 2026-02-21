import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAIClient } from '@/lib/ai';
import { braveSearch } from '@/lib/search';

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    topic: z.string(),
    moduleTitle: z.string(),
    moduleContext: z.string(),
    challenge: z.string(),
    userCode: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, context } = ChatRequestSchema.parse(body);

    const groqKey = req.headers.get('x-api-key-groq') || undefined;
    const cerebrasKey = req.headers.get('x-api-key-cerebras') || undefined;
    const braveKey = req.headers.get('x-api-key-brave') || undefined;

    const { client, defaultModel } = getAIClient({ groq: groqKey, cerebras: cerebrasKey });

    // Perform a relevant search to augment context
    const searchQuery = `${context.topic} ${context.moduleTitle} ${message}`;
    const searchResults = await braveSearch(searchQuery, 3, braveKey);
    
    const searchContext = searchResults.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? `\nRELEVANT DOCUMENTATION:\n${searchResults.map((r: any) => `- [${r.title}](${r.url}): ${r.description}`).join('\n')}\n`
      : '';

    const systemPrompt = `
You are a Helpful Tech Mentor assisting a student with a specific coding challenge.
Your goal is to provide HINTS and GUIDANCE, but NOT the full solution code.

CONTEXT:
Topic: ${context.topic}
Current Module: ${context.moduleTitle}
Concept: ${context.moduleContext}
Challenge: ${context.challenge}
${searchContext}

USER CODE:
${context.userCode ? context.userCode : '(No code written yet)'}

RULES:
1. Be concise and encouraging.
2. If the user asks for the answer, politely refuse and give a hint instead.
3. Reference the specific documentation or concepts relevant to the module.
4. Do not write full code blocks. Use inline code for function names or properties only.
5. If the user is stuck on a specific error, explain the error concept.
6. Use the provided search results to give accurate, up-to-date information.

USER MESSAGE: "${message}"
`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await (client as any).chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: defaultModel,
      temperature: 0.7,
      max_completion_tokens: 500,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    const reply = completion.choices[0]?.message?.content;
    if (!reply) throw new Error('No content from AI');

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Chat API Error:', error);
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
