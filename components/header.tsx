"use client";

import { useEffect, useState } from "react"
import Link from "next/link"
import { Settings, HelpCircle, Menu, Flame, Book } from "lucide-react"
import { Button } from "./ui/button"

export function Header() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Initial load
    const count = parseInt(localStorage.getItem('rtfm_streak_count') || '0', 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStreak(count);

    // Listen for storage events (from other tabs or store updates)
    const handleStorage = () => {
      const newCount = parseInt(localStorage.getItem('rtfm_streak_count') || '0', 10);
      setStreak(newCount);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md h-14">
      <div className="container flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span className="text-lg font-bold font-mono text-green-500">RTFM</span>
            <span className="text-xs text-muted-foreground font-mono">v1.0</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-sm mr-2 animate-in fade-in duration-500">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
              <span className="text-xs font-mono font-bold text-zinc-300">{streak} day{streak > 1 ? 's' : ''}</span>
            </div>
          )}

          <Link href="/docs">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Book className="h-5 w-5" />
              <span className="sr-only">Documentation</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true }))}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
          
          <div className="md:hidden">
             <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
