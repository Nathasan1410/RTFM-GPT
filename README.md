# RTFM-GPT | Read The F*cking Manual

![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

> **Curating Ignorance.**

Most developers rely too heavily on tutorials and StackOverflow copy-pasting. This hinders deep understanding. **RTFM-GPT** is an AI-powered learning platform that generates structured roadmaps and forces you to read official documentation. No spoon-feeding. No tutorials. Just you and the manual.

## Quick Start

1.  **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/rtfm-gpt.git
    cd rtfm-gpt
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

## The Workflow

1.  **Generate**: Enter a topic you want to master.
2.  **Read**: Click the link. Read the official documentation.
3.  **Challenge**: Solve the challenge based *only* on what you read.
4.  **Complete**: Mark it as done.

## Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **Styling**: Tailwind CSS (Brutalist Design System)
-   **State Management**: Zustand + IndexedDB (Local-first)
-   **AI**: Cerebras Cloud SDK (Llama 3.3 70B)
-   **PWA**: Offline-first architecture

## Data Privacy

RTFM-GPT follows a **Local-First** architecture. All your roadmaps and progress are stored locally in your browser (IndexedDB). We do not store your data on our servers.

## Documentation

For full documentation, run:

```bash
npm run docs
```

Then visit `http://localhost:3001`.

## License

MIT © 2024 Nathanael Santoso
