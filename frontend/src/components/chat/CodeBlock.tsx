import {
  useState,
  type ReactNode,
} from 'react';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import {
  Check,
  Copy,
} from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

function InlineCode({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <code>
      {children}
    </code>
  );
}

export function CodeBlock({
  language,
  code,
}: CodeBlockProps) {
  const [copied, setCopied] =
    useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        1600
      );
    } catch {
      // User can still select and copy manually.
    }
  };

  return (
    <div
      className="
        my-5
        overflow-hidden
        rounded-2xl
        border border-black/[0.08]
        bg-[#11141a]
        shadow-sm
        dark:border-white/[0.09]
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          border-b border-white/[0.07]
          bg-[#171a21]
          px-4
          py-2.5
        "
      >
        <span
          className="
            font-mono
            text-[11px]
            font-medium
            uppercase
            tracking-wide
            text-white/45
          "
        >
          {language || 'text'}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            px-2
            py-1.5
            text-xs
            text-white/55
            transition
            hover:bg-white/[0.07]
            hover:text-white
          "
        >
          {copied ? (
            <Check size={13} />
          ) : (
            <Copy size={13} />
          )}

          {copied
            ? 'Copied'
            : 'Copy'}
        </button>
      </div>

      <SyntaxHighlighter
        language={
          language || 'text'
        }
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.86em',
          lineHeight: '1.65',
          padding: '1.1em 1.2em',
          background:
            '#11141a',
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
        }}
        wrapLongLines
      >
        {code.replace(
          /\n$/,
          ''
        )}
      </SyntaxHighlighter>
    </div>
  );
}

export { InlineCode };