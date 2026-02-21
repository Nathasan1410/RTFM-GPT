import { getAIClient } from './ai';
import { GenerateResponse } from '@/types/schemas';

interface AgentConfig {
  groq?: string | undefined;
  cerebras?: string | undefined;
  brave?: string | undefined;
}

interface RoadmapBriefing {
  title: string;
  topic: string;
  overallGoal: string;
  modules: Array<{
    order: number;
    title: string;
    briefing: string;
    researchFocus: string;
  }>;
}

export class RoadmapAgentSystem {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  private getClient() {
    const { client } = getAIClient({ groq: this.config.groq, cerebras: this.config.cerebras });
    return client;
  }

  async generatePro(topic: string): Promise<GenerateResponse> {
    const client = this.getClient();

    const briefing = await this.generateRoadmapBriefing(topic, client);
    const modules = await this.generateModulesInParallel(briefing);

    return {
      title: briefing.title,
      modules: modules.map((mod, idx) => ({
        order: idx + 1,
        title: mod.title,
        context: mod.context,
        docs: mod.docs,
        challenge: mod.challenge,
        verificationCriteria: mod.verificationCriteria,
        groundTruth: mod.groundTruth,
        starterCode: mod.starterCode,
      })),
    };
  }

  private async generateRoadmapBriefing(topic: string, client: any): Promise<RoadmapBriefing> {
    const systemPrompt = `
You are a Senior Technical Architect and Learning Path Designer.
Your task is to analyze the user's topic "${topic}" and create a comprehensive roadmap briefing.

You must:
1. Define the overall project goal
2. Break down into 5-7 sequential modules
3. For each module, provide:
   - A clear title
   - A detailed briefing explaining WHAT this module covers and WHY it's essential
   - Specific research focus areas (what official docs/concepts to investigate)

Output in this JSON format:
{
  "title": "Project Title",
  "overallGoal": "What the user will build and why",
  "modules": [
    {
      "order": 1,
      "title": "Module Title",
      "briefing": "Detailed explanation of what this module covers...",
      "researchFocus": "Specific docs, APIs, concepts to research (e.g., 'MDN fetch API', 'React useEffect docs')"
    }
  ]
}
`;

    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a roadmap briefing for: ${topic}` }
      ],
      model: this.getModelName(),
      temperature: 0.7,
      max_completion_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to generate briefing');

    const cleanContent = this.extractJSON(content);
    return JSON.parse(cleanContent);
  }

  private async generateModulesInParallel(briefing: RoadmapBriefing): Promise<any[]> {
    const client = this.getClient();

    const modulePromises = briefing.modules.map(async (moduleBrief) => {
      return this.generateModuleWithResearch(moduleBrief, briefing.topic, client);
    });

    const results = await Promise.all(modulePromises);
    return results.sort((a, b) => a.order - b.order);
  }

  private async generateModuleWithResearch(
    moduleBrief: any,
    topic: string,
    client: any
  ): Promise<any> {
    const systemPrompt = `
You are a Module Specialist and Technical Researcher.
You are working on a roadmap for "${topic}".

Your current assignment:
${moduleBrief.briefing}

Research Focus: ${moduleBrief.researchFocus}

You must:
1. RESEARCH: Look up the official documentation and best practices for your research focus
2. DESIGN: Create a concrete, practical challenge
3. VALIDATE: Define clear success criteria

CONSTRAINTS:
- "context" must explain the WHY (use words like 'because', 'important', 'essential')
- "challenge" must NOT contain code snippets - only instructions
- "verificationCriteria" must be specific, testable checks
- "docs" must link to OFFICIAL documentation (MDN, React docs, etc.)
- Include relevant code examples in "groundTruth"

Output in this JSON format:
{
  "order": ${moduleBrief.order},
  "title": "Module Title",
  "context": "Explanation of the concept and why it's essential...",
  "docs": [
    { "title": "Doc Title", "url": "https://official-docs.com/..." }
  ],
  "challenge": "Specific instruction on what to build...",
  "verificationCriteria": [
    "Specific check 1",
    "Specific check 2"
  ],
  "groundTruth": "Example implementation code...",
  "starterCode": "Starting boilerplate..."
}
`;

    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate this module: ${moduleBrief.title}` }
      ],
      model: this.getModelName(),
      temperature: 0.8,
      max_completion_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to generate module');

    const cleanContent = this.extractJSON(content);
    return JSON.parse(cleanContent);
  }

  private extractJSON(content: string): string {
    const markdownMatch = content.match(/```json\n([\s\S]*?)\n```/);
    return markdownMatch ? markdownMatch[1] ?? content : content;
  }

  private getModelName(): string {
    const { client, defaultModel } = getAIClient({ 
      groq: this.config.groq, 
      cerebras: this.config.cerebras 
    });
    return defaultModel;
  }
}
