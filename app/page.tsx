"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Terminal, Zap, Flame } from "lucide-react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecentRoadmaps } from "@/components/recent-roadmaps";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Roadmap } from "@/types/schemas";

const SUGGESTIONS = ["React Hooks", "System Design", "Rust Lifetimes", "Solidity Security"];

export default function Home() {
  const [topic, setTopic] = useState("");
  const [version, setVersion] = useState<'lite' | 'pro'>('lite');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const addRoadmap = useAppStore((state) => state.addRoadmap);
  const apiKeys = useAppStore((state) => state.apiKeys);
  const roadmaps = useAppStore((state) => state.roadmaps);
  const hasRoadmaps = Object.keys(roadmaps).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = topic.trim();
    
    // Validation
    if (cleanTopic.length < 3) {
      setError("Topic must be at least 3 characters");
      return;
    }
    if (cleanTopic.length > 100) {
      setError("Topic must be less than 100 characters");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Get existing roadmaps titles for context
      const existingTitles = Object.values(roadmaps).map(r => r.title);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKeys.groq) headers['x-api-key-groq'] = apiKeys.groq;
      if (apiKeys.cerebras) headers['x-api-key-cerebras'] = apiKeys.cerebras;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic: cleanTopic, existingTitles, version }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("API returned non-JSON:", text);
        throw new Error(`Server Error: Received ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate roadmap');
      }

      const newId = nanoid(21);
      const newRoadmap: Roadmap = {
        id: newId,
        title: data.title,
        topic: cleanTopic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modules: data.modules.map((m: any) => ({
          ...m,
          id: nanoid(21), // Generate IDs for modules here
        })),
      };

      await addRoadmap(newRoadmap);
      router.push(`/roadmap/${newId}`);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] py-20 px-6">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-50">
          READ THE F*CKING MANUAL
        </h1>
        <p className="text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
          AI generates structured roadmaps that force you to read official documentation. 
          No tutorials. No spoon-feeding. Just you and the manual.
        </p>
        <p className="text-xs font-mono text-zinc-600 tracking-wide mt-6">
          Powered by Cerebras • No login required • Local storage
        </p>
      </div>

      {/* Version Toggle */}
      <div className="w-full max-w-xl mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setVersion('lite')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-mono transition-all",
              version === 'lite'
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                : "bg-transparent text-zinc-500 hover:text-zinc-400 border border-transparent hover:border-zinc-800"
            )}
          >
            <Flame className="w-4 h-4" />
            <span>Lite</span>
            <span className="text-xs opacity-60">(Fast)</span>
          </button>
          <button
            onClick={() => setVersion('pro')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-mono transition-all",
              version === 'pro'
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                : "bg-transparent text-zinc-500 hover:text-zinc-400 border border-transparent hover:border-zinc-800"
            )}
          >
            <Zap className="w-4 h-4" />
            <span>Pro</span>
            <span className="text-xs opacity-60">(Deeper)</span>
          </button>
        </div>
        <p className="text-xs text-zinc-600 text-center mt-2 font-mono">
          {version === 'lite' 
            ? 'Single-pass generation • 5-7 modules • Great for quick learning'
            : 'Multi-agent system • Deep research • Specialized per module'}
        </p>
      </div>

      {/* Input Interface */}
      <div className="w-full max-w-xl mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <form onSubmit={handleSubmit} className="relative group">
          <label 
            htmlFor="topic" 
            className="block text-xs font-medium uppercase tracking-widest text-zinc-500 mb-2 pl-1"
          >
            What do you want to master?
          </label>
          
          <div className={cn(
            "relative flex items-center bg-zinc-900 border rounded-sm overflow-hidden transition-colors",
            error 
              ? "border-red-500 ring-1 ring-red-500" 
              : "border-zinc-700 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600",
            isLoading && "opacity-80 cursor-not-allowed border-zinc-600"
          )}>
            <Terminal className={cn(
              "absolute left-4 w-5 h-5 transition-colors",
              error ? "text-red-500" : "text-zinc-600"
            )} />
            <Input
              id="topic"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Next.js App Router, Rust Ownership..."
              className="h-16 pl-12 pr-32 text-lg bg-transparent border-none focus-visible:ring-0 placeholder:text-zinc-700 text-zinc-50 font-mono"
              disabled={isLoading}
              autoComplete="off"
            />
            
            <Button 
              type="submit" 
              disabled={!topic.trim() || isLoading}
              className={cn(
                "absolute right-2 top-3 h-10 px-4 rounded-sm text-sm font-mono font-medium transition-all",
                version === 'pro' ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200" : "bg-zinc-100 text-zinc-950 hover:bg-zinc-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span>{version === 'pro' ? 'Deep research' : 'Consulting docs'}</span>
                  <span className="animate-blink">█</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  Generate {version === 'pro' && <Zap className="w-3 h-3" />}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
          
          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500 font-mono mt-2 pl-1 animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}
        </form>

        {/* Empty State Suggestions */}
        {!hasRoadmaps && !isLoading && (
          <div className="mt-6 text-center animate-in fade-in duration-700 delay-300">
            <p className="text-sm text-zinc-600 mb-4">
              Type a topic above to generate your first learning roadmap.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider mr-1">Try:</span>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setTopic(suggestion);
                    setError(null);
                    // Optional: focus input
                    document.getElementById('topic')?.focus();
                  }}
                  className="text-xs font-mono border border-zinc-800 bg-zinc-900 px-2 py-1 rounded-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Roadmaps */}
      <RecentRoadmaps />
    </div>
  );
}
