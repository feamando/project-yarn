import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Folder, Settings, Plus } from "lucide-react";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { ProjectCreationModal } from "@/components/ProjectCreationModal";
import { AISettings } from "@/components/AISettings";
import { AIModelSelector } from "@/components/AIModelSelector";
import { StreamingChatUI } from "@/components/StreamingChatUI";
import { DocumentTransformationUI } from "@/components/DocumentTransformationUI";
import { CommandPalette } from "@/components/CommandPalette";
import { UpdaterDialog } from "./components/UpdaterDialog";
import { UpdaterService, UpdateStatus } from "./services/updaterService";
import { useAppStore } from "@/stores/useAppStore";
import { useEffect, useState } from "react";

function App() {
  const { addProject, addDocument, setCurrentProject, setCurrentDocument, projects } = useAppStore();
  const currentDocument = useAppStore(state => state.documents.find(doc => doc.id === state.currentDocumentId));
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'editor' | 'settings'>('editor');
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
  
  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header/Menu Bar */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-primary">Project Yarn</h1>
          <div className="text-sm text-muted-foreground">IDE for Documents</div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsProjectModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentView(currentView === 'settings' ? 'editor' : 'settings')}
            className={currentView === 'settings' ? 'bg-muted' : ''}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'settings' ? (
          <AISettings />
        ) : (
          <PanelGroup direction="horizontal">
            {/* Left Panel - File Tree */}
            <Panel defaultSize={20} minSize={15} maxSize={35}>
              <div className="h-full bg-muted/20 border-r border-border">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center space-x-2">
                    <Folder className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Explorer</span>
                  </div>
                </div>
                <div className="p-4">
                  <Card className="mb-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Project Tree</CardTitle>
                      <CardDescription className="text-xs">
                        File explorer will be implemented here
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-3 w-3" />
                          <span>README.md</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-3 w-3" />
                          <span>document.md</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Folder className="h-3 w-3" />
                          <span>drafts/</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-border hover:bg-accent transition-colors" />

            {/* Central Panel - Editor */}
            <Panel defaultSize={60} minSize={40}>
              <MarkdownEditor className="h-full" />
            </Panel>

            <PanelResizeHandle className="w-2 bg-border hover:bg-accent transition-colors" />

            {/* Right Panel - AI Chat */}
            <Panel defaultSize={20} minSize={15} maxSize={35}>
            <div className="h-full bg-muted/20 border-l border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">AI Assistant</span>
                </div>
              </div>
              <div className="p-4">
                {/* AI Model Selector */}
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">AI Configuration</CardTitle>
                    <CardDescription className="text-xs">
                      Select your AI model and provider
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AIModelSelector />
                  </CardContent>
                </Card>

                {/* Streaming Chat Interface */}
                <div className="flex-1 flex flex-col min-h-0">
                  <StreamingChatUI />
                </div>
              </div>
            </div>
            </Panel>
          </PanelGroup>
        )}
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between p-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
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
