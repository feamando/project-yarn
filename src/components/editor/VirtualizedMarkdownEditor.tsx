import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore, useCurrentDocument } from '@/stores/useAppStore';
import { FileText, Save, Eye, Edit3, Sparkles, Loader2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

/**
 * Virtualized Markdown Editor Component
 * Task 3.1.2: Implement UI virtualization for the Markdown editor
 * 
 * This component implements virtual scrolling to optimize performance
 * when working with large Markdown documents by only rendering visible lines.
 */

interface VirtualizedMarkdownEditorProps {
  className?: string;
}

interface LineData {
  content: string;
  lineNumber: number;
  isVisible: boolean;
}

interface LineItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    lines: LineData[];
    onLineChange: (lineIndex: number, newContent: string) => void;
    selectedLine: number;
    onLineSelect: (lineIndex: number) => void;
    fontSize: string;
    wordWrap: boolean;
  };
}

const LineItem: React.FC<LineItemProps> = ({ index, style, data }) => {
  const { lines, onLineChange, selectedLine, onLineSelect, fontSize, wordWrap } = data;
  const line = lines[index];
  const [localContent, setLocalContent] = useState(line.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalContent(line.content);
  }, [line.content]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onLineChange(index, newContent);
  }, [index, onLineChange]);

  const handleFocus = useCallback(() => {
    onLineSelect(index);
  }, [index, onLineSelect]);

  const isSelected = selectedLine === index;

  return (
    <div style={style} className="flex items-start border-b border-border/30">
      {/* Line number gutter */}
      <div className="w-12 flex-shrink-0 text-right pr-3 py-2 text-xs text-muted-foreground bg-muted/20 border-r border-border/30">
        {line.lineNumber}
      </div>
      
      {/* Line content */}
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={localContent}
          onChange={handleChange}
          onFocus={handleFocus}
          className={`
            w-full resize-none border-0 outline-none bg-transparent text-foreground
            px-4 py-2 font-mono leading-relaxed min-h-[2.5rem]
            ${fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base'}
            ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}
            ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/20'}
            placeholder:text-muted-foreground
            focus:ring-0 focus:outline-none focus:bg-primary/10
            transition-colors duration-150
          `}
          placeholder={index === 0 ? "Start writing your document..." : ""}
          spellCheck="true"
          autoCapitalize="sentences"
          autoComplete="off"
          autoCorrect="on"
          rows={1}
          style={{ 
            height: 'auto',
            minHeight: '2.5rem',
            maxHeight: '10rem'
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.max(40, target.scrollHeight)}px`;
          }}
        />
      </div>
    </div>
  );
};

export const VirtualizedMarkdownEditor: React.FC<VirtualizedMarkdownEditorProps> = ({ className }) => {
  const currentDocument = useCurrentDocument();
  const updateDocument = useAppStore(state => state.updateDocument);
  const settings = useAppStore(state => state.settings);
  
  // Local state for the editor content
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedLine, setSelectedLine] = useState(0);
  
  // AI Autocomplete state
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  
  // Virtualization state
  const [containerHeight, setContainerHeight] = useState(400);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split content into lines for virtualization
  const lines = useMemo((): LineData[] => {
    const contentLines = content.split('\n');
    return contentLines.map((line, index) => ({
      content: line,
      lineNumber: index + 1,
      isVisible: true
    }));
  }, [content]);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100; // Leave space for footer
        setContainerHeight(Math.max(400, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Load document content when document changes
  useEffect(() => {
    if (currentDocument) {
      setContent(currentDocument.content || '');
      setHasUnsavedChanges(false);
      setLastSaved(currentDocument.updated_at ? new Date(currentDocument.updated_at) : null);
    }
  }, [currentDocument]);

  // Handle line content changes
  const handleLineChange = useCallback((lineIndex: number, newContent: string) => {
    const newLines = [...lines];
    newLines[lineIndex] = { ...newLines[lineIndex], content: newContent };
    const newFullContent = newLines.map(line => line.content).join('\n');
    
    setContent(newFullContent);
    setHasUnsavedChanges(true);
    
    // Update document in store
    if (currentDocument) {
      updateDocument(currentDocument.id, { content: newFullContent });
    }
  }, [lines, currentDocument, updateDocument]);

  // Handle line selection
  const handleLineSelect = useCallback((lineIndex: number) => {
    setSelectedLine(lineIndex);
  }, []);

  // Save document
  const handleSave = useCallback(async () => {
    if (!currentDocument || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      // Here you would typically call a Tauri command to save the document
      // await invoke('save_document', { documentId: currentDocument.id, content });
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentDocument, content, hasUnsavedChanges]);

  // AI Autocomplete functions
  const getAiSuggestion = useCallback(async (context: string) => {
    if (!context.trim()) return;

    setIsLoadingSuggestion(true);
    try {
      const suggestion = await invoke<string>('get_autocomplete', {
        context: context,
        maxTokens: 50
      });
      
      if (suggestion && suggestion.trim()) {
        setAiSuggestion(suggestion.trim());
        setShowSuggestion(true);
      }
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, []);

  const acceptSuggestion = useCallback(() => {
    if (!aiSuggestion) return;
    
    const currentLineContent = lines[selectedLine]?.content || '';
    const newContent = currentLineContent + aiSuggestion;
    handleLineChange(selectedLine, newContent);
    
    setAiSuggestion('');
    setShowSuggestion(false);
  }, [aiSuggestion, lines, selectedLine, handleLineChange]);

  const dismissSuggestion = useCallback(() => {
    setAiSuggestion('');
    setShowSuggestion(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      // AI suggestion shortcuts
      if (showSuggestion && aiSuggestion) {
        if (e.key === 'Tab') {
          e.preventDefault();
          acceptSuggestion();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          dismissSuggestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, showSuggestion, aiSuggestion, acceptSuggestion, dismissSuggestion]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    return {
      totalLines: lines.length,
      visibleLines: Math.ceil(containerHeight / 40), // Assuming 40px per line
      virtualizationRatio: lines.length > 0 ? (Math.ceil(containerHeight / 40) / lines.length) * 100 : 100
    };
  }, [lines.length, containerHeight]);

  // Word and character count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  if (!currentDocument) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">No Document Selected</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Select a document from the explorer or create a new one to start writing.
            </p>
            <Button size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
        <div className="flex items-center space-x-3">
          <FileText className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-medium text-sm">{currentDocument.name}</h3>
            <p className="text-xs text-muted-foreground">
              {currentDocument.state} • {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}
              {lines.length > 100 && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                  Virtualized ({performanceMetrics.virtualizationRatio.toFixed(1)}% rendered)
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* AI Status Indicator */}
          {isLoadingSuggestion && (
            <div className="flex items-center space-x-2 text-xs text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>AI thinking...</span>
            </div>
          )}
          
          {showSuggestion && aiSuggestion && (
            <div className="flex items-center space-x-2 text-xs text-purple-600">
              <Sparkles className="w-3 h-3" />
              <span>AI suggestion ready</span>
            </div>
          )}
          
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-2 text-xs text-amber-600">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Unsaved changes</span>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          <Button variant="outline" size="sm">
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Virtualized Editor Area */}
      <div ref={containerRef} className="flex-1 flex relative bg-background">
        <List
          ref={listRef}
          height={containerHeight}
          itemCount={lines.length || 1}
          itemSize={40}
          itemData={{
            lines: lines.length > 0 ? lines : [{ content: '', lineNumber: 1, isVisible: true }],
            onLineChange: handleLineChange,
            selectedLine,
            onLineSelect: handleLineSelect,
            fontSize: settings.fontSize,
            wordWrap: settings.wordWrap
          }}
          className="w-full"
        >
          {LineItem}
        </List>
        
        {/* AI Suggestion Overlay */}
        {showSuggestion && aiSuggestion && (
          <div className="absolute top-4 right-4 max-w-sm bg-card border border-border rounded-lg shadow-lg p-4 z-10">
            <div className="flex items-start justify-between space-x-2 mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-card-foreground">AI Suggestion</span>
              </div>
              <button
                onClick={dismissSuggestion}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="text-sm text-muted-foreground mb-3 bg-muted/50 p-2 rounded border-l-2 border-purple-500">
              {aiSuggestion}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Press Tab to accept, Esc to dismiss</span>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={acceptSuggestion}
                  className="h-6 px-2 text-xs"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismissSuggestion}
                  className="h-6 px-2 text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Footer/Stats */}
      <div className="flex items-center justify-between p-3 text-xs text-muted-foreground border-t border-border bg-muted/10">
        <div className="flex items-center space-x-4">
          <span>Line {selectedLine + 1} of {lines.length}</span>
          <span>UTF-8</span>
          <span>Markdown</span>
          {lines.length > 100 && (
            <span className="flex items-center space-x-1 text-green-600">
              <span>⚡</span>
              <span>Virtualized ({performanceMetrics.visibleLines}/{performanceMetrics.totalLines} lines)</span>
            </span>
          )}
          {isLoadingSuggestion && (
            <span className="flex items-center space-x-1 text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>AI</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>{currentDocument.state}</span>
          {showSuggestion && (
            <span className="text-purple-600 font-medium">✨ AI Ready</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedMarkdownEditor;
