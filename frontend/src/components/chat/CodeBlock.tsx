import {
  useState,
  type ReactNode,
} from 'react';

import {
  PrismLight as SyntaxHighlighter,
} from 'react-syntax-highlighter';

import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';

import {
  Check,
  Copy,
} from 'lucide-react';

SyntaxHighlighter.registerLanguage(
  'javascript',
  javascript
);

SyntaxHighlighter.registerLanguage(
  'typescript',
  typescript
);

SyntaxHighlighter.registerLanguage(
  'jsx',
  jsx
);

SyntaxHighlighter.registerLanguage(
  'tsx',
  tsx
);

SyntaxHighlighter.registerLanguage(
  'python',
  python
);

SyntaxHighlighter.registerLanguage(
  'bash',
  bash
);

SyntaxHighlighter.registerLanguage(
  'json',
  json
);

SyntaxHighlighter.registerLanguage(
  'css',
  css
);

SyntaxHighlighter.registerLanguage(
  'markup',
  markup
);

SyntaxHighlighter.registerLanguage(
  'sql',
  sql
);

SyntaxHighlighter.registerLanguage(
  'java',
  java
);

SyntaxHighlighter.registerLanguage(
  'c',
  c
);

SyntaxHighlighter.registerLanguage(
  'cpp',
  cpp
);

SyntaxHighlighter.registerLanguage(
  'csharp',
  csharp
);

SyntaxHighlighter.registerLanguage(
  'go',
  go
);

SyntaxHighlighter.registerLanguage(
  'rust',
  rust
);

const languageAliases: Record<
  string,
  string
> = {
  js: 'javascript',
  javascript: 'javascript',

  ts: 'typescript',
  typescript: 'typescript',

  jsx: 'jsx',
  tsx: 'tsx',

  py: 'python',
  python: 'python',

  sh: 'bash',
  shell: 'bash',
  bash: 'bash',
  zsh: 'bash',

  json: 'json',

  css: 'css',

  html: 'markup',
  xml: 'markup',
  markup: 'markup',

  sql: 'sql',

  java: 'java',

  c: 'c',

  cpp: 'cpp',
  'c++': 'cpp',

  cs: 'csharp',
  csharp: 'csharp',

  go: 'go',
  golang: 'go',

  rust: 'rust',
  rs: 'rust',
};

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

  const normalizedLanguage =
    languageAliases[
      language
        .trim()
        .toLowerCase()
    ];

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
          normalizedLanguage
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