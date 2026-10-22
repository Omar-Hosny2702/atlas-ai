
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface WorkPanelProps {
  onBack: () => void;
}

const AGENT_URL = 'https://omaragent.minecraftunbreakable.workers.dev/agent';

export function WorkPanel({ onBack }: WorkPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-[#090b10] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Back to chat"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-sm font-semibold">Work</h1>
            <p className="text-xs text-white/45">
              OmarAgent workspace
            </p>
          </div>
        </div>

        <a
          href={AGENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Open separately <ExternalLink size={14} />
        </a>
      </header>

      <div className="border-b border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/55 sm:px-6">
        Sign-in may be required. If the workspace cannot load here, use “Open separately”.
      </div>

      <iframe
        src={AGENT_URL}
        title="OmarAgent Work workspace"
        className="min-h-0 w-full flex-1 border-0 bg-[#04060a]"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </section>
  );
}
