import React from 'react';

interface MarkdownProps {
  content: string;
}

export const Markdown = ({ content }: MarkdownProps) => {
  if (!content) return null;

  // Simple, ultra-clean markdown parser for the client that renders paragraphs,
  // bold text, inline code blocks, full code blocks, multi-level headers, and bullet lists.
  const lines = content.split('\n');

  let insideCodeBlock = false;
  let codeSnippet: string[] = [];
  let codeLanguage = '';

  const parsedElements = lines.map((line, idx) => {
    // 1. Code block handling
    if (line.trim().startsWith('```')) {
      if (insideCodeBlock) {
        insideCodeBlock = false;
        const compiledSnippet = codeSnippet.join('\n');
        codeSnippet = [];
        return (
          <div key={`code-${idx}`} className="my-3 border border-zinc-200 rounded overflow-hidden shadow-xs">
            <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{codeLanguage || 'plain-code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(compiledSnippet)}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-900 font-bold bg-white px-2 py-0.5 rounded border border-zinc-200 cursor-pointer transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="p-3 bg-zinc-900 text-zinc-100 text-xs overflow-x-auto font-mono select-all select-text leading-relaxed">
              <code>{compiledSnippet}</code>
            </pre>
          </div>
        );
      } else {
        insideCodeBlock = true;
        codeLanguage = line.trim().slice(3);
        return null;
      }
    }

    if (insideCodeBlock) {
      codeSnippet.push(line);
      return null;
    }

    // 2. Headers
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-zinc-800 font-sans font-extrabold text-xs tracking-wider uppercase mt-4 mb-2">
          {renderInlineFormatting(line.slice(4))}
        </h4>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-zinc-900 font-sans font-bold text-sm tracking-tight border-b border-dashed border-zinc-200 pb-1 mt-5 mb-2.5">
          {renderInlineFormatting(line.slice(3))}
        </h3>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h2 key={idx} className="text-zinc-950 font-sans font-extrabold text-base tracking-tight mt-6 mb-3">
          {renderInlineFormatting(line.slice(2))}
        </h2>
      );
    }

    // 3. Horizontal Rule
    if (line.trim() === '---') {
      return <hr key={idx} className="border-t border-zinc-200 my-4" />;
    }

    // 4. Bullet lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return (
        <li key={idx} className="text-zinc-700 text-xs ml-5 list-disc my-1.5 leading-relaxed pl-1">
          {renderInlineFormatting(line.trim().slice(2))}
        </li>
      );
    }

    // 5. Normal paragraphs (skip empty lines to maintain good spacing)
    if (line.trim() === '') {
      return <div key={idx} className="h-2" />;
    }

    return (
      <p key={idx} className="text-zinc-700 text-xs my-2 leading-relaxed">
        {renderInlineFormatting(line)}
      </p>
    );
  });

  return <div className="space-y-1 select-text selection:bg-zinc-100">{parsedElements}</div>;
};

/**
 * Handles bold **text** and inline `code` blocks
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentIdx = 0;

  // We pattern match across characters looking for ** and `
  const regex = /(\*\*|_|`)/g;
  let match;

  interface Token {
    type: 'bold' | 'code' | 'text';
    content: string;
  }

  const tokens: Token[] = [];
  let lastIndex = 0;
  let boldOpen = false;
  let codeOpen = false;

  while ((match = regex.exec(text)) !== null) {
    const precedingText = text.slice(lastIndex, match.index);
    if (precedingText) {
      tokens.push({ type: boldOpen ? 'bold' : codeOpen ? 'code' : 'text', content: precedingText });
    }

    if (match[0] === '**') {
      boldOpen = !boldOpen;
    } else if (match[0] === '`') {
      codeOpen = !codeOpen;
    } else {
      // Just plain text
      tokens.push({ type: 'text', content: match[0] });
    }
    lastIndex = regex.lastIndex;
  }

  const remainingText = text.slice(lastIndex);
  if (remainingText) {
    tokens.push({ type: boldOpen ? 'bold' : codeOpen ? 'code' : 'text', content: remainingText });
  }

  // Fallback in case string had no patterns
  if (tokens.length === 0) {
    return [text];
  }

  return tokens.map((token, tIdx) => {
    if (token.type === 'bold') {
      return <strong key={tIdx} className="font-bold text-zinc-900 select-text">{token.content}</strong>;
    }
    if (token.type === 'code') {
      return (
        <code
          key={tIdx}
          className="font-mono text-[11px] font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 px-1 py-0.5 rounded cursor-copy transition-colors select-all mx-0.5"
          onClick={() => navigator.clipboard.writeText(token.content)}
          title="Click to copy code block inline"
        >
          {token.content}
        </code>
      );
    }
    return <span key={tIdx} className="select-text">{token.content}</span>;
  });
}
