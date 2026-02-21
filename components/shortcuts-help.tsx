"use client";

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <button 
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
            <Keyboard className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold font-mono text-zinc-100">Keyboard Shortcuts</h2>
        </div>

        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Global</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm font-mono text-zinc-400">
                    <div className="flex items-center justify-between mr-4">
                        <span>Command Palette</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">⌘K</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Show Help</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">?</kbd>
                    </div>
                    <div className="flex items-center justify-between mr-4">
                        <span>Go Home</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">G H</kbd>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Roadmap Overview</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm font-mono text-zinc-400">
                    <div className="flex items-center justify-between mr-4">
                        <span>Next Module</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">J</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Prev Module</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">K</kbd>
                    </div>
                    <div className="flex items-center justify-between mr-4">
                        <span>Select</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">Enter</kbd>
                    </div>
                     <div className="flex items-center justify-between">
                        <span>Delete</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">D</kbd>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Module Detail</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm font-mono text-zinc-400">
                    <div className="flex items-center justify-between mr-4">
                        <span>Toggle Complete</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">Space</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Next Module</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">N</kbd>
                    </div>
                     <div className="flex items-center justify-between mr-4">
                        <span>Prev Module</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">P</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Back to Roadmap</span>
                        <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-300">B</kbd>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
