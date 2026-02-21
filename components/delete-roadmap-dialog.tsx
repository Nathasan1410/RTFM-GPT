"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteRoadmapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export function DeleteRoadmapDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title 
}: DeleteRoadmapDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Lock scroll
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Unlock scroll
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={dialogRef}
        className="w-full max-w-md p-6 border border-zinc-800 bg-zinc-900 shadow-lg rounded-sm animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-4 mb-4 text-red-500">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-lg font-bold font-mono uppercase tracking-wide">Delete Roadmap</h2>
        </div>
        
        <p className="text-zinc-400 mb-2">
          Are you sure you want to delete <span className="text-zinc-200 font-mono font-bold">&quot;{title}&quot;</span>?
        </p>
        <p className="text-zinc-500 text-sm mb-6">
          This action cannot be undone. All progress and notes will be permanently lost.
        </p>

        <div className="flex items-center justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 hover:border-red-500"
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </div>
  );
}
