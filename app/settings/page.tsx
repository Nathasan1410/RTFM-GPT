"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Trash2, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { ExportDataSchema, ExportData } from "@/types/schemas";

export default function SettingsPage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const initializeStore = useAppStore((state) => state.initialize);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const roadmaps = await db.getAllRoadmaps();
      const progressArr = await db.getAllProgress();
      
      const progress = progressArr.reduce((acc, p) => ({ 
        ...acc, 
        [`${p.roadmapId}_${p.moduleId}`]: p 
      }), {} as Record<string, any>);

      const data: ExportData = {
        version: "1.0",
        roadmaps,
        progress,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rtfm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      const text = await file.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        throw new Error("Invalid JSON file");
      }

      const result = ExportDataSchema.safeParse(json);
      if (!result.success) {
        throw new Error("Invalid data structure or version mismatch");
      }

      const data = result.data;
      
      if (confirm(`This will replace all current data with ${data.roadmaps.length} roadmaps. Continue?`)) {
        await db.importData(data);
        await initializeStore(); // Reload store
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Import failed:", error);
      setImportError((error as Error).message);
    } finally {
      setIsImporting(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDeleteAll = async () => {
    if (confirm("Are you absolutely sure? This will delete ALL roadmaps and progress permanently. This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await db.clearAll();
        await initializeStore();
        router.push("/");
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete data");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-6 space-y-12">
      <div>
        <h1 className="text-3xl font-bold font-mono text-zinc-50 mb-2">Data Management</h1>
        <p className="text-zinc-400">Manage your local data. You are in full control.</p>
      </div>

      {/* Export Section */}
      <section className="border border-zinc-800 bg-zinc-900/30 p-8 rounded-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-200 mb-2 flex items-center gap-2">
              <Download className="w-5 h-5" /> Backup Data
            </h2>
            <p className="text-sm text-zinc-500 max-w-md">
              Download all your roadmaps and progress as a JSON file. 
              Keep this safe if you want to migrate to another device.
            </p>
          </div>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800"
          >
            {isExporting ? "Exporting..." : "Export to JSON"}
          </Button>
        </div>
      </section>

      {/* Import Section */}
      <section className="border border-zinc-800 bg-zinc-900/30 p-8 rounded-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-200 mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5" /> Restore Data
            </h2>
            <p className="text-sm text-zinc-500 max-w-md mb-4">
              Restore from a backup file. 
              <span className="text-amber-500 block mt-1 font-medium">
                Warning: This will replace all current data.
              </span>
            </p>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
                id="import-file"
              />
              <label 
                htmlFor="import-file"
                className={cn(
                  "inline-flex items-center justify-center rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-10 px-4 py-2 cursor-pointer"
                )}
              >
                {isImporting ? "Importing..." : "Select Backup File"}
              </label>
            </div>

            {importError && (
              <p className="text-red-500 text-sm mt-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {importError}
              </p>
            )}
            {importSuccess && (
              <p className="text-green-500 text-sm mt-3 flex items-center gap-2">
                <Check className="w-4 h-4" /> Data restored successfully
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="border border-red-900/30 bg-red-950/5 p-8 rounded-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h2>
            <p className="text-sm text-red-400/70 max-w-md">
              Permanently delete all roadmaps and progress. 
              This action cannot be undone.
            </p>
          </div>
          <Button 
            onClick={handleDeleteAll} 
            disabled={isDeleting}
            variant="destructive"
            className="bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40"
          >
            {isDeleting ? "Deleting..." : "Delete All Data"}
          </Button>
        </div>
      </section>
    </div>
  );
}
