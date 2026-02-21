"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, AlertTriangle, Check, Download, Key, Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { ExportDataSchema, ExportData, ProgressEntry } from "@/types/schemas";

const API_PROVIDERS = [
  { id: 'groq', name: 'Groq', placeholder: 'gsk_...', url: 'https://console.groq.com/keys', importance: 'crucial' as const },
  { id: 'cerebras', name: 'Cerebras', placeholder: 'csk-...', url: 'https://cloud.cerebras.ai/platform', importance: 'crucial' as const },
  { id: 'brave', name: 'Brave Search', placeholder: 'BSA...', url: 'https://api.search.brave.com/app/keys', importance: 'recommended' as const },
  { id: 'serper', name: 'Serper (Google)', placeholder: 'API Key...', url: 'https://serper.dev/api-key', importance: 'optional' as const },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // API Key State
  const apiKeys = useAppStore((state) => state.apiKeys);
  const setApiKey = useAppStore((state) => state.setApiKey);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [tempKeys, setTempKeys] = useState<Record<string, string>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, 'idle' | 'testing' | 'valid' | 'invalid'>>({});

  useEffect(() => {
    // Sync store keys to temp state on load
    setTempKeys(apiKeys as Record<string, string>);
  }, [apiKeys]);

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleKeyChange = (id: string, value: string) => {
    setTempKeys(prev => ({ ...prev, [id]: value }));
    setKeyStatus(prev => ({ ...prev, [id]: 'idle' }));
  };

  const saveKey = (id: string) => {
    const key = tempKeys[id];
    setApiKey(id as 'groq' | 'cerebras' | 'brave' | 'serper', key || undefined);
    // Visual feedback
    setKeyStatus(prev => ({ ...prev, [id]: 'valid' })); // Optimistic save
    setTimeout(() => setKeyStatus(prev => ({ ...prev, [id]: 'idle' })), 2000);
  };

  const clearKey = (id: string) => {
    if (confirm(`Remove ${id} API Key?`)) {
        setApiKey(id as 'groq' | 'cerebras' | 'brave' | 'serper', undefined);
        setTempKeys(prev => ({ ...prev, [id]: '' }));
    }
  };
  
  const initializeStore = useAppStore((state) => state.initialize);

  const handleExport = async () => {
    setIsExporting(true);
    try {
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
      } catch {
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
        // Clear local storage too
        localStorage.clear();
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
        <h1 className="text-3xl font-bold font-mono text-zinc-50 mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your API keys and local data.</p>
      </div>

      {/* API Keys Section */}
      <section className="border border-zinc-800 bg-zinc-900/30 p-8 rounded-sm space-y-6">
        <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
          <Key className="w-5 h-5 text-zinc-400" />
          <div>
            <h2 className="text-xl font-bold text-zinc-200">API Configuration</h2>
            <p className="text-sm text-zinc-500">
              Your keys are stored locally in your browser. They are never sent to our servers, only to the respective API providers.
            </p>
          </div>
        </div>

        {/* API Key Importance Guide */}
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-sm p-4 space-y-3">
          <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            API Key Importance Guide
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-bold min-w-[60px]">CRUCIAL:</span>
              <span className="text-zinc-400">
                <strong className="text-zinc-300">Groq or Cerebras</strong> - Required for roadmap generation and AI features. At least one must be set.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold min-w-[60px]">RECOMMENDED:</span>
              <span className="text-zinc-400">
                <strong className="text-zinc-300">Brave Search</strong> - Enhances chatbot with web search results. Highly recommended for better AI responses.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-zinc-500 font-bold min-w-[60px]">OPTIONAL:</span>
              <span className="text-zinc-400">
                <strong className="text-zinc-300">Serper (Google)</strong> - Alternative to Brave Search. Use if you prefer Google results.
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {API_PROVIDERS.map((provider) => {
            const importanceColors = {
              crucial: 'bg-red-500/10 text-red-400 border-red-500/20',
              recommended: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              optional: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
            };
            const importanceLabels = {
              crucial: 'CRUCIAL',
              recommended: 'RECOMMENDED',
              optional: 'OPTIONAL'
            };

            return (
              <div key={provider.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={provider.id} className="text-zinc-300 font-mono text-sm uppercase tracking-wide">
                      {provider.name}
                    </Label>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                      importanceColors[provider.importance]
                    )}>
                      {importanceLabels[provider.importance]}
                    </span>
                  </div>
                  <a 
                    href={provider.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Get Key <Download className="w-3 h-3 rotate-180" />
                  </a>
                </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={provider.id}
                    type={visibleKeys[provider.id] ? "text" : "password"}
                    placeholder={provider.placeholder}
                    value={tempKeys[provider.id] || ""}
                    onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                    className="pr-10 bg-zinc-950 border-zinc-800 focus:border-zinc-600 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility(provider.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {visibleKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <Button 
                  onClick={() => saveKey(provider.id)}
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "border border-zinc-700 transition-all",
                    keyStatus[provider.id] === 'valid' ? "bg-green-900/20 text-green-500 border-green-900" : ""
                  )}
                  title="Save Key"
                >
                   {keyStatus[provider.id] === 'valid' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                </Button>

                {apiKeys[provider.id as keyof typeof apiKeys] && (
                  <Button
                    onClick={() => clearKey(provider.id)}
                    variant="ghost"
                    size="icon"
                    className="text-zinc-500 hover:text-red-400"
                    title="Remove Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </section>

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
