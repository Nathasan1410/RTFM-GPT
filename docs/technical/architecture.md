# Architecture

RTFM-GPT follows a **Local-First** architecture.

## Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **State Management**: Zustand (Global Store)
-   **Database**: IndexedDB (via `idb` wrapper)
-   **Styling**: Tailwind CSS
-   **AI**: Cerebras Cloud SDK (Llama 3.3 70B)
-   **Validation**: Zod

## Data Flow

```
[User Input] -> [Next.js API Route] -> [Cerebras AI] -> [JSON Response]
                      |
                      v
                [Zod Validation]
                      |
                      v
                [IndexedDB (Client)] <-> [Zustand Store] <-> [React Components]
```

## Database Schema

### `roadmaps` Store
-   **Key**: `id` (string, nanoid)
-   **Value**:
    ```typescript
    interface Roadmap {
      id: string;
      title: string;
      topic: string;
      modules: Module[];
      createdAt: string;
      updatedAt: string;
    }
    ```

### `progress` Store
-   **Key**: `${roadmapId}_${moduleId}`
-   **Value**:
    ```typescript
    interface ProgressEntry {
      roadmapId: string;
      moduleId: string;
      isCompleted: boolean;
      completedAt: string | null;
    }
    ```
