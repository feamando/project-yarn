// Markdown Parser Utility
// Task 3.3.2: Implement Mermaid.js Diagramming
// 
// Utility functions for parsing markdown and detecting Mermaid code blocks

export interface CodeBlock {
  language: string;
  code: string;
  startLine: number;
  endLine: number;
  raw: string;
}

export interface MermaidBlock extends CodeBlock {
  language: 'mermaid';
  id: string;
}

/**
 * Parse markdown content and extract all code blocks
 */
export function parseCodeBlocks(markdown: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  const lines = markdown.split('\n');
  
  let inCodeBlock = false;
  let currentBlock: Partial<CodeBlock> | null = null;
  let codeLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check for code block start
    if (trimmedLine.startsWith('```') && !inCodeBlock) {
      inCodeBlock = true;
      const language = trimmedLine.substring(3).trim() || 'text';
      
      currentBlock = {
        language,
        startLine: i,
        raw: line + '\n'
      };
      codeLines = [];
    }
    // Check for code block end
    else if (trimmedLine === '```' && inCodeBlock && currentBlock) {
      inCodeBlock = false;
      
      const codeBlock: CodeBlock = {
        language: currentBlock.language!,
        code: codeLines.join('\n'),
        startLine: currentBlock.startLine!,
        endLine: i,
        raw: currentBlock.raw + codeLines.join('\n') + '\n' + line
      };
      
      codeBlocks.push(codeBlock);
      currentBlock = null;
      codeLines = [];
    }
    // Collect code lines
    else if (inCodeBlock && currentBlock) {
      codeLines.push(line);
      currentBlock.raw += line + '\n';
    }
  }
  
  return codeBlocks;
}

/**
 * Extract only Mermaid code blocks from markdown
 */
export function parseMermaidBlocks(markdown: string): MermaidBlock[] {
  const codeBlocks = parseCodeBlocks(markdown);
  
  return codeBlocks
    .filter((block): block is MermaidBlock => 
      block.language.toLowerCase() === 'mermaid'
    )
    .map((block, index) => ({
      ...block,
      language: 'mermaid' as const,
      id: `mermaid-${index}-${Date.now()}`
    }));
}

/**
 * Replace Mermaid code blocks in markdown with placeholder divs
 * This allows us to render diagrams in specific locations
 */
export function replaceMermaidBlocks(
  markdown: string, 
  replacement: (block: MermaidBlock) => string = (block) => `<div data-mermaid-id="${block.id}"></div>`
): { processedMarkdown: string; mermaidBlocks: MermaidBlock[] } {
  const mermaidBlocks = parseMermaidBlocks(markdown);
  let processedMarkdown = markdown;
  
  // Replace in reverse order to maintain line positions
  for (let i = mermaidBlocks.length - 1; i >= 0; i--) {
    const block = mermaidBlocks[i];
    const lines = processedMarkdown.split('\n');
    
    // Replace the entire code block with placeholder
    const beforeLines = lines.slice(0, block.startLine);
    const afterLines = lines.slice(block.endLine + 1);
    const replacementLine = replacement(block);
    
    processedMarkdown = [
      ...beforeLines,
      replacementLine,
      ...afterLines
    ].join('\n');
  }
  
  return { processedMarkdown, mermaidBlocks };
}

/**
 * Validate Mermaid diagram syntax (basic validation)
 */
export function validateMermaidSyntax(code: string): { isValid: boolean; error?: string } {
  const trimmedCode = code.trim();
  
  if (!trimmedCode) {
    return { isValid: false, error: 'Empty diagram code' };
  }
  
  // Basic syntax validation for common Mermaid diagram types
  const diagramTypes = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
    'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie',
    'gitgraph', 'mindmap', 'timeline', 'quadrantChart'
  ];
  
  const firstLine = trimmedCode.split('\n')[0].trim().toLowerCase();
  const hasValidStart = diagramTypes.some(type => 
    firstLine.startsWith(type.toLowerCase()) || 
    firstLine.includes(type.toLowerCase())
  );
  
  if (!hasValidStart) {
    return { 
      isValid: false, 
      error: `Unknown diagram type. Supported types: ${diagramTypes.join(', ')}` 
    };
  }
  
  // Check for common syntax issues
  if (trimmedCode.includes('<script>') || trimmedCode.includes('javascript:')) {
    return { 
      isValid: false, 
      error: 'Script tags and javascript: URLs are not allowed for security reasons' 
    };
  }
  
  return { isValid: true };
}

/**
 * Extract diagram type from Mermaid code
 */
export function getMermaidDiagramType(code: string): string {
  const trimmedCode = code.trim();
  const firstLine = trimmedCode.split('\n')[0].trim().toLowerCase();
  
  if (firstLine.startsWith('graph')) return 'graph';
  if (firstLine.startsWith('flowchart')) return 'flowchart';
  if (firstLine.startsWith('sequencediagram')) return 'sequence';
  if (firstLine.startsWith('classdiagram')) return 'class';
  if (firstLine.startsWith('statediagram')) return 'state';
  if (firstLine.startsWith('erdiagram')) return 'er';
  if (firstLine.startsWith('journey')) return 'journey';
  if (firstLine.startsWith('gantt')) return 'gantt';
  if (firstLine.startsWith('pie')) return 'pie';
  if (firstLine.startsWith('gitgraph')) return 'gitgraph';
  if (firstLine.startsWith('mindmap')) return 'mindmap';
  if (firstLine.startsWith('timeline')) return 'timeline';
  if (firstLine.startsWith('quadrantchart')) return 'quadrant';
  
  return 'unknown';
}

/**
 * Generate sample Mermaid diagrams for testing
 */
export const sampleMermaidDiagrams = {
  flowchart: `flowchart TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`,
    
  sequence: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,
    
  class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
    
  pie: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,
    
  gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`
};
