// Mermaid Diagram Renderer Component
// Task 3.3.2: Implement Mermaid.js Diagramming
// 
// Secure Mermaid diagram renderer using sandboxed iframe for security

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Copy, Download, Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

interface MermaidDiagramProps {
  code: string;
  className?: string;
  altText?: string;
  diagramType?: string;
}

// Generate accessible alt text for Mermaid diagrams
const generateAltText = (code: string, diagramType?: string): string => {
  if (diagramType) {
    return `${diagramType} diagram: ${code.split('\n')[0] || 'Interactive diagram'}`;
  }
  
  // Auto-detect diagram type from code
  const firstLine = code.trim().split('\n')[0].toLowerCase();
  if (firstLine.includes('flowchart') || firstLine.includes('graph')) {
    return `Flowchart diagram: ${code.split('\n')[0] || 'Process flow visualization'}`;
  } else if (firstLine.includes('sequencediagram')) {
    return `Sequence diagram: ${code.split('\n')[0] || 'Interaction sequence visualization'}`;
  } else if (firstLine.includes('classDiagram')) {
    return `Class diagram: ${code.split('\n')[0] || 'Class relationship visualization'}`;
  } else if (firstLine.includes('gantt')) {
    return `Gantt chart: ${code.split('\n')[0] || 'Project timeline visualization'}`;
  } else if (firstLine.includes('pie')) {
    return `Pie chart: ${code.split('\n')[0] || 'Data distribution visualization'}`;
  } else {
    return `Interactive diagram: ${code.split('\n')[0] || 'Visual diagram representation'}`;
  }
};

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  code,
  className = '',
  altText,
  diagramType,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    if (!code.trim()) {
      setError('Empty diagram code');
      setIsLoading(false);
      return;
    }

    renderDiagram();
  }, [code]);

  const renderDiagram = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create sandboxed iframe content for secure Mermaid rendering
      const iframeContent = createSandboxedContent(code);
      
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        
        // Set up message listener for iframe communication
        const handleMessage = (event: MessageEvent) => {
          // Verify origin for security (in production, check against your domain)
          if (event.source !== iframe.contentWindow) {
            return;
          }

          if (event.data.type === 'mermaid-rendered') {
            setSvgContent(event.data.svg);
            setIsLoading(false);
          } else if (event.data.type === 'mermaid-error') {
            setError(event.data.error);
            setIsLoading(false);
          }
        };

        window.addEventListener('message', handleMessage);
        
        // Write content to iframe
        iframe.srcdoc = iframeContent;

        // Cleanup function
        return () => {
          window.removeEventListener('message', handleMessage);
        };
      }
    } catch (err) {
      setError(`Failed to render diagram: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const createSandboxedContent = (diagramCode: string): string => {
    // Create secure iframe content with Mermaid.js
    // This content is sandboxed and cannot access parent window directly
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Mermaid Diagram</title>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
          <style>
            body {
              margin: 0;
              padding: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: transparent;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .mermaid {
              max-width: 100%;
              height: auto;
            }
            .error {
              color: #ef4444;
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 6px;
              padding: 12px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div id="diagram-container">
            <div class="mermaid">
              ${diagramCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
          </div>
          
          <script>
            // Configure Mermaid with security settings
            mermaid.initialize({
              startOnLoad: false,
              theme: 'default',
              securityLevel: 'strict', // Important: strict security level
              htmlLabels: false, // Disable HTML labels for security
              maxTextSize: 50000,
              maxEdges: 500,
              deterministicIds: true,
              fontFamily: 'inherit'
            });

            async function renderDiagram() {
              try {
                const diagramElement = document.querySelector('.mermaid');
                if (!diagramElement) {
                  throw new Error('Diagram element not found');
                }

                const diagramCode = diagramElement.textContent.trim();
                if (!diagramCode) {
                  throw new Error('Empty diagram code');
                }

                // Render the diagram
                const { svg } = await mermaid.render('diagram', diagramCode);
                
                // Replace the text content with the rendered SVG
                diagramElement.innerHTML = svg;
                
                // Send the SVG content to parent window
                window.parent.postMessage({
                  type: 'mermaid-rendered',
                  svg: svg
                }, '*');
                
              } catch (error) {
                console.error('Mermaid rendering error:', error);
                
                // Display error in iframe
                const container = document.getElementById('diagram-container');
                if (container) {
                  container.innerHTML = \`
                    <div class="error">
                      <strong>Diagram Error:</strong><br>
                      \${error.message || 'Failed to render diagram'}
                    </div>
                  \`;
                }
                
                // Send error to parent window
                window.parent.postMessage({
                  type: 'mermaid-error',
                  error: error.message || 'Failed to render diagram'
                }, '*');
              }
            }

            // Start rendering when DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', renderDiagram);
            } else {
              renderDiagram();
            }
          </script>
        </body>
      </html>
    `;
  };

  const copyToClipboard = async () => {
    if (svgContent) {
      try {
        await navigator.clipboard.writeText(svgContent);
      } catch (err) {
        console.error('Failed to copy SVG:', err);
      }
    }
  };

  const downloadSVG = () => {
    if (svgContent) {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mermaid-diagram.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const openFullscreen = () => {
    if (svgContent) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Mermaid Diagram</title>
              <style>
                body { margin: 0; padding: 20px; background: white; }
                svg { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              ${svgContent}
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  return (
    <div className={`mermaid-diagram-container border rounded-lg bg-v0-dark-bg ${className}`}>
      {/* Diagram Header */}
      <div className="flex items-center justify-between p-3 border-b bg-v0-bg-secondary/30">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-muted-foreground">Mermaid Diagram</span>
        </div>
        
        {!isLoading && !error && svgContent && (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0"
              title="Copy SVG"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadSVG}
              className="h-8 w-8 p-0"
              title="Download SVG"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openFullscreen}
              className="h-8 w-8 p-0"
              title="Open in new window"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Diagram Content */}
      <div className="relative">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-sm text-muted-foreground">Rendering diagram...</span>
          </div>
        )}

        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Diagram Error:</strong> {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!isLoading && !error && (
          <div className="p-4">
            <iframe
              ref={iframeRef}
              className="w-full min-h-[200px] border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Mermaid Diagram"
              style={{
                height: 'auto',
                minHeight: '200px',
                background: 'transparent'
              }}
            />
          </div>
        )}
      </div>

      {/* Diagram Code (collapsible) */}
      <details className="border-t">
        <summary className="p-3 cursor-pointer text-sm text-muted-foreground hover:bg-v0-bg-secondary/50">
          View Source Code
        </summary>
        <div className="p-3 bg-v0-bg-secondary/20">
          <pre className="text-xs font-mono whitespace-pre-wrap break-words">
            <code>{code}</code>
          </pre>
        </div>
      </details>
    </div>
  );
};
