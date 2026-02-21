"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { 
  Search, 
  Terminal, 
  Settings, 
  HelpCircle, 
  History
} from "lucide-react";
import { db } from "@/lib/db";
import { Roadmap } from "@/types/schemas";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [recentRoadmaps, setRecentRoadmaps] = useState<Roadmap[]>([]);
  
  // Toggle with Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch recent roadmaps when opening
  useEffect(() => {
    if (open) {
      db.getAllRoadmaps().then((roadmaps) => {
        // Sort by updated (desc) and take top 5
        const sorted = roadmaps.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ).slice(0, 5);
        setRecentRoadmaps(sorted);
      });
    }
  }, [open]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <Command label="Command Menu" className="w-full">
          <div className="flex items-center border-b border-zinc-800 px-4">
            <Search className="w-4 h-4 text-zinc-500 mr-2" />
            <Command.Input 
              placeholder="Type a command or search..." 
              className="flex-1 h-12 bg-transparent text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-zinc-500 font-mono">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2 px-2">
              <Command.Item 
                onSelect={() => handleSelect(() => {
                    router.push("/");
                })}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-zinc-300 aria-selected:bg-zinc-900 aria-selected:text-zinc-100 cursor-pointer transition-colors"
              >
                <Terminal className="w-4 h-4" />
                <span>Generate New Roadmap</span>
              </Command.Item>
              
              <Command.Item 
                onSelect={() => handleSelect(() => router.push("/settings"))}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-zinc-300 aria-selected:bg-zinc-900 aria-selected:text-zinc-100 cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Go to Settings</span>
              </Command.Item>
              
              <Command.Item 
                onSelect={() => handleSelect(() => {
                   // Dispatch help event
                   window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true }));
                })}
                className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-zinc-300 aria-selected:bg-zinc-900 aria-selected:text-zinc-100 cursor-pointer transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Show Shortcuts Help</span>
              </Command.Item>
            </Command.Group>

            {recentRoadmaps.length > 0 && (
              <Command.Group heading="Recent Roadmaps" className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2 mt-4 px-2">
                {recentRoadmaps.map((roadmap) => (
                  <Command.Item 
                    key={roadmap.id}
                    onSelect={() => handleSelect(() => router.push(`/roadmap/${roadmap.id}`))}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-sm text-sm text-zinc-300 aria-selected:bg-zinc-900 aria-selected:text-zinc-100 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <History className="w-4 h-4 text-zinc-600" />
                      <span className="truncate">{roadmap.title}</span>
                    </div>
                    <span className="text-xs text-zinc-600 font-mono hidden group-aria-selected:inline-block">
                        Open
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t border-zinc-800 px-4 py-2 flex items-center justify-between text-[10px] text-zinc-600 font-mono">
            <div className="flex gap-2">
                <span className="flex items-center gap-1"><kbd className="bg-zinc-900 px-1 rounded border border-zinc-800">↑↓</kbd> to navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-zinc-900 px-1 rounded border border-zinc-800">↵</kbd> to select</span>
            </div>
            <span className="flex items-center gap-1"><kbd className="bg-zinc-900 px-1 rounded border border-zinc-800">esc</kbd> to close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
