"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Calendar, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressDashboard } from "@/components/progress-dashboard";
import { ModuleCard } from "@/components/module-card";
import { DeleteRoadmapDialog } from "@/components/delete-roadmap-dialog";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function RoadmapPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const router = useRouter();
  const roadmaps = useAppStore((state) => state.roadmaps);
  const deleteRoadmap = useAppStore((state) => state.deleteRoadmap);
  const progressState = useAppStore((state) => state.progress);
  const isLoadingStore = useAppStore((state) => state.isLoading);

  const { id } = use(params);
  const roadmap = roadmaps[id];
  if (!roadmap) {
    // If roadmap is not found after initial load, show 404 UI
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-mono text-zinc-500">
          {isLoadingStore ? "Loading Roadmap..." : "Roadmap Not Found"}
        </h1>
        <Button 
          variant="link" 
          onClick={() => router.push("/")}
          className="mt-4 text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Return Home
        </Button>
      </div>
    );
  }

  // Calculate stats
  const totalModules = roadmap.modules.length;
  const completedModules = roadmap.modules.filter(m => 
    progressState[`${roadmap.id}_${m.id}`]?.isCompleted
  ).length;

  const handleDelete = () => {
    deleteRoadmap(roadmap.id);
    setIsDeleteDialogOpen(false);
    router.push("/");
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-6 pb-20">
      {/* 1. Page Header */}
      <header className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-4 pl-0 hover:bg-transparent hover:text-zinc-200 text-zinc-400 transition-colors"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Command Center
        </Button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-mono text-zinc-50 tracking-tight">
              {roadmap.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Created {new Date(roadmap.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                {totalModules} Modules
              </span>
              <span className="border border-zinc-700 bg-zinc-900 px-2 py-0.5 rounded-sm text-zinc-400 uppercase tracking-wider">
                {roadmap.topic}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-900/50 hover:bg-red-950/10 transition-colors"
              onClick={() => setIsDeleteDialogOpen(true)}
              title="Delete Roadmap"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Progress Dashboard */}
      <ProgressDashboard total={totalModules} completed={completedModules} />

      {/* 3. Module List */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-600">
            Modules
          </h2>
          {completedModules < totalModules && (
             <span className="text-xs font-mono text-zinc-500">
               Next: Module {completedModules + 1}
             </span>
          )}
        </div>

        <div className="space-y-3">
          {roadmap.modules.map((module, index) => {
             const isCompleted = progressState[`${roadmap.id}_${module.id}`]?.isCompleted || false;
             // Logic for "current": First incomplete module
             // or if all complete, none is current (or last one)
             // Simple logic: index === completedModules count (0-based index)
             const isCurrent = index === completedModules;

             return (
               <div key={module.id} className={cn(
                 "transition-all duration-300",
                 isCurrent && "translate-x-2"
               )}>
                 <ModuleCard
                   module={module}
                   roadmapId={roadmap.id}
                   isCompleted={isCompleted}
                   isCurrent={isCurrent}
                   // isLocked={isLocked} // Optional locking, disabled for now to allow free navigation
                 />
               </div>
             );
          })}
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <DeleteRoadmapDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={roadmap.title}
      />
    </div>
  );
}
