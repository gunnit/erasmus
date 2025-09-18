import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';

const MarkdownRenderer = ({ content, className = '' }) => {
  // Handle empty or null content
  if (!content) {
    return null;
  }

  // Custom components for markdown elements
  const components = {
    // Headings
    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-gray-900">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-3 text-gray-900">{children}</h4>,
    h5: ({ children }) => <h5 className="text-base font-medium mb-1 mt-2 text-gray-900">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-medium mb-1 mt-2 text-gray-900">{children}</h6>,

    // Paragraphs
    p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-800">{children}</p>,

    // Strong/Bold
    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,

    // Emphasis/Italic
    em: ({ children }) => <em className="italic">{children}</em>,

    // Lists
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-gray-800 leading-relaxed">{children}</li>,

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 italic bg-gray-50 rounded-r">
        {children}
      </blockquote>
    ),

    // Code
    code: ({ inline, children }) => {
      if (inline) {
        return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900">{children}</code>;
      }
      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <code className="text-sm font-mono">{children}</code>
        </pre>
      );
    },

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),

    // Horizontal rule
    hr: () => <hr className="my-6 border-gray-300" />,

    // Tables (if needed)
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-gray-200">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
    tbody: ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>,
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => (
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => <td className="px-4 py-2 text-sm text-gray-900">{children}</td>,
  };

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;