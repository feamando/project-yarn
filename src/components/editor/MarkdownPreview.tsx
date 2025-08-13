// Enhanced Markdown Preview with Mermaid Support
// Task 3.3.2: Implement Mermaid.js Diagramming
// 
// Markdown preview component that detects and renders Mermaid diagrams

import React, { useMemo } from 'react';
import { MermaidDiagram } from './MermaidDiagram';
import { replaceMermaidBlocks, validateMermaidSyntax } from '../../utils/markdownParser';
import { YarnLogo } from '../yarn-logo';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  className = '',
}) => {
  // Parse and process Mermaid blocks
  const { processedContent, mermaidBlocks } = useMemo(() => {
    if (!content.trim()) {
      return { processedContent: '', mermaidBlocks: [] };
    }

    // Extract Mermaid blocks and replace with placeholders
    const { processedMarkdown, mermaidBlocks } = replaceMermaidBlocks(
      content,
      (block) => `<div class="mermaid-placeholder" data-mermaid-id="${block.id}"></div>`
    );

    return {
      processedContent: processedMarkdown,
      mermaidBlocks
    };
  }, [content]);

  // Convert markdown to HTML (basic implementation)
  const htmlContent = useMemo(() => {
    return convertMarkdownToHtml(processedContent);
  }, [processedContent]);

  // Render the preview with Mermaid diagrams
  const renderContent = () => {
    if (!htmlContent) {
      return (
        <div className="text-muted-foreground text-center py-8">
          <p>Start writing to see preview...</p>
        </div>
      );
    }

    // Split HTML content by Mermaid placeholders and render accordingly
    const parts = htmlContent.split(/<div class="mermaid-placeholder" data-mermaid-id="([^"]+)"><\/div>/g);
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular HTML content
        if (parts[i].trim()) {
          elements.push(
            <div
              key={`html-${i}`}
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: parts[i] }}
            />
          );
        }
      } else {
        // Mermaid diagram placeholder - replace with actual diagram
        const mermaidId = parts[i];
        const mermaidBlock = mermaidBlocks.find(block => block.id === mermaidId);
        
        if (mermaidBlock) {
          const validation = validateMermaidSyntax(mermaidBlock.code);
          
          elements.push(
            <div key={`mermaid-${i}`} className="my-6">
              {validation.isValid ? (
                <MermaidDiagram
                  code={mermaidBlock.code}
                  className="w-full"
                />
              ) : (
                <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                  <div className="text-destructive font-medium mb-2">
                    Invalid Mermaid Diagram
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {validation.error}
                  </div>
                  <details>
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      View Source
                    </summary>
                    <pre className="mt-2 text-xs font-mono bg-v0-bg-secondary p-2 rounded overflow-x-auto">
                      <code>{mermaidBlock.code}</code>
                    </pre>
                  </details>
                </div>
              )}
            </div>
          );
        }
      }
    }

    return elements.length > 0 ? elements : (
      <div className="text-muted-foreground text-center py-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <YarnLogo className="w-8 h-8" />
        </div>
        <p>No content to preview</p>
        <p className="text-sm mt-2">Start writing to see your content here</p>
      </div>
    );
  };

  return (
    <div className={`markdown-preview h-full overflow-y-auto bg-v0-dark-bg text-v0-text-primary ${className}`}>
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

/**
 * Basic Markdown to HTML converter
 * This is a simplified implementation - in production you might want to use a library like marked or remark
 */
function convertMarkdownToHtml(markdown: string): string {
  if (!markdown.trim()) return '';

  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code blocks (non-mermaid)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    if (lang && lang.toLowerCase() === 'mermaid') {
      return match; // Keep mermaid blocks as-is for separate processing
    }
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists
  html = html.replace(/^\* (.+$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/^\d+\. (.+$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

  // Blockquotes
  html = html.replace(/^> (.+$)/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>|<ol>|<blockquote>|<pre>|<hr>)/g, '$1');
  html = html.replace(/(<\/ul>|<\/ol>|<\/blockquote>|<\/pre>|<hr>)<\/p>/g, '$1');

  return html;
}

/**
 * Escape HTML characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
