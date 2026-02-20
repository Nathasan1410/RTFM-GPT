import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Roadmap, ProgressEntry } from '@/types/schemas';

const DB_NAME = 'rtfm-db';
const DB_VERSION = 1;

interface RTFMDB extends DBSchema {
  roadmaps: {
    key: string;
    value: Roadmap;
    indexes: { 'by-date': string };
  };
  progress: {
    key: string;
    value: ProgressEntry;
  };
}

let dbPromise: Promise<IDBPDatabase<RTFMDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<RTFMDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create roadmaps store
        if (!db.objectStoreNames.contains('roadmaps')) {
          const roadmapsStore = db.createObjectStore('roadmaps', { keyPath: 'id' });
          roadmapsStore.createIndex('by-date', 'createdAt');
        }

        // Create progress store
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { 
            // We'll use out-of-line keys for progress since the key is composite
            // and not strictly part of the object structure in a simple way
            // or we can just assume the key is passed when putting.
            // But let's follow the spec: "Key: Composite ${roadmapId}_${moduleId}"
          });
        }
      },
    });
  }
  return dbPromise;
};

export const db = {
  // Roadmaps
  async createRoadmap(roadmap: Roadmap) {
    const db = await getDB();
    return db.add('roadmaps', roadmap);
  },

  async getRoadmap(id: string) {
    const db = await getDB();
    return db.get('roadmaps', id);
  },

  async getAllRoadmaps() {
    const db = await getDB();
    return db.getAllFromIndex('roadmaps', 'by-date');
  },

  async deleteRoadmap(id: string) {
    const db = await getDB();
    const tx = db.transaction(['roadmaps', 'progress'], 'readwrite');
    
    // Delete roadmap
    await tx.objectStore('roadmaps').delete(id);
    
    // Delete related progress
    // Since we don't have an index on roadmapId for progress store, we have to iterate
    // This might be slow if there are many entries, but for this app it's fine.
    // Alternatively, we could add an index on roadmapId to progress store.
    // Let's iterate keys for now or add index if needed.
    // Actually, cursor is better.
    let cursor = await tx.objectStore('progress').openCursor();
    while (cursor) {
      if (cursor.key.toString().startsWith(`${id}_`)) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
    
    await tx.done;
  },

  // Progress
  async getProgress(roadmapId: string, moduleId: string) {
    const db = await getDB();
    const key = `${roadmapId}_${moduleId}`;
    return db.get('progress', key);
  },

  async getAllProgress() {
    const db = await getDB();
    return db.getAll('progress');
  },

  async updateProgress(entry: ProgressEntry) {
    const db = await getDB();
    const key = `${entry.roadmapId}_${entry.moduleId}`;
    
    const tx = db.transaction(['roadmaps', 'progress'], 'readwrite');
    
    // Update progress
    await tx.objectStore('progress').put(entry, key);
    
    // Update roadmap updatedAt
    const roadmap = await tx.objectStore('roadmaps').get(entry.roadmapId);
    if (roadmap) {
      roadmap.updatedAt = new Date().toISOString();
      await tx.objectStore('roadmaps').put(roadmap);
    }
    
    await tx.done;
  },

  // Import/Export
  async clearAll() {
    const db = await getDB();
    const tx = db.transaction(['roadmaps', 'progress'], 'readwrite');
    await tx.objectStore('roadmaps').clear();
    await tx.objectStore('progress').clear();
    await tx.done;
  },
  
  async importData(data: { roadmaps: Roadmap[], progress: Record<string, ProgressEntry> }) {
    const db = await getDB();
    const tx = db.transaction(['roadmaps', 'progress'], 'readwrite');
    
    // Clear existing
    await tx.objectStore('roadmaps').clear();
    await tx.objectStore('progress').clear();
    
    // Import roadmaps
    for (const roadmap of data.roadmaps) {
      await tx.objectStore('roadmaps').add(roadmap);
    }
    
    // Import progress
    for (const [key, entry] of Object.entries(data.progress)) {
      await tx.objectStore('progress').add(entry, key);
    }
    
    await tx.done;
  }
};
