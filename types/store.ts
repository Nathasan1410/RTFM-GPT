import { Roadmap, ProgressEntry } from './schemas';

export interface AppState {
  roadmaps: Record<string, Roadmap>; // Normalized by ID for easier access
  progress: Record<string, ProgressEntry>; // Key: `${roadmapId}_${moduleId}`
  apiKeys: {
    groq?: string | undefined;
    cerebras?: string | undefined;
    brave?: string | undefined;
    serper?: string | undefined;
  };
  activeRoadmapId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  addRoadmap: (roadmap: Roadmap) => void;
  deleteRoadmap: (id: string) => void;
  setActiveRoadmap: (id: string | null) => void;
  setApiKey: (provider: 'groq' | 'cerebras' | 'brave' | 'serper', key: string | undefined) => void;
  toggleModuleCompletion: (roadmapId: string, moduleId: string, isCompleted: boolean) => void;
  
  // Computed (Selectors)
  getRoadmapProgress: (roadmapId: string) => number;
}
