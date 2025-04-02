import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  console.log("MarkdownRenderer rendering with content:", content);
  
  return (
    <div className={cn('w-full markdown-content prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-6 mb-4 first:mt-0 border-b pb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-5 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium mt-4 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed my-2 text-foreground">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc ml-4 text-sm my-2 space-y-1.5 marker:text-muted-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-4 text-sm my-2 space-y-1.5 marker:text-muted-foreground">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-foreground">{children}</li>
          ),
          table: ({ children }) => (
            <div className="my-4 w-full overflow-x-auto">
              <table className="min-w-full border-collapse border border-border divide-y divide-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border bg-background">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="divide-x divide-border">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-medium text-muted-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-foreground">{children}</td>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className?.includes('language-');
            return isInline ? (
              <code className="bg-muted rounded px-1.5 py-0.5 text-sm font-mono text-foreground" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 relative">
                <code className="text-sm font-mono block text-foreground" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-sm text-muted-foreground">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">{children}</em>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-4" />
          ),
          hr: () => (
            <hr className="my-6 border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};