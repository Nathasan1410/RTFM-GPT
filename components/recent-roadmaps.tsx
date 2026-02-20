"use client";

import Link from "next/link";
import { BookOpen, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export function RecentRoadmaps() {
  const roadmaps = useAppStore((state) => state.roadmaps);
  const getRoadmapProgress = useAppStore((state) => state.getRoadmapProgress);
  
  const recentRoadmaps = Object.values(roadmaps)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (recentRoadmaps.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Recent Roadmaps
        </h2>
        <span className="text-xs font-mono text-zinc-600">
          {recentRoadmaps.length} active
        </span>
      </div>

      <div className="space-y-3">
        {recentRoadmaps.map((roadmap) => {
          const progress = getRoadmapProgress(roadmap.id);
          const isComplete = progress === 100;

          return (
            <Link 
              key={roadmap.id} 
              href={`/roadmap/${roadmap.id}`}
              className="block group relative"
            >
              <div
                className={cn(
                  "flex flex-col border border-zinc-800 bg-zinc-900/30 rounded-sm transition-all duration-200 overflow-hidden",
                  "hover:border-zinc-600 hover:bg-zinc-900/80",
                  "active:scale-[0.99] active:border-zinc-500"
                )}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-sm border shrink-0 transition-colors",
                    isComplete 
                      ? "bg-green-950/20 border-green-900/50 text-green-500" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-600 group-hover:text-zinc-400 group-hover:border-zinc-700"
                  )}>
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <BookOpen className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium font-mono text-zinc-300 truncate group-hover:text-zinc-50 transition-colors">
                      {roadmap.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-mono group-hover:text-zinc-500">
                        {new Date(roadmap.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-zinc-700">•</span>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-mono group-hover:text-zinc-500">
                        {roadmap.modules.length} Mods
                      </span>
                    </div>
                  </div>

                  {/* Progress Text */}
                  <div className="text-right shrink-0">
                    <span 
                      className={cn(
                        "text-xs font-mono tabular-nums",
                        isComplete ? "text-green-500 font-medium" : "text-zinc-500 group-hover:text-zinc-400"
                      )}
                    >
                      {progress}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar (Mini) */}
                <div className="h-1 w-full bg-zinc-800">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
