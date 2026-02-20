# Troubleshooting Runbook

This guide is intended for developers maintaining or extending RTFM-GPT.

## Issue 1: "AI Generation Failed"

**Symptoms**: User clicks "Generate", loader spins, then shows error.

**Checks**:
1.  **Network Tab**: Check the response from `/api/generate`.
    -   `500`: Server error (check server logs/Vercel logs).
    -   `429`: Rate limited by our API or Cerebras.
    -   `504`: Gateway timeout (Vercel has 10s limit on free tier, Cerebras might be slow).
2.  **API Key**: Verify `CEREBRAS_API_KEY` is set in the environment.
3.  **Credit Balance**: Check Cerebras dashboard for usage limits.

**Solutions**:
-   Retry with exponential backoff.
-   Check if the input topic is too complex (causing timeout).

## Issue 2: "Data Disappeared"

**Symptoms**: User opens app, roadmaps list is empty.

**Checks**:
1.  **Browser Storage**: Open DevTools -> Application -> IndexedDB -> `rtfm-db`. Is it empty?
2.  **Private Mode**: Did the user browse in Incognito? (IndexedDB is cleared on close).
3.  **Storage Quota**: Check if device storage is full.

**Recovery**:
-   If user has a JSON backup, use the Import feature in Settings.
-   If no backup, data is likely lost (Local-First architecture limitation).

## Issue 3: "Performance Lag"

**Symptoms**: Typing is slow, animations jitter.

**Checks**:
1.  **Lighthouse Audit**: Run a performance check.
2.  **React DevTools**: Check for unnecessary re-renders in `RoadmapPage`.
3.  **Large Lists**: Are there too many roadmaps? (We don't implement virtualization yet).

**Optimization**:
-   Archive/Delete old roadmaps.
-   Implement `react-window` for the roadmap list if it grows > 100 items.

## Issue 4: "PWA Not Installing"

**Symptoms**: "Add to Home Screen" not appearing.

**Checks**:
1.  **HTTPS**: PWA requires HTTPS (or localhost).
2.  **Manifest**: Verify `manifest.json` is valid and linked in `layout.tsx`.
3.  **Service Worker**: Verify `sw.js` is registered successfully in console.
