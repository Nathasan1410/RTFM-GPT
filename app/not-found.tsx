"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="border border-zinc-800 bg-zinc-950/50 p-12 rounded-sm max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
        <h1 className="text-4xl font-bold font-mono text-zinc-500 mb-2 tracking-widest">
          404
        </h1>
        <h2 className="text-xl font-semibold text-zinc-300 mb-6 uppercase tracking-wide">
          Page Not Found
        </h2>
        
        <p className="text-zinc-500 font-mono text-sm mb-8 leading-relaxed">
          The roadmap or module you are looking for does not exist. 
          It may have been deleted or the URL is incorrect.
        </p>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => router.push("/")} 
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" /> Return to Command Center
          </Button>
          
          <Button 
            onClick={() => router.back()} 
            variant="ghost"
            className="w-full text-zinc-500 hover:text-zinc-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
