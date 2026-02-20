"use client";

import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface ProgressDashboardProps {
  total: number;
  completed: number;
}

export function ProgressDashboard({ total, completed }: ProgressDashboardProps) {
  const percentage = Math.round((completed / total) * 100);
  const isComplete = percentage === 100;

  // Calculate terminal bar segments (10 blocks)
  const totalBlocks = 10;
  const filledBlocks = Math.round((percentage / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  
  // Construct ASCII progress bar
  const terminalBar = `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}]`;

  return (
    <div className="border border-zinc-800 rounded-sm bg-zinc-900/50 p-6 mt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Big Percentage */}
        <div className="flex items-center gap-4">
          <span className={cn(
            "text-5xl font-bold font-mono tabular-nums",
            isComplete ? "text-green-500" : "text-zinc-50"
          )}>
            {percentage}%
          </span>
          {isComplete && (
            <div className="flex flex-col">
              <span className="text-green-500 font-bold uppercase tracking-widest text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Mission Accomplished
              </span>
              <span className="text-zinc-500 text-xs font-mono">
                All modules completed
              </span>
            </div>
          )}
        </div>

        {/* Right: Terminal Progress Bar */}
        <div className="w-full md:w-auto flex flex-col items-end gap-2">
          <div className="font-mono text-sm text-zinc-400 tracking-wider">
            {terminalBar} {percentage}%
          </div>
          
          <div className="w-full md:w-64 h-2 bg-zinc-800 rounded-sm overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500 ease-out",
                isComplete ? "bg-green-500" : "bg-green-600"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <span className="text-xs font-mono text-zinc-500">
            {completed} of {total} modules completed • {total - completed} remaining
          </span>
        </div>
      </div>
    </div>
  );
}
