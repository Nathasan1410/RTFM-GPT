import { create } from 'zustand';
import { AppState } from '@/types/store';
import { Roadmap, ProgressEntry } from '@/types/schemas';
import { db } from '@/lib/db';

// --- Store Implementation ---

interface AppStore extends AppState {
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => Promise<void>;
  saveModuleProgress: (roadmapId: string, moduleId: string, updates: Partial<ProgressEntry>) => Promise<void>;
}

export const useAppStore = create<AppStore>()((set, get) => ({
  roadmaps: {},
  progress: {},
  apiKeys: {},
  activeRoadmapId: null,
  isLoading: true, // Start loading by default until initialized
  error: null,

  // Actions
  initialize: async () => {
    try {
      const [roadmapsArr, progressArr] = await Promise.all([
        db.getAllRoadmaps(),
        db.getAllProgress(),
      ]);

      const roadmaps = roadmapsArr.reduce((acc, r) => ({ ...acc, [r.id]: r }), {} as Record<string, Roadmap>);
      const progress = progressArr.reduce((acc, p) => ({ ...acc, [`${p.roadmapId}_${p.moduleId}`]: p }), {} as Record<string, ProgressEntry>);

      // Load API keys from localStorage
      const apiKeys = {
        groq: localStorage.getItem('rtfm_api_groq') || undefined,
        cerebras: localStorage.getItem('rtfm_api_cerebras') || undefined,
        brave: localStorage.getItem('rtfm_api_brave') || undefined,
        serper: localStorage.getItem('rtfm_api_serper') || undefined,
      };

      set({ roadmaps, progress, apiKeys, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ error: 'Failed to load data', isLoading: false });
    }
  },

  addRoadmap: async (roadmap: Roadmap) => {
    try {
      await db.createRoadmap(roadmap);
      set((state) => ({
        roadmaps: {
          ...state.roadmaps,
          [roadmap.id]: roadmap,
        },
      }));
    } catch (error) {
      console.error('Failed to add roadmap:', error);
      set({ error: 'Failed to save roadmap' });
      throw error;
    }
  },

  deleteRoadmap: async (id: string) => {
    try {
      await db.deleteRoadmap(id);
      set((state) => {
        const newRoadmaps = { ...state.roadmaps };
        delete newRoadmaps[id];
        
        // Cleanup progress
        const newProgress = { ...state.progress };
        Object.keys(newProgress).forEach(key => {
          if (key.startsWith(`${id}_`)) {
            delete newProgress[key];
          }
        });

        return {
          roadmaps: newRoadmaps,
          progress: newProgress,
          activeRoadmapId: state.activeRoadmapId === id ? null : state.activeRoadmapId,
        };
      });
    } catch (error) {
      console.error('Failed to delete roadmap:', error);
      set({ error: 'Failed to delete roadmap' });
    }
  },

  setActiveRoadmap: (id: string | null) => {
    set({ activeRoadmapId: id });
  },

  setApiKey: (provider: 'groq' | 'cerebras' | 'brave' | 'serper', key: string | undefined) => {
    // Persist to localStorage
    if (key) {
      localStorage.setItem(`rtfm_api_${provider}`, key);
    } else {
      localStorage.removeItem(`rtfm_api_${provider}`);
    }

    set((state) => ({
      apiKeys: {
        ...state.apiKeys,
        [provider]: key,
      },
    }));
  },

  saveModuleProgress: async (roadmapId: string, moduleId: string, updates: Partial<ProgressEntry>) => {
    const key = `${roadmapId}_${moduleId}`;
    const state = get();
    const existing = state.progress[key] || {
      roadmapId,
      moduleId,
      isCompleted: false,
      completedAt: null,
      attempts: 0,
      verificationStatus: 'ACTIVE',
    };

    const entry: ProgressEntry = {
      ...existing,
      ...updates,
      // Ensure composite key parts are preserved
      roadmapId,
      moduleId,
    };

    try {
      await db.updateProgress(entry); // This updates DB
      set((state) => ({
        progress: {
          ...state.progress,
          [key]: entry,
        },
      }));
    } catch (error) {
      console.error('Failed to save progress:', error);
      set({ error: 'Failed to save progress' });
    }
  },

  toggleModuleCompletion: async (roadmapId: string, moduleId: string, isCompleted: boolean) => {
    const key = `${roadmapId}_${moduleId}`;
    const state = get();
    const existing = state.progress[key] || {
      roadmapId,
      moduleId,
      isCompleted: false,
      completedAt: null,
      attempts: 0,
      verificationStatus: 'ACTIVE',
    };

    const entry: ProgressEntry = {
      ...existing,
      isCompleted,
      completedAt: isCompleted ? (existing.completedAt || new Date().toISOString()) : null,
    };

    try {
      await db.updateProgress(entry);
      set((state) => ({
        progress: {
          ...state.progress,
          [key]: entry,
        },
      }));
      
      // Streak Logic
      if (isCompleted) {
        const today = new Date().toISOString().split('T')[0] || '';
        const lastStreakDate = localStorage.getItem('rtfm_last_streak_date');
        let currentStreak = parseInt(localStorage.getItem('rtfm_streak_count') || '0', 10);
        
        if (lastStreakDate !== today) {
           if (lastStreakDate) {
             const lastDate = new Date(lastStreakDate);
             const now = new Date();
             const diffTime = Math.abs(now.getTime() - lastDate.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
             
             if (diffDays <= 2) { 
               // 1 day difference (yesterday) or same day (handled by outer check but safe)
               // actually diffDays=1 means same day if calculated raw, but with day boundary logic:
               // simple check: if yesterday was last streak, increment.
               // Let's use simple logic:
               const yesterday = new Date();
               yesterday.setDate(yesterday.getDate() - 1);
               const yesterdayStr = yesterday.toISOString().split('T')[0];
               
               if (lastStreakDate === yesterdayStr) {
                 currentStreak++;
               } else {
                 currentStreak = 1; // Reset if gap > 1 day
               }
           } else {
             currentStreak = 1;
           }
        } else {
           // First time ever
           if (currentStreak === 0) currentStreak = 1;
        }
        
        localStorage.setItem('rtfm_streak_count', currentStreak.toString());
        localStorage.setItem('rtfm_last_streak_date', today);
        window.dispatchEvent(new Event('storage'));
      }
    }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
      set({ error: 'Failed to update progress' });
    }
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  // Computed (Selectors)
  getRoadmapProgress: (roadmapId: string) => {
    const state = get();
    const roadmap = state.roadmaps[roadmapId];
    if (!roadmap) return 0;

    const totalModules = roadmap.modules.length;
    if (totalModules === 0) return 0;

    let completedCount = 0;
    roadmap.modules.forEach(module => {
      const key = `${roadmapId}_${module.id}`;
      if (state.progress[key]?.isCompleted) {
        completedCount++;
      }
    });

    return Math.round((completedCount / totalModules) * 100);
  },
}));
