import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Settings, Plus, Blocks } from "lucide-react";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { ProjectCreationModal } from "@/components/ProjectCreationModal";
import { AISettings } from "@/components/AISettings";
import { AIModelSelector } from "@/components/AIModelSelector";
import { StreamingChatUI } from "@/components/StreamingChatUI";
import { DocumentTransformationUI } from "@/components/DocumentTransformationUI";
import { CommandPalette } from "@/components/CommandPalette";
import { VirtualizedFileList } from "@/components/explorer/VirtualizedFileList";
import { AiBlocksManager } from "@/components/ai-blocks/AiBlocksManager";
import { SkipLinks, useSkipLinkTarget } from "@/components/ui/skip-links";
import { ContextIndicator } from "@/components/context-indicator";
import { V0Header, V0Breadcrumb, V0StatusCard } from "@/components/v0-components/composition-patterns";
import { UpdaterDialog } from "./components/UpdaterDialog";
import { UpdaterService, UpdateStatus } from "./services/updaterService";
import { useAppStore } from "@/stores/useAppStore";
import { useEffect, useState } from "react";

function App() {
  const { addProject, addDocument, setCurrentProject, setCurrentDocument, projects } = useAppStore();
  const currentDocument = useAppStore(state => state.documents.find(doc => doc.id === state.currentDocumentId));
  const currentProject = useAppStore(state => state.projects.find(proj => proj.id === state.currentProjectId));
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'editor' | 'settings' | 'ai-blocks'>('editor');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTransformationUIOpen, setIsTransformationUIOpen] = useState(false);
  const [selectedDocumentForTransformation, setSelectedDocumentForTransformation] = useState<any>(null);
  const [isUpdaterDialogOpen, setIsUpdaterDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | undefined>(undefined);
  const [updaterService] = useState(() => UpdaterService.getInstance());
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      // Transform document (Ctrl+T or Cmd+T)
      if ((e.ctrlKey || e.metaKey) && e.key === 't' && currentDocument) {
        e.preventDefault();
        setSelectedDocumentForTransformation(currentDocument);
        setIsTransformationUIOpen(true);
      }
      // Settings (Ctrl+, or Cmd+,)
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setCurrentView('settings');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentDocument]);

  // Handle transformation UI actions
  const handleShowTransformation = (document: any) => {
    setSelectedDocumentForTransformation(document);
    setIsTransformationUIOpen(true);
  };

  const handleTransformationComplete = (document: any, newState: string) => {
    // Update document state in store
    console.log('Document transformed:', document, 'New state:', newState);
    // TODO: Update document state in the store
  };

  // Check for updates on startup
  useEffect(() => {
    const checkForUpdatesOnStartup = async () => {
      try {
        const status = await updaterService.checkForUpdatesOnStartup();
        if (status && status.available) {
          setUpdateStatus(status);
          setIsUpdaterDialogOpen(true);
        }
      } catch (error) {
        console.error('Failed to check for updates on startup:', error);
      }
    };

    checkForUpdatesOnStartup();
  }, [updaterService]);

  // Subscribe to update status changes
  useEffect(() => {
    const unsubscribe = updaterService.onUpdateStatusChange((status) => {
      setUpdateStatus(status);
      if (status.available) {
        setIsUpdaterDialogOpen(true);
      }
    });

    return unsubscribe;
  }, [updaterService]);

  // Initialize with demo data on first load
  useEffect(() => {
    if (projects.length === 0) {
      // Add a demo project
      const demoProjectId = 'demo-project-1';
      addProject({
        id: demoProjectId,
        name: 'My First Project',
        path: '/path/to/project'
      });
      
      // Add a demo document
      const demoDocumentId = 'demo-doc-1';
      addDocument({
        id: demoDocumentId,
        projectId: demoProjectId,
        path: '/path/to/document.md',
        name: 'Welcome Document.md',
        content: '# Welcome to Project Yarn\n\nThis is your first document! Start writing here...\n\n## Features\n\n- **AI-powered writing assistance**\n- **Local-first document management**\n- **Rich markdown support**\n- **Project-based organization**\n\nTry editing this document to see the live editor in action!',
        state: 'draft'
      });
      
      // Set as current
      setCurrentProject(demoProjectId);
      setCurrentDocument(demoDocumentId);
    }
  }, [projects.length, addProject, addDocument, setCurrentProject, setCurrentDocument]);
  
  // Skip link target setup
  useSkipLinkTarget('main-content');
  useSkipLinkTarget('file-explorer');
  useSkipLinkTarget('editor');
  useSkipLinkTarget('ai-chat');

  return (
    <div className="h-screen flex flex-col bg-v0-dark-bg text-v0-text-primary">
      {/* Screen reader announcements */}
      <div 
        id="sr-announcements" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      />
      <div 
        id="sr-announcements-assertive" 
        aria-live="assertive" 
        aria-atomic="true" 
        className="sr-only"
      />
      
      {/* Skip Links for Keyboard Navigation */}
      <SkipLinks />
      
      {/* Header/Menu Bar */}
      <V0Header 
        title="Project Yarn"
        showTitle={true}
        actions={
          <>
            <p className="text-sm text-v0-text-muted mr-4" aria-label="Application description">IDE for Documents</p>
            <nav className="flex items-center space-x-2" role="navigation" aria-label="Main navigation">
              <button 
                onClick={() => setIsProjectModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-v0-radius-md transition-colors text-v0-text-primary hover:bg-v0-border-primary hover:text-v0-text-primary"
                aria-label="Create new project"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Project
              </button>
              <button 
                onClick={() => setCurrentView('ai-blocks')}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-v0-radius-md transition-colors ${
                  currentView === 'ai-blocks' 
                    ? 'bg-v0-gold/10 text-v0-gold border border-v0-gold/20' 
                    : 'text-v0-text-primary hover:bg-v0-border-primary hover:text-v0-text-primary'
                }`}
                aria-label="Open AI Blocks manager"
                aria-pressed={currentView === 'ai-blocks'}
              >
                <Blocks className="h-4 w-4" aria-hidden="true" />
              </button>
              <button 
                onClick={() => setCurrentView('settings')}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-v0-radius-md transition-colors ${
                  currentView === 'settings' 
                    ? 'bg-v0-gold/10 text-v0-gold border border-v0-gold/20' 
                    : 'text-v0-text-primary hover:bg-v0-border-primary hover:text-v0-text-primary'
                }`}
                aria-label="Open settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </nav>
          </>
        }
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 overflow-hidden" role="main">
        {currentView === 'settings' ? (
          <section id="settings" aria-label="Application settings">
            <AISettings />
          </section>
        ) : currentView === 'ai-blocks' ? (
          <section id="ai-blocks" aria-label="AI Blocks manager">
            <AiBlocksManager />
          </section>
        ) : (
          <PanelGroup direction="horizontal">
            {/* Left Panel - File Tree */}
            <Panel defaultSize={20} minSize={15} maxSize={35}>
              <nav id="file-explorer" className="h-full bg-v0-dark-bg/20 border-r border-v0-border-primary" role="navigation" aria-label="File explorer">
                <VirtualizedFileList className="h-full" />
              </nav>
            </Panel>

            <PanelResizeHandle 
              className="w-2 bg-v0-border-primary hover:bg-v0-gold/20 focus:bg-v0-gold/30 active:bg-v0-gold/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-v0-gold/50" 
              aria-label="Resize file explorer panel"
            />

            {/* Central Panel - Editor */}
            <Panel defaultSize={60} minSize={40}>
              <section id="editor" aria-label="Markdown editor" className="h-full flex flex-col">
                {/* Breadcrumb Navigation and Status Cards */}
                {(currentProject || currentDocument) && (
                  <div className="border-b border-v0-border-primary bg-v0-dark-bg px-4 py-2">
                    <div className="flex items-center justify-between">
                      <V0Breadcrumb 
                        items={[
                          ...(currentProject ? [{
                            label: currentProject.name,
                            onClick: () => {
                              // Navigate to project overview (clear current document)
                              setCurrentDocument(null);
                            },
                            isActive: !currentDocument
                          }] : []),
                          ...(currentDocument ? [{
                            label: currentDocument.name,
                            isActive: true
                          }] : [])
                        ]}
                        className=""
                      />
                    
                      {/* Project and Document Status Cards with Context Indicator */}
                      <div className="flex items-center space-x-2">
                      {/* Context Indicator for AI Processing */}
                      <ContextIndicator 
                        isProcessing={false}
                        phase="idle"
                        ariaLabel="Document ready for editing"
                      />
                      
                      {currentProject && (
                        <V0StatusCard
                          title="Project"
                          value={currentProject.name}
                          variant="default"
                          className="scale-75 origin-right"
                        />
                      )}
                      {currentDocument && (
                        <V0StatusCard
                          title="Document"
                          value={currentDocument.state}
                          variant={currentDocument.state === 'draft' ? 'warning' : 'success'}
                          className="scale-75 origin-right"
                        />
                      )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Markdown Editor */}
                <div className="flex-1">
                  <MarkdownEditor className="h-full" />
                </div>
              </section>
            </Panel>

            <PanelResizeHandle 
              className="w-2 bg-v0-border-primary hover:bg-v0-gold/20 focus:bg-v0-gold/30 active:bg-v0-gold/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-v0-gold/50" 
              aria-label="Resize editor panel"
            />

            {/* Right Panel - AI Chat */}
            <Panel defaultSize={20} minSize={15} maxSize={35}>
              <aside id="ai-chat" className="h-full bg-v0-bg-secondary/10 border-l border-v0-border-primary" role="complementary" aria-label="AI assistant">
                <header className="p-4 border-b border-v0-border-primary">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h2 className="font-medium text-sm">AI Assistant</h2>
                  </div>
                </header>
                <div className="p-4">
                  {/* AI Model Selector */}
                  <section aria-labelledby="ai-config-title">
                    <Card className="mb-4">
                      <CardHeader className="pb-3">
                        <CardTitle id="ai-config-title" className="text-sm">AI Configuration</CardTitle>
                        <CardDescription className="text-xs">
                          Select your AI model and provider
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AIModelSelector />
                      </CardContent>
                    </Card>
                  </section>

                  {/* Context Processing Indicator */}
                  <div className="mb-4">
                    <ContextIndicator isProcessing={true} processedItems={847} totalItems={1203} />
                  </div>

                  {/* Streaming Chat Interface */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <StreamingChatUI />
                  </div>
                </div>
            </aside>
            </Panel>
          </PanelGroup>
        )}
      </main>

      {/* Status Bar */}
      <footer className="flex items-center justify-between p-2 text-xs text-muted-foreground border-t border-v0-border-primary bg-v0-bg-secondary/30">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          <span>Local AI: Active</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Words: 0</span>
          <span>Characters: 0</span>
        </div>
      </footer>

      {/* Project Creation Modal */}
      <ProjectCreationModal 
        open={isProjectModalOpen} 
        onOpenChange={setIsProjectModalOpen} 
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        currentDocument={currentDocument}
        onShowTransformation={handleShowTransformation}
        onShowSettings={() => setCurrentView('settings')}
      />

      {/* Document Transformation UI */}
      {isTransformationUIOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <DocumentTransformationUI
            document={selectedDocumentForTransformation as any}
            onTransformationComplete={handleTransformationComplete}
            onClose={() => {
              setIsTransformationUIOpen(false);
              setSelectedDocumentForTransformation(null);
            }}
          />
        </div>
      )}

      {/* Auto-Updater Dialog */}
      <UpdaterDialog
        isOpen={isUpdaterDialogOpen}
        onClose={() => setIsUpdaterDialogOpen(false)}
        updateStatus={updateStatus}
      />
    </div>
  );
}

export default App;
