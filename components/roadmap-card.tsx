import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Roadmap } from "@/types/schemas";

interface RoadmapCardProps {
  roadmap: Roadmap;
}

export function RoadmapCard({ roadmap }: RoadmapCardProps) {
  const getProgress = useAppStore((state) => state.getRoadmapProgress);
  const progress = getProgress(roadmap.id);
  const isComplete = progress === 100;

  return (
    <Link href={`/roadmap/${roadmap.id}`} className="block group">
      <div
        className={cn(
          "flex items-center gap-4 p-4 border border-zinc-800 bg-zinc-900/50 rounded-sm transition-colors group-hover:border-zinc-700",
          isComplete && "border-green-900/30 bg-green-950/10"
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-zinc-950 border border-zinc-800 shrink-0">
          <BookOpen className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium font-mono text-zinc-300 truncate group-hover:text-zinc-50 transition-colors">
            {roadmap.title}
          </h3>
          <p className="text-xs font-mono text-zinc-600 truncate mt-0.5">
            {new Date(roadmap.updatedAt).toLocaleDateString()} • {roadmap.modules.length} modules
          </p>
        </div>

        <div className="text-right shrink-0">
          <span 
            className={cn(
              "text-xs font-mono",
              isComplete ? "text-green-500" : "text-zinc-500"
            )}
          >
            {progress}%
          </span>
        </div>
      </div>
    </Link>
  );
}
