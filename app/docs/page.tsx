import { Book, Github, ArrowRight, Zap, Brain, Target } from 'lucide-react';
import Link from 'next/link';

const docs = [
  {
    category: 'User Guide',
    icon: Book,
    pages: [
      { title: 'Getting Started', href: '#getting-started', description: 'Quick setup and your first roadmap' },
      { title: 'The Workflow', href: '#workflow', description: 'How to use RTFM-GPT effectively' },
      { title: 'Keyboard Shortcuts', href: '#shortcuts', description: 'Speed up your workflow' },
    ],
  },
  {
    category: 'Technical',
    icon: Zap,
    pages: [
      { title: 'Architecture', href: '#architecture', description: 'System design and components' },
      { title: 'API Reference', href: '#api-reference', description: 'Available endpoints and usage' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-6 space-y-16">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold font-mono text-zinc-50">Documentation</h1>
        <p className="text-lg text-zinc-400 max-w-2xl">
          Read The F*cking Manual. This project is built on the philosophy of <span className="text-zinc-200 font-mono">&ldquo;Curating Ignorance&rdquo;</span> - telling you *what* to learn, but forcing you to read the official documentation for the *how*.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="border border-zinc-800 bg-zinc-900/30 p-6 rounded-sm space-y-4">
          <Target className="w-8 h-8 text-red-400" />
          <h3 className="font-bold text-zinc-200">Curating Ignorance</h3>
          <p className="text-sm text-zinc-500">Telling you *what* to learn, not *how*.</p>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/30 p-6 rounded-sm space-y-4">
          <Zap className="w-8 h-8 text-amber-400" />
          <h3 className="font-bold text-zinc-200">Forcing References</h3>
          <p className="text-sm text-zinc-500">Linking directly to official docs.</p>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/30 p-6 rounded-sm space-y-4">
          <Brain className="w-8 h-8 text-blue-400" />
          <h3 className="font-bold text-zinc-200">Active Recall</h3>
          <p className="text-sm text-zinc-500">Challenging you to implement concepts.</p>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold font-mono text-zinc-50">Documentation</h2>
        
        {docs.map((section) => (
          <div key={section.category} className="border border-zinc-800 bg-zinc-900/30 p-6 rounded-sm space-y-4">
            <div className="flex items-center gap-3">
              <section.icon className="w-5 h-5 text-zinc-400" />
              <h3 className="text-lg font-bold text-zinc-200">{section.category}</h3>
            </div>
            
            <div className="grid gap-3">
              {section.pages.map((page) => (
                <Link
                  key={page.title}
                  href={page.href}
                  className="group flex items-start justify-between p-4 border border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800/30 hover:border-zinc-700 rounded-sm transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="font-mono text-sm text-zinc-200 group-hover:text-white transition-colors">
                      {page.title}
                    </h4>
                    <p className="text-xs text-zinc-500">{page.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border border-zinc-800 bg-zinc-900/30 p-6 rounded-sm space-y-4">
        <h3 className="font-bold text-zinc-200">Getting Started</h3>
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            RTFM-GPT requires API keys to function. Before creating your first roadmap:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-400">
            <li>
              Go to <Link href="/settings" className="text-blue-400 hover:text-blue-300">Settings</Link> and configure your API keys
            </li>
            <li>
              At minimum, add either <span className="font-mono text-zinc-200">Groq</span> or <span className="font-mono text-zinc-200">Cerebras</span> API key
            </li>
            <li>
              Add <span className="font-mono text-zinc-200">Brave Search</span> API key for enhanced chatbot responses
            </li>
            <li>
              Navigate to the home page and create your first roadmap
            </li>
          </ol>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-sm transition-colors"
          >
            Open Settings
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-8 border-t border-zinc-800">
        <Github className="w-5 h-5 text-zinc-500" />
        <a
          href="https://github.com/Nathasan1410/RTFM-GPT"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
}
