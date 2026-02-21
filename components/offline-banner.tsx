"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top-full duration-300",
      "bg-amber-950/20 backdrop-blur-sm border-b border-amber-500/30 text-amber-500",
      "flex items-center justify-center gap-3 px-4 py-2 font-mono text-xs sm:text-sm"
    )}>
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        You are offline. Your data is safe locally. Reconnect to generate new roadmaps.
      </span>
    </div>
  );
}
