"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, ExternalLink, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Roadmap, ModuleContent } from "@/types/schemas";

export default function ModulePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>
}) {
  const router = useRouter();
  const [roadmapId, setRoadmapId] = useState<string | null>(null);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [module, setModule] = useState<ModuleContent | null>(null);
  
  const roadmaps = useAppStore((state) => state.roadmaps);
  const progressState = useAppStore((state) => state.progress);
  const toggleCompletion = useAppStore((state) => state.toggleModuleCompletion);
  const isLoading = useAppStore((state) => state.isLoading);

  useEffect(() => {
    params.then((p) => {
      setRoadmapId(p.id);
      setModuleId(p.moduleId);
    });
  }, [params]);

  useEffect(() => {
    if (roadmapId && roadmaps[roadmapId]) {
      setRoadmap(roadmaps[roadmapId]);
      const foundModule = roadmaps[roadmapId].modules.find(m => m.id === moduleId);
      if (foundModule) {
        setModule(foundModule);
      }
    }
  }, [roadmapId, moduleId, roadmaps]);

  if (isLoading || !roadmapId || !moduleId) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500 font-mono">Loading module data...</div>;
  }

  if (!roadmap || !module) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-mono text-zinc-500">Module Not Found</h1>
        <Button 
          variant="link" 
          onClick={() => router.push(roadmapId ? `/roadmap/${roadmapId}` : "/")}
          className="mt-4 text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Roadmap
        </Button>
      </div>
    );
  }

  const isCompleted = progressState[`${roadmapId}_${moduleId}`]?.isCompleted || false;
  
  // Navigation Logic
  const currentIndex = roadmap.modules.findIndex(m => m.id === moduleId);
  const prevModule = currentIndex > 0 ? roadmap.modules[currentIndex - 1] : null;
  const nextModule = currentIndex < roadmap.modules.length - 1 ? roadmap.modules[currentIndex + 1] : null;

  const handleToggle = () => {
    toggleCompletion(roadmap.id, module.id, !isCompleted);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Breadcrumb / Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm font-mono text-zinc-500 overflow-hidden">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
            <span className="text-zinc-700">/</span>
            <Link href={`/roadmap/${roadmapId}`} className="hover:text-zinc-300 transition-colors truncate max-w-[150px]">{roadmap.title}</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200 truncate">{module.title}</span>
        </div>
        
        <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider hidden sm:inline-block">
                Module {currentIndex + 1} of {roadmap.modules.length}
            </span>
             {isCompleted && (
                <Badge variant="default" className="bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-900/20">
                    <CheckCircle className="w-3 h-3 mr-1" /> Completed
                </Badge>
            )}
        </div>
      </header>

      {/* Split View Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Reference (Scrollable) */}
        <div className="flex-1 overflow-y-auto border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950/30 order-1 lg:order-1">
            <div className="max-w-3xl mx-auto p-6 lg:p-10 space-y-8">
                <div>
                    <span className="text-xs font-bold text-zinc-500 tracking-[0.2em] uppercase mb-2 block">Reference</span>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-50 font-mono mb-6 leading-tight">
                        {module.title}
                    </h1>
                    
                    <div className="bg-zinc-900/50 border-l-2 border-zinc-700 p-4 rounded-r-sm mb-8">
                        <p className="text-zinc-300 leading-relaxed font-sans text-lg">
                            {module.context}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Official Documentation
                    </h3>
                    
                    <a 
                        href={module.docUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group block p-6 border border-zinc-800 rounded-sm hover:border-zinc-600 hover:bg-zinc-900/50 transition-all duration-200 relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="text-lg font-semibold text-zinc-200 group-hover:text-white flex items-center gap-2">
                                    READ THE MANUAL
                                    <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-sm text-zinc-500 font-mono truncate max-w-[300px] sm:max-w-md whitespace-normal break-words">
                                    {module.docUrl}
                                </div>
                            </div>
                            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 transition-colors">
                                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                            </div>
                        </div>
                        {/* Corner accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-zinc-800/20 to-transparent -mr-8 -mt-8 rotate-45 pointer-events-none" />
                    </a>
                    
                    <p className="text-xs text-zinc-500 italic text-center">
                        * Opens in a new tab. Read it carefully.
                    </p>
                </div>
            </div>
        </div>

        {/* Right: Challenge (Scrollable) */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 relative order-2 lg:order-2">
            <div className="max-w-3xl mx-auto p-6 lg:p-10 space-y-8">
                 <div>
                    <span className="text-xs font-bold text-green-600/80 tracking-[0.2em] uppercase mb-2 block">Challenge</span>
                    <div className="border border-zinc-800 bg-zinc-900/20 p-6 md:p-8 rounded-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-900/50 group-hover:bg-green-500/50 transition-colors" />
                        
                        <p className="text-zinc-200 font-mono text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                            {module.challenge}
                        </p>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-900">
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <button
                            onClick={handleToggle}
                            className={cn(
                                "relative group flex items-center justify-center gap-3 px-8 py-4 rounded-sm border-2 transition-all duration-300 w-full max-w-sm min-h-[56px]",
                                isCompleted 
                                    ? "border-green-600 bg-green-900/10 text-green-400" 
                                    : "border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 bg-zinc-900/50"
                            )}
                        >
                            <div className={cn(
                                "w-5 h-5 rounded-sm border flex items-center justify-center transition-colors",
                                isCompleted ? "border-green-500 bg-green-500 text-black" : "border-zinc-600 group-hover:border-zinc-400"
                            )}>
                                {isCompleted && <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                            <span className="font-mono font-bold tracking-wide uppercase">
                                {isCompleted ? "Mission Completed" : "Mark as Complete"}
                            </span>
                        </button>
                        
                        <p className="text-xs text-zinc-600 font-mono text-center max-w-xs">
                            {isCompleted 
                                ? "Great job. Ready for the next module?" 
                                : "Only mark this as complete after you have verified your solution."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="border-t border-zinc-800 bg-zinc-950 p-4 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Button
                variant="ghost"
                disabled={!prevModule}
                onClick={() => prevModule && router.push(`/roadmap/${roadmapId}/module/${prevModule.id}`)}
                className="text-zinc-400 hover:text-zinc-200"
            >
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Previous Module</span>
                <span className="sm:hidden">Prev</span>
            </Button>

            <div className="flex gap-1">
                {roadmap.modules.map((m, idx) => (
                    <div 
                        key={m.id} 
                        className={cn(
                            "w-8 h-1 rounded-full transition-colors",
                            idx === currentIndex ? "bg-zinc-200" : 
                            progressState[`${roadmapId}_${m.id}`]?.isCompleted ? "bg-green-900" : "bg-zinc-800"
                        )} 
                    />
                ))}
            </div>

            <Button
                variant={isCompleted && nextModule ? "default" : "outline"}
                disabled={!nextModule}
                onClick={() => nextModule && router.push(`/roadmap/${roadmapId}/module/${nextModule.id}`)}
                className={cn(
                    "min-w-[120px]",
                    isCompleted && nextModule ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-300" : "text-zinc-400 border-zinc-700"
                )}
            >
                <span className="hidden sm:inline">Next Module</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
