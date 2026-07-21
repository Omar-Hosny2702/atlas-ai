import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRendererImpl({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-atlas">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const isBlock = Boolean(match) || String(children).includes('\n');

            if (isBlock) {
              return (
                <CodeBlock
                  language={match?.[1] ?? ''}
                  code={String(children).replace(/\n$/, '')}
                />
              );
            }
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },
          a(props) {
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Markdown re-parsing on every streamed token is the single most expensive
// thing this app does; memoize on content so unrelated parent re-renders
// (e.g. sibling messages, sidebar updates) don't retrigger it.
export const MarkdownRenderer = memo(MarkdownRendererImpl, (prev, next) => prev.content === next.content);
