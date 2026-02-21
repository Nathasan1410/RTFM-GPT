"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Download, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { ExportData, ProgressEntry } from "@/types/schemas";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Log the error to console for development
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  const handleEmergencyExport = async () => {
    setIsExporting(true);
    try {
      // Attempt direct DB read
      const roadmaps = await db.getAllRoadmaps();
      const progressArr = await db.getAllProgress();
      
      const progress = progressArr.reduce((acc, p) => ({ 
        ...acc, 
        [`${p.roadmapId}_${p.moduleId}`]: p 
      }), {} as Record<string, ProgressEntry>);

      const data: ExportData = {
        version: "1.0",
        roadmaps,
        progress,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rtfm-emergency-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Emergency export failed:", err);
      alert("Failed to export data. The database might be inaccessible.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-center">
      <div className="w-full max-w-lg border border-red-500/30 bg-red-500/5 p-8 rounded-sm animate-in fade-in duration-300">
        <div className="flex items-center justify-center mb-6 text-red-500">
          <AlertTriangle className="w-12 h-12" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold font-mono text-red-500 tracking-wide uppercase mb-4">
          Application Error
        </h1>
        
        <p className="text-zinc-400 mb-6 font-mono text-sm leading-relaxed">
          Something went wrong. We&apos;ve caught the error to prevent a total crash.
          Your data is safe in local storage.
        </p>

        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm mb-8 text-left overflow-auto max-h-40">
          <p className="text-xs font-mono text-red-400 break-words whitespace-pre-wrap">
            {error.message || "Unknown error occurred"}
          </p>
          {error.stack && (
            <pre className="text-[10px] text-zinc-600 mt-2 whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={() => reset()} 
            variant="outline"
            className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          
          <Button 
            onClick={handleEmergencyExport} 
            disabled={isExporting}
            variant="outline"
            className="w-full sm:w-auto border-amber-900/50 text-amber-500 hover:bg-amber-950/20 hover:text-amber-400"
          >
            <Download className="w-4 h-4 mr-2" /> 
            {isExporting ? "Exporting..." : "Emergency Export"}
          </Button>

          <Button 
            onClick={() => window.location.href = "/"} 
            variant="ghost"
            className="w-full sm:w-auto text-zinc-500 hover:text-zinc-300"
          >
            <Home className="w-4 h-4 mr-2" /> Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
