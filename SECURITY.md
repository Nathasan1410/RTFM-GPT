# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within RTFM-GPT, please do not disclose it publicly.

We are a solo developer project, but we take security seriously. Please report any issues via GitHub Issues with the label `security` or contact the maintainer directly if possible.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Architecture & Security Model

RTFM-GPT is a client-side first application (Local-First).

### Data Privacy
- **Local Storage**: All user data (roadmaps, progress) is stored in the browser's IndexedDB. We do not have a backend database for user data.
- **AI Generation**: When generating a roadmap, your topic is sent to our API route, which then calls Cerebras AI. We do not store this data.
- **Exports**: Users are responsible for backing up their data via the JSON export feature.

### API Keys
- The `CEREBRAS_API_KEY` is stored in environment variables (`.env.local`) and is only accessible by the server-side API route (`/api/generate`). It is never exposed to the client bundle.

### Content Security Policy (CSP)
We implement strict CSP headers to prevent XSS and other injection attacks.
- `default-src 'self'`
- `script-src 'self'` (with unsafe-inline/eval for dev mode compatibility)
- `connect-src` restricted to self and necessary APIs.

### Input Validation
All user inputs are validated using Zod schemas with strict mode enabled to prevent prototype pollution and malformed data injection.
