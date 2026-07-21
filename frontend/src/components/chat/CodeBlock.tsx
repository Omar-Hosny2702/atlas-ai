import { useState, type ReactNode } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface CodeBlockProps {
  language: string;
  code: string;
}

function InlineCode({ children }: { children: ReactNode }) {
  return <code>{children}</code>;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API can be blocked (permissions, insecure context) — fail silently,
      // the user can still select and copy the text manually.
    }
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-paper-alt dark:bg-ink-raised text-xs font-mono text-muted-light dark:text-muted-dark">
        <span>{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-border-light/60 dark:hover:bg-ink-alt transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.85em',
          padding: '0.9em 1em',
          background: theme === 'dark' ? '#12161d' : '#1e2128',
        }}
        wrapLongLines
      >
        {code.replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
}

export { InlineCode };
