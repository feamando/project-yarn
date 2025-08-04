import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore, useCurrentDocument } from '@/stores/useAppStore'
import { FileText, Save, Eye, Edit3, Sparkles, SplitSquareHorizontal } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { MarkdownPreview } from './MarkdownPreview'
import { parseMermaidBlocks } from '../../utils/markdownParser'
import { V0AIProcessingPanel, V0StatusCard } from '../v0-components/composition-patterns'

interface MarkdownEditorProps {
  className?: string
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ className }) => {
  const currentDocument = useCurrentDocument()
  const updateDocument = useAppStore(state => state.updateDocument)
  const settings = useAppStore(state => state.settings)
  
  // Local state for the editor content (uncontrolled)
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // AI Autocomplete state
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  
  // Preview mode state
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const [mermaidBlocks, setMermaidBlocks] = useState<any[]>([])
  
  // Refs for debouncing and text area
  const autocompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Accept AI suggestion
  const acceptSuggestion = useCallback(() => {
    if (!aiSuggestion || !textareaRef.current) return
    
    const textarea = textareaRef.current
    const currentContent = content
    const cursorPos = textarea.selectionStart || 0
    
    // Insert suggestion at cursor position
    const newContent = currentContent.slice(0, cursorPos) + aiSuggestion + currentContent.slice(cursorPos)
    
    setContent(newContent)
    setHasUnsavedChanges(true)
    setAiSuggestion('')
    setShowSuggestion(false)
    
    // Update document in store
    if (currentDocument) {
      updateDocument(currentDocument.id, { content: newContent })
    }
    
    // Set cursor position after suggestion
    setTimeout(() => {
      const newCursorPos = cursorPos + aiSuggestion.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }, [aiSuggestion, content, currentDocument, updateDocument])
  
  // Dismiss AI suggestion
  const dismissSuggestion = useCallback(() => {
    setAiSuggestion('')
    setShowSuggestion(false)
  }, [])
  
  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0)
    }
  }, [])
  
  // Sync content with current document
  useEffect(() => {
    if (currentDocument) {
      setContent(currentDocument.content || '')
      setHasUnsavedChanges(false)
      setLastSaved(currentDocument.updatedAt ? new Date(currentDocument.updatedAt) : null)
      
      // Detect Mermaid blocks in the content
      const blocks = parseMermaidBlocks(currentDocument.content || '')
      setMermaidBlocks(blocks)
    }
  }, [currentDocument])
  
  // Cleanup autocomplete timeout on unmount
  useEffect(() => {
    return () => {
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current)
      }
    }
  }, [])

  // AI Autocomplete function
  const getAiAutocomplete = useCallback(async (context: string, position: number) => {
    if (!context.trim() || context.length < 10) {
      setAiSuggestion('')
      setShowSuggestion(false)
      return
    }
    
    try {
      setIsLoadingSuggestion(true)
      
      // Get context around cursor (last 200 characters for better AI context)
      const contextStart = Math.max(0, position - 200)
      const contextText = context.substring(contextStart, position)
      
      // Call the Tauri backend for AI autocomplete
      const suggestion = await invoke('get_autocomplete', { context: contextText })
      
      if (typeof suggestion === 'string' && suggestion.trim()) {
        setAiSuggestion(suggestion.trim())
        setShowSuggestion(true)
      } else {
        setAiSuggestion('')
        setShowSuggestion(false)
      }
    } catch (error) {
      console.error('AI autocomplete failed:', error)
      setAiSuggestion('')
      setShowSuggestion(false)
    } finally {
      setIsLoadingSuggestion(false)
    }
  }, [])
  
  // Handle content changes with AI autocomplete
  const handleContentChange = useCallback((newContent: string, cursorPos?: number) => {
    setContent(newContent)
    setHasUnsavedChanges(true)
    
    // Update cursor position
    const currentPos = cursorPos ?? textareaRef.current?.selectionStart ?? newContent.length
    setCursorPosition(currentPos)
    
    // Clear existing autocomplete timeout
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current)
    }
    
    // Hide current suggestion while typing
    setShowSuggestion(false)
    
    // Debounced AI autocomplete (300ms after last keystroke)
    autocompleteTimeoutRef.current = setTimeout(() => {
      getAiAutocomplete(newContent, currentPos)
    }, 300)
    
    // Auto-save if enabled
    if (settings.autoSave && currentDocument) {
      const autoSaveDelay = setTimeout(() => {
        handleSave(newContent)
      }, 2000) // Auto-save after 2 seconds of no typing
      
      return () => clearTimeout(autoSaveDelay)
    }
  }, [settings.autoSave, currentDocument, getAiAutocomplete])

  // Save function
  const handleSave = useCallback(async (contentToSave?: string) => {
    if (!currentDocument) return
    
    setIsSaving(true)
    
    try {
      // Update the document in the store
      updateDocument(currentDocument.id, {
        content: contentToSave || content
      })
      
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
      
      // Simulate async save operation
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setIsSaving(false)
    }
  }, [currentDocument, content, updateDocument])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault()
          handleSave()
        }
      }
      
      // Handle AI suggestion shortcuts
      if (showSuggestion && aiSuggestion) {
        if (e.key === 'Tab') {
          e.preventDefault()
          acceptSuggestion()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          dismissSuggestion()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, showSuggestion, aiSuggestion, acceptSuggestion, dismissSuggestion])

  // Word and character count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length

  if (!currentDocument) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-v0-bg-secondary rounded-lg flex items-center justify-center mb-4">
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
    )
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-v0-border-primary bg-v0-bg-secondary/20">
        <div className="flex items-center space-x-3">
          <FileText className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-medium text-sm">{currentDocument.name}</h3>
            <p className="text-xs text-muted-foreground">
              {currentDocument.state} • {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* AI Status Indicator */}
          {isLoadingSuggestion && (
            <div className="flex items-center space-x-2">
              <V0AIProcessingPanel
                isProcessing={true}
                processedItems={0}
                totalItems={1}
                title="AI Assistant"
                status="active"
                className="scale-75 origin-left"
              />
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
            variant={hasUnsavedChanges ? "default" : "outline"}
            size="sm" 
            onClick={() => handleSave()}
            disabled={isSaving || !hasUnsavedChanges}
            className={hasUnsavedChanges ? "bg-v0-gold hover:bg-v0-gold/90 text-black border-v0-gold" : ""}
          >
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          {/* View Mode Toggle */}
          <div className="flex items-center border border-v0-border-primary rounded-md bg-v0-bg-secondary" role="group" aria-label="Editor view mode">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('edit')}
              className={`rounded-r-none border-r border-v0-border-primary h-8 px-3 ${
                viewMode === 'edit' 
                  ? 'bg-v0-teal hover:bg-v0-teal/90 text-black' 
                  : 'hover:bg-v0-border-primary'
              }`}
              aria-pressed={viewMode === 'edit'}
              aria-label="Edit mode - Write and edit markdown content"
            >
              <Edit3 className="h-3 w-3 mr-1" aria-hidden="true" />
              Edit
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('preview')}
              className={`rounded-none border-r border-v0-border-primary h-8 px-3 ${
                viewMode === 'preview' 
                  ? 'bg-v0-teal hover:bg-v0-teal/90 text-black' 
                  : 'hover:bg-v0-border-primary'
              }`}
              aria-pressed={viewMode === 'preview'}
              aria-label="Preview mode - View rendered markdown with diagrams"
            >
              <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
              Preview
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('split')}
              className={`rounded-l-none h-8 px-3 ${
                viewMode === 'split' 
                  ? 'bg-[#4EC9B0] hover:bg-[#4EC9B0]/90 text-black' 
                  : 'hover:bg-[#3E3E42]'
              }`}
              aria-pressed={viewMode === 'split'}
              aria-label="Split mode - Edit and preview side by side"
            >
              <SplitSquareHorizontal className="h-3 w-3 mr-1" aria-hidden="true" />
              Split
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex relative">
        {/* Edit Mode or Split Mode - Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'flex-1 border-r border-[#3E3E42]' : 'flex-1'} p-0 relative`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                const target = e.target as HTMLTextAreaElement
                handleContentChange(e.target.value, target.selectionStart)
                // Update Mermaid blocks when content changes
                const blocks = parseMermaidBlocks(e.target.value)
                setMermaidBlocks(blocks)
              }}
              onSelect={handleCursorChange}
              onKeyUp={handleCursorChange}
              onClick={handleCursorChange}
              placeholder="Start writing your document..."
              className={`
                w-full h-full resize-none border-0 outline-none bg-[#1E1E1E] text-[#D4D4D4]
                p-6 font-mono leading-relaxed
                ${settings.fontSize === 'sm' ? 'text-sm' : settings.fontSize === 'lg' ? 'text-lg' : 'text-base'}
                ${settings.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}
                placeholder:text-muted-foreground
                focus:ring-0 focus:outline-none
              `}
              spellCheck="true"
              autoCapitalize="sentences"
              autoComplete="off"
              autoCorrect="on"
            />
          
          {/* AI Suggestion Overlay */}
          {showSuggestion && aiSuggestion && (
            <div className="absolute top-4 right-4 max-w-sm bg-card border border-[#3E3E42] rounded-lg shadow-lg p-4 z-10">
              <div className="flex items-start justify-between space-x-2 mb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-card-foreground">AI Suggestion</span>
                </div>
                <button
                  onClick={dismissSuggestion}
                  className="text-muted-foreground hover:text-[#D4D4D4] transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="text-sm text-muted-foreground mb-3 bg-[#2A2A2A]/50 p-2 rounded border-l-2 border-purple-500">
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
        )}
        
        {/* Preview Mode or Split Mode - Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'flex-1' : 'flex-1'} bg-[#1E1E1E]`}>
            <MarkdownPreview 
              content={content}
              className="h-full overflow-auto p-6"
            />
          </div>
        )}
      </div>

      {/* Editor Footer/Stats */}
      <div className="flex items-center justify-between p-3 text-xs text-muted-foreground border-t border-[#3E3E42] bg-[#2A2A2A]/10">
        <div className="flex items-center space-x-4">
          <span>Line 1, Column {cursorPosition + 1}</span>
          <span>UTF-8</span>
          <span>Markdown</span>
          {mermaidBlocks.length > 0 && (
            <span className="flex items-center space-x-1 text-v0-teal">
              <div className="w-2 h-2 rounded-full bg-v0-teal" />
              <span>{mermaidBlocks.length} diagram{mermaidBlocks.length !== 1 ? 's' : ''}</span>
            </span>
          )}
          {isLoadingSuggestion && (
            <span className="flex items-center space-x-1">
              <V0AIProcessingPanel
                isProcessing={true}
                processedItems={0}
                totalItems={1}
                title="AI"
                status="active"
                className="scale-50 origin-left"
              />
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <V0StatusCard
            title="Words"
            value={wordCount}
            icon={<FileText className="w-3 h-3" />}
            variant="default"
            className="scale-75 origin-left"
          />
          <V0StatusCard
            title="Characters"
            value={charCount}
            icon={<Edit3 className="w-3 h-3" />}
            variant="default"
            className="scale-75 origin-left"
          />
          <V0StatusCard
            title="State"
            value={currentDocument.state}
            variant={currentDocument.state === 'draft' ? 'warning' : 'success'}
            className="scale-75 origin-left"
          />
          {showSuggestion && (
            <V0StatusCard
              title="AI"
              value="Ready"
              icon={<Sparkles className="w-3 h-3" />}
              variant="success"
              className="scale-75 origin-left"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default MarkdownEditor
