import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRendererImpl({
  content,
}: MarkdownRendererProps) {
  return (
    <div
      className="
        prose-atlas
        max-w-none

        [&>p]:mb-4
        [&>p:last-child]:mb-0

        [&>h1]:mb-4
        [&>h1]:mt-7
        [&>h1]:text-2xl
        [&>h1]:font-semibold
        [&>h1]:tracking-tight

        [&>h2]:mb-3
        [&>h2]:mt-7
        [&>h2]:text-xl
        [&>h2]:font-semibold
        [&>h2]:tracking-tight

        [&>h3]:mb-2
        [&>h3]:mt-5
        [&>h3]:text-base
        [&>h3]:font-semibold

        [&>ul]:mb-4
        [&>ul]:ml-5
        [&>ul]:list-disc
        [&>ul]:space-y-1.5

        [&>ol]:mb-4
        [&>ol]:ml-5
        [&>ol]:list-decimal
        [&>ol]:space-y-1.5

        [&_li]:pl-1

        [&>blockquote]:my-4
        [&>blockquote]:border-l-2
        [&>blockquote]:border-accent-500/50
        [&>blockquote]:pl-4
        [&>blockquote]:italic
        [&>blockquote]:text-muted-light
        dark:[&>blockquote]:text-muted-dark

        [&_strong]:font-semibold
        [&_strong]:text-ink
        dark:[&_strong]:text-paper

        [&_a]:text-accent-500
        [&_a]:underline
        [&_a]:underline-offset-2
        [&_a]:transition-opacity
        hover:[&_a]:opacity-75

        [&_hr]:my-6
        [&_hr]:border-black/[0.08]
        dark:[&_hr]:border-white/[0.08]

        [&_table]:my-5
        [&_table]:w-full
        [&_table]:border-collapse
        [&_table]:overflow-hidden
        [&_table]:text-sm

        [&_th]:border
        [&_th]:border-black/[0.08]
        [&_th]:bg-black/[0.03]
        [&_th]:px-3
        [&_th]:py-2
        [&_th]:text-left
        [&_th]:font-semibold

        dark:[&_th]:border-white/[0.08]
        dark:[&_th]:bg-white/[0.04]

        [&_td]:border
        [&_td]:border-black/[0.08]
        [&_td]:px-3
        [&_td]:py-2
        [&_td]:align-top

        dark:[&_td]:border-white/[0.08]

        [&_code:not(pre_code)]:rounded-md
        [&_code:not(pre_code)]:bg-black/[0.06]
        [&_code:not(pre_code)]:px-1.5
        [&_code:not(pre_code)]:py-0.5
        [&_code:not(pre_code)]:font-mono
        [&_code:not(pre_code)]:text-[0.9em]

        dark:[&_code:not(pre_code)]:bg-white/[0.08]
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const {
              className,
              children,
              ...rest
            } = props;

            const match =
              /language-(\w+)/.exec(
                className || ''
              );

            const isBlock =
              Boolean(match) ||
              String(children).includes('\n');

            if (isBlock) {
              return (
                <CodeBlock
                  language={
                    match?.[1] ?? ''
                  }
                  code={String(
                    children
                  ).replace(/\n$/, '')}
                />
              );
            }

            return (
              <code
                className={className}
                {...rest}
              >
                {children}
              </code>
            );
          },

          a(props) {
            return (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const MarkdownRenderer = memo(
  MarkdownRendererImpl,
  (prev, next) =>
    prev.content === next.content
);