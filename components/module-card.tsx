"use client";

import Link from "next/link";
import { CheckCircle, Circle, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModuleContent } from "@/types/schemas";

interface ModuleCardProps {
  module: ModuleContent;
  roadmapId: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked?: boolean;
}

export function ModuleCard({ 
  module, 
  roadmapId, 
  isCompleted, 
  isCurrent,
  isLocked = false 
}: ModuleCardProps) {
  return (
    <Link 
      href={isLocked ? "#" : `/roadmap/${roadmapId}/module/${module.id}`}
      className={cn(
        "block group relative transition-all duration-200",
        isLocked && "cursor-not-allowed opacity-60 pointer-events-none"
      )}
    >
      <div className={cn(
        "flex items-center gap-4 p-4 border rounded-sm transition-all",
        // Default State
        "border-zinc-800 bg-zinc-900/50",
        // Hover State
        !isLocked && "group-hover:border-zinc-700 group-hover:bg-zinc-900",
        // Active/Current State
        isCurrent && "border-l-2 border-l-green-500 bg-zinc-800/30",
        // Completed State
        isCompleted && "opacity-90"
      )}>
        {/* Order Number */}
        <div className={cn(
          "w-8 text-right font-mono text-lg font-bold shrink-0",
          isCurrent ? "text-zinc-200" : "text-zinc-700"
        )}>
          {String(module.order).padStart(2, '0')}
        </div>

        {/* Status Icon */}
        <div className="shrink-0">
          {isCompleted ? (
            <div className="bg-green-950/20 rounded-full p-0.5">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          ) : isLocked ? (
            <Lock className="w-5 h-5 text-zinc-700" />
          ) : (
            <Circle className={cn(
              "w-5 h-5",
              isCurrent ? "text-zinc-400" : "text-zinc-700 group-hover:text-zinc-500"
            )} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium font-mono truncate transition-colors",
            isCompleted ? "text-zinc-400" : "text-zinc-100",
            isCurrent && "text-green-400"
          )}>
            {module.title}
          </h3>
          <p className="text-sm text-zinc-500 truncate mt-0.5 max-w-[90%] font-sans">
            {module.context}
          </p>
        </div>

        {/* Action */}
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-200">
          <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
        </div>
      </div>
    </Link>
  );
}
