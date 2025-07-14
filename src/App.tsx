import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Folder, Settings, Plus } from "lucide-react";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { ProjectCreationModal } from "@/components/ProjectCreationModal";
import { useAppStore } from "@/stores/useAppStore";
import { useEffect, useState } from "react";

function App() {
  const { addProject, addDocument, setCurrentProject, setCurrentDocument, projects } = useAppStore();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  
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
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Three-Panel Layout */}
      <div className="flex-1 overflow-hidden">
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
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Chat Interface</CardTitle>
                    <CardDescription className="text-xs">
                      AI chat functionality will be implemented here
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          AI: Hello! I'm your writing assistant. How can I help you today?
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                          Help me write
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                          Review document
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                          Suggest improvements
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Panel>
        </PanelGroup>
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
    </div>
  );
}

export default App;
