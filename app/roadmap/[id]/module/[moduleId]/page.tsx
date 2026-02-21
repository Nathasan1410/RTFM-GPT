"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ExternalLink, BookOpen, ChevronLeft, ChevronRight, Play, AlertTriangle, Lightbulb, Check, MessageSquare, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Roadmap, ModuleContent, ProgressEntry } from "@/types/schemas";
import { VerifyResponse } from "@/types/verify";

type ModuleWorkspaceProps = {
  roadmapId: string;
  moduleId: string;
  roadmap: Roadmap;
  currentModule: ModuleContent;
  isCompleted: boolean;
  initialUserCode: string;
  apiKeys: { groq?: string | undefined; cerebras?: string | undefined; brave?: string | undefined; serper?: string | undefined };
  toggleCompletion: (roadmapId: string, moduleId: string, isCompleted: boolean) => void;
  saveModuleProgress: (roadmapId: string, moduleId: string, updates: Partial<ProgressEntry>) => Promise<void>;
};

function ModuleWorkspace({
  roadmapId,
  moduleId,
  roadmap,
  currentModule,
  isCompleted,
  initialUserCode,
  apiKeys,
  toggleCompletion,
  saveModuleProgress,
}: ModuleWorkspaceProps) {
  const [userCode, setUserCode] = useState(initialUserCode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerifyResponse | null>(null);
  const [showGroundTruth, setShowGroundTruth] = useState(isCompleted);
  
  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    await saveModuleProgress(roadmapId, moduleId, { userCode });

    try {
      if (!currentModule.verificationCriteria || currentModule.verificationCriteria.length === 0) {
        setVerificationResult({
          status: "PASS",
          feedback: "No automated verification for this step. Self-verify based on instructions.",
        });
        await toggleCompletion(roadmap.id, currentModule.id, true);
        setIsVerifying(false);
        return;
      }

      const verifyHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKeys.groq) verifyHeaders["x-api-key-groq"] = apiKeys.groq;
      if (apiKeys.cerebras) verifyHeaders["x-api-key-cerebras"] = apiKeys.cerebras;

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: verifyHeaders,
        body: JSON.stringify({
          userCode,
          requirements: currentModule.verificationCriteria,
          topic: roadmap.topic,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification failed");

      setVerificationResult(data);

      if (data.status === "PASS") {
        await toggleCompletion(roadmap.id, currentModule.id, true);
        setShowGroundTruth(true);
      }
    } catch (err) {
      console.error(err);
      alert("Verification Error: " + (err as Error).message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      const chatHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKeys.groq) chatHeaders["x-api-key-groq"] = apiKeys.groq;
      if (apiKeys.cerebras) chatHeaders["x-api-key-cerebras"] = apiKeys.cerebras;
      if (apiKeys.brave) chatHeaders["x-api-key-brave"] = apiKeys.brave;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: chatHeaders,
        body: JSON.stringify({
          message: userMsg,
          context: {
            topic: roadmap.topic,
            moduleTitle: currentModule.title,
            moduleContext: currentModule.context,
            challenge: currentModule.challenge,
            userCode
          }
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 relative order-2 lg:order-2 flex flex-col">
      <div className="flex-1 p-6 lg:p-8 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-green-600/80 tracking-[0.2em] uppercase block">Challenge</span>
            {isCompleted && (
              <span className="text-xs font-mono text-green-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Solved
              </span>
            )}
          </div>
          <div className="border border-zinc-800 bg-zinc-900/20 p-6 rounded-sm relative overflow-hidden group">
            <div className={cn("absolute top-0 left-0 w-1 h-full transition-colors", isCompleted ? "bg-green-500" : "bg-zinc-700")} />
            <p className="text-zinc-200 font-mono text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {currentModule.challenge}
            </p>
          </div>
        </div>

        {/* Chatbot Toggle */}
        <div className="flex justify-end">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={cn(
                    "gap-2 border-zinc-700 text-zinc-400 hover:text-zinc-200",
                    isChatOpen && "bg-zinc-800 text-zinc-200"
                )}
            >
                <MessageSquare className="w-4 h-4" />
                {isChatOpen ? "Close Assistant" : "Ask for Help"}
            </Button>
        </div>

        {/* Chatbot Interface */}
        {isChatOpen && (
            <div className="border border-zinc-800 bg-zinc-900/30 rounded-sm overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Module Assistant (Hints Only)
                    </span>
                    <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                        Beta
                    </Badge>
                </div>
                <div className="h-64 overflow-y-auto p-4 space-y-4 bg-zinc-950/50">
                    {chatMessages.length === 0 ? (
                        <p className="text-sm text-zinc-600 text-center italic mt-20">
                            Stuck? Ask for a hint. I won&apos;t write code for you.
                        </p>
                    ) : (
                        chatMessages.map((msg, idx) => (
                            <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[80%] rounded-sm p-3 text-sm leading-relaxed",
                                    msg.role === 'user' 
                                        ? "bg-zinc-800 text-zinc-200" 
                                        : "bg-blue-950/20 border border-blue-900/30 text-blue-200"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}
                    {isChatLoading && (
                        <div className="flex justify-start">
                            <div className="bg-zinc-900/50 p-2 rounded-sm">
                                <span className="animate-pulse text-zinc-500 text-xs">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
                <form onSubmit={handleChatSubmit} className="p-3 border-t border-zinc-800 bg-zinc-900/30 flex gap-2">
                    <input 
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                        placeholder="Ask a question..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                    />
                    <Button type="submit" size="sm" disabled={isChatLoading || !chatInput.trim()} variant="secondary">
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 tracking-[0.2em] uppercase">Workspace</span>
            <div className="flex gap-2">
              {showGroundTruth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-zinc-400 hover:text-green-400"
                  onClick={() => setUserCode(currentModule.groundTruth || "")}
                >
                  Load Solution
                </Button>
              )}
            </div>
          </div>

          <div className="relative border border-zinc-800 rounded-sm bg-[#0d0d0d] font-mono text-sm">
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="// Write your code here..."
              className="w-full h-[300px] p-4 bg-transparent text-zinc-300 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700"
              spellCheck={false}
            />
            <div className="absolute bottom-4 right-4">
              <Button
                onClick={handleVerify}
                disabled={isVerifying || isCompleted}
                className={cn(
                  "font-mono font-bold tracking-wide uppercase transition-all",
                  isCompleted
                    ? "bg-green-900/20 text-green-500 border-green-900/50 hover:bg-green-900/30"
                    : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                )}
              >
                {isVerifying ? (
                  <>Verifying...</>
                ) : isCompleted ? (
                  <>
                    <Check className="w-4 h-4 mr-2" /> Verified
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" /> Verify Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {verificationResult && (
          <div
            className={cn(
              "p-4 rounded-sm border animate-in slide-in-from-bottom-2 space-y-4",
              verificationResult.status === "PASS"
                ? "bg-green-950/10 border-green-900/30 text-green-400"
                : verificationResult.status === "PARTIAL"
                ? "bg-yellow-950/10 border-yellow-900/30 text-yellow-400"
                : "bg-red-950/10 border-red-900/30 text-red-400"
            )}
          >
            <div className="flex items-start gap-3">
              {verificationResult.status === "PASS" ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : verificationResult.status === "PARTIAL" ? (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-yellow-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <h4 className="font-bold font-mono text-sm uppercase">
                  {verificationResult.status === "PASS" ? "Verification Passed" : verificationResult.status === "PARTIAL" ? "Verification Partial" : "Verification Failed"}
                </h4>
                <p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap">{verificationResult.feedback}</p>
              </div>
            </div>

            {verificationResult.checks && verificationResult.checks.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <div className="text-xs font-bold uppercase tracking-wider opacity-70">Detailed Checks</div>
                {verificationResult.checks.map((check, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-sm border text-sm",
                      check.status === "PASS"
                        ? "bg-green-950/20 border-green-900/30"
                        : check.status === "WARNING"
                        ? "bg-yellow-950/20 border-yellow-900/30"
                        : "bg-red-950/20 border-red-900/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {check.status === "PASS" ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : check.status === "WARNING" ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="font-mono font-bold text-xs uppercase">
                        {check.category === "lint" ? "Code Quality" : check.category === "type" ? "Type Safety" : "AI Review"}
                      </span>
                    </div>
                    <p className="text-xs opacity-90 mb-2">{check.message}</p>
                    {check.details && Array.isArray(check.details) && check.details.length > 0 && (
                      <div className="space-y-1">
                        {check.details.map((detail, j) => (
                          <div key={j} className="text-xs font-mono bg-black/30 p-2 rounded-sm opacity-80">
                            {typeof detail === "string" ? (
                              <span>{detail}</span>
                            ) : detail.line ? (
                              <span>
                                Line {detail.line}:{detail.column} - {detail.message} ({detail.ruleId || 'unknown'})
                              </span>
                            ) : (
                              <span>{JSON.stringify(detail)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {verificationResult.hints && verificationResult.hints.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                  <Lightbulb className="w-3 h-3" /> Hints
                </div>
                <ul className="list-disc list-inside text-sm space-y-1 opacity-90">
                  {verificationResult.hints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModulePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>
}) {
  const router = useRouter();

  // Unwrap params using React.use()
  const { id: roadmapId, moduleId } = use(params);

  const roadmaps = useAppStore((state) => state.roadmaps);
  const progressState = useAppStore((state) => state.progress);
  const toggleCompletion = useAppStore((state) => state.toggleModuleCompletion);
  const saveModuleProgress = useAppStore((state) => state.saveModuleProgress);
  const isLoading = useAppStore((state) => state.isLoading);
  const apiKeys = useAppStore((state) => state.apiKeys);

  const roadmap = roadmaps[roadmapId];
  const currentModule = roadmap?.modules.find((m) => m.id === moduleId);
  const progressEntry = progressState[`${roadmapId}_${moduleId}`];
  const isCompleted = progressEntry?.isCompleted || false;
  const initialUserCode = progressEntry?.userCode ?? currentModule?.starterCode ?? "";

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-zinc-500 font-mono">Loading module data...</div>;
  }

  if (!roadmap || !currentModule) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-mono text-zinc-500">Module Not Found</h1>
        <Button
          variant="link"
          onClick={() => router.push(roadmapId ? `/roadmap/${roadmapId}` : "/")}
          className="mt-4 text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Roadmap
        </Button>
      </div>
    );
  }

  // Navigation Logic
  const currentIndex = roadmap.modules.findIndex(m => m.id === moduleId);
  const prevModule = currentIndex > 0 ? roadmap.modules[currentIndex - 1] : null;
  const nextModule = currentIndex < roadmap.modules.length - 1 ? roadmap.modules[currentIndex + 1] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Breadcrumb / Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm font-mono text-zinc-500 overflow-hidden">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
            <span className="text-zinc-700">/</span>
            <Link href={`/roadmap/${roadmapId}`} className="hover:text-zinc-300 transition-colors truncate max-w-[150px]">{roadmap.title}</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200 truncate">{currentModule.title}</span>
        </div>
        
        <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider hidden sm:inline-block">
                Module {currentIndex + 1} of {roadmap.modules.length}
            </span>
             {isCompleted && (
                <Badge variant="default" className="bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-900/20">
                    <CheckCircle className="w-3 h-3 mr-1" /> Completed
                </Badge>
            )}
        </div>
      </header>

      {/* Split View Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Reference (Scrollable) */}
        <div className="w-full lg:w-[35%] overflow-y-auto border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950/30 order-1 lg:order-1 flex flex-col">
            <div className="p-6 space-y-8 flex-1">
                <div>
                    <span className="text-xs font-bold text-zinc-500 tracking-[0.2em] uppercase mb-2 block">Reference</span>
                    <h1 className="text-xl md:text-2xl font-bold text-zinc-50 font-mono mb-4 leading-tight">
                        {currentModule.title}
                    </h1>
                    
                    <div className="bg-zinc-900/50 border-l-2 border-zinc-700 p-4 rounded-r-sm mb-6">
                        <p className="text-zinc-300 leading-relaxed font-sans text-sm">
                            {currentModule.context}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-3 h-3" /> Documentation
                    </h3>
                    
                    {currentModule.docs && currentModule.docs.length > 0 ? (
                        currentModule.docs.map((doc, i) => (
                            <a 
                                key={i}
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="group block p-4 border border-zinc-800 rounded-sm hover:border-zinc-600 hover:bg-zinc-900/50 transition-all duration-200 relative overflow-hidden mb-3 last:mb-0" 
                            > 
                                <div className="flex items-start justify-between"> 
                                    <div className="space-y-1"> 
                                        <div className="text-sm font-semibold text-zinc-200 group-hover:text-white flex items-center gap-2"> 
                                            {doc.title || "Read Documentation"}
                                            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" /> 
                                        </div> 
                                        <div className="text-xs text-zinc-500 font-mono truncate max-w-[200px] whitespace-normal break-words"> 
                                            {doc.url} 
                                        </div> 
                                    </div> 
                                </div> 
                            </a> 
                        ))
                    ) : currentModule.docUrl ? (
                        // Legacy support for single docUrl
                        <a 
                            href={currentModule.docUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="group block p-4 border border-zinc-800 rounded-sm hover:border-zinc-600 hover:bg-zinc-900/50 transition-all duration-200 relative overflow-hidden" 
                        > 
                            <div className="flex items-start justify-between"> 
                                <div className="space-y-1"> 
                                    <div className="text-sm font-semibold text-zinc-200 group-hover:text-white flex items-center gap-2"> 
                                        READ THE MANUAL 
                                        <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" /> 
                                    </div> 
                                    <div className="text-xs text-zinc-500 font-mono truncate max-w-[200px] whitespace-normal break-words"> 
                                        {currentModule.docUrl} 
                                    </div> 
                                </div> 
                            </div> 
                        </a> 
                    ) : (
                        <p className="text-sm text-zinc-500 italic">No documentation links provided.</p>
                    )}
                </div>
            </div>
        </div> 

        <ModuleWorkspace
          key={`${roadmapId}_${moduleId}`}
          roadmapId={roadmapId}
          moduleId={moduleId}
          roadmap={roadmap}
          currentModule={currentModule}
          isCompleted={isCompleted}
          initialUserCode={initialUserCode}
          apiKeys={apiKeys}
          toggleCompletion={toggleCompletion}
          saveModuleProgress={saveModuleProgress}
        />
      </div> 

      {/* Footer Navigation */} 
      <footer className="border-t border-zinc-800 bg-zinc-950 p-4 shrink-0"> 
        <div className="max-w-7xl mx-auto flex items-center justify-between"> 
            <Button 
                variant="ghost" 
                disabled={!prevModule} 
                onClick={() => prevModule && router.push(`/roadmap/${roadmapId}/module/${prevModule.id}`)} 
                className="text-zinc-400 hover:text-zinc-200" 
            > 
                <ChevronLeft className="w-4 h-4 mr-2" /> 
                <span className="hidden sm:inline">Previous Module</span> 
                <span className="sm:hidden">Prev</span> 
            </Button> 

            <div className="flex gap-1"> 
                {roadmap.modules.map((m, idx) => ( 
                    <div 
                        key={m.id} 
                        className={cn( 
                            "w-8 h-1 rounded-full transition-colors", 
                            idx === currentIndex ? "bg-zinc-200" : 
                            progressState[`${roadmapId}_${m.id}`]?.isCompleted ? "bg-green-900" : "bg-zinc-800" 
                        )} 
                    /> 
                ))} 
            </div> 

            <Button 
                variant={isCompleted && nextModule ? "default" : "outline"} 
                disabled={!nextModule} 
                onClick={() => nextModule && router.push(`/roadmap/${roadmapId}/module/${nextModule.id}`)} 
                className={cn( 
                    "min-w-[120px]", 
                    isCompleted && nextModule ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-300" : "text-zinc-400 border-zinc-700" 
                )} 
            > 
                <span className="hidden sm:inline">Next Module</span> 
                <span className="sm:hidden">Next</span> 
                <ChevronRight className="w-4 h-4 ml-2" /> 
            </Button> 
        </div> 
      </footer> 
    </div> 
  ); 
}
