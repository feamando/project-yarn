"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Settings,
  Send,
  Bot,
  User,
  ChevronRight,
  ChevronDown,
  X,
  Save,
  Search,
  MoreHorizontal,
  Paperclip,
} from "lucide-react"

// Import the new components
import { YarnLogo } from "@/components/yarn-logo"
import { ContextIndicator } from "@/components/context-indicator"
import { IconSidebar } from "@/components/icon-sidebar"

interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  isOpen?: boolean
  isActive?: boolean
}

export function ProjectYarnIDE() {
  const [activeView, setActiveView] = useState("project")
  const [activeTab, setActiveTab] = useState("product-spec.md")
  const [selectedModel, setSelectedModel] = useState("bedrock-claude")
  const [chatMessage, setChatMessage] = useState("")
  const [showNewProject, setShowNewProject] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [bedrockKey, setBedrockKey] = useState("")
  const [geminiKey, setGeminiKey] = useState("")

  const [fileTree] = useState<FileNode[]>([
    {
      name: "Product Strategy",
      type: "folder",
      isOpen: true,
      children: [
        { name: "product-spec.md", type: "file", isActive: true },
        { name: "user-research.md", type: "file" },
        { name: "competitive-analysis.md", type: "file" },
      ],
    },
    {
      name: "Technical Docs",
      type: "folder",
      isOpen: false,
      children: [
        { name: "architecture.md", type: "file" },
        { name: "api-spec.md", type: "file" },
      ],
    },
    {
      name: "Meeting Notes",
      type: "folder",
      isOpen: true,
      children: [
        { name: "2024-01-15-standup.md", type: "file" },
        { name: "2024-01-12-planning.md", type: "file" },
      ],
    },
  ])

  const [chatHistory] = useState([
    {
      role: "user",
      content: "Can you help me improve the user onboarding section in this document?",
    },
    {
      role: "assistant",
      content:
        "I'd be happy to help improve the user onboarding section. Based on the current content, I can suggest several enhancements:\n\n1. **Progressive disclosure**: Break down complex steps into smaller, digestible chunks\n2. **Visual cues**: Add screenshots or diagrams to guide users\n3. **Success metrics**: Define what successful onboarding looks like\n\nWould you like me to rewrite a specific section or provide a complete restructure?",
    },
    {
      role: "user",
      content: "Can you help me structure the technical architecture section better?",
    },
    {
      role: "assistant",
      content:
        "I can help you restructure the technical architecture section. Here are some suggestions:\n\n1. **System Overview**: Start with a high-level diagram\n2. **Component Architecture**: Break down into logical components\n3. **Data Flow**: Show how information moves through the system\n4. **Technology Stack**: List the specific technologies used\n5. **Deployment Architecture**: Explain how it's deployed and scaled\n\nWould you like me to elaborate on any of these sections?",
    },
  ])

  const toggleFolder = () => {
    // Implementation for folder toggle
  }

  const openFile = (fileName: string) => {
    setActiveTab(fileName)
  }

  return (
    <div className="h-screen flex flex-col bg-v0-dark-bg text-v0-text-primary overflow-hidden">
      {/* Title Bar - Sticky */}
      <div className="sticky top-0 z-50 h-14 bg-v0-bg-secondary flex items-center justify-between px-6 border-b border-v0-border-primary">
        <div className="flex items-center gap-3">
          <YarnLogo className="w-6 h-6" />
          <span className="text-base font-serif font-light text-v0-text-primary">Project Yarn</span>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm font-light hover:bg-v0-border-primary bg-v0-red text-white hover:bg-v0-red-hover"
              >
                <Plus className="w-4 h-4 mr-2 stroke-1" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-v0-bg-tertiary border-v0-border-primary text-v0-text-primary">
              <DialogHeader>
                <DialogTitle className="text-v0-gold">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Name</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="bg-v0-dark-bg border-v0-border-primary focus:border-v0-gold"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowNewProject(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-v0-gold text-black hover:bg-v0-gold-hover">Create Project</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-v0-text-muted hover:bg-v0-border-primary hover:text-v0-text-primary"
              >
                <Settings className="w-4 h-4 stroke-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-v0-bg-tertiary border-v0-border-primary text-v0-text-primary max-w-md">
              <DialogHeader>
                <DialogTitle className="text-v0-gold">AI Provider Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Amazon Bedrock API Key</label>
                  <Input
                    type="password"
                    value={bedrockKey}
                    onChange={(e) => setBedrockKey(e.target.value)}
                    placeholder="Enter Bedrock API key..."
                    className="bg-v0-dark-bg border-v0-border-primary focus:border-v0-gold"
                  />
                  {bedrockKey && (
                    <Badge variant="secondary" className="mt-2 bg-green-900 text-green-200">
                      ✓ Connected
                    </Badge>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Google Gemini API Key</label>
                  <Input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Enter Gemini API key..."
                    className="bg-v0-dark-bg border-v0-border-primary focus:border-v0-gold"
                  />
                  {geminiKey && (
                    <Badge variant="secondary" className="mt-2 bg-green-900 text-green-200">
                      ✓ Connected
                    </Badge>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-v0-gold text-black hover:bg-v0-gold-hover">Save Settings</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Icon Sidebar */}
        <IconSidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Left Panel - File Navigator */}
        <div className="w-64 bg-v0-bg-tertiary border-r border-v0-border-primary flex flex-col overflow-hidden">
          {/* Sticky Panel Header */}
          <div className="sticky top-0 z-40 bg-v0-bg-tertiary p-4 border-b border-v0-border-primary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-serif font-normal text-v0-gold truncate">Product Strategy</h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-v0-border-primary">
                <Plus className="w-4 h-4 stroke-1" />
              </Button>
            </div>

            <ContextIndicator isProcessing={true} />

            <div className="relative mt-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-v0-text-muted stroke-1" />
              <Input
                placeholder="Search files..."
                className="h-9 pl-10 bg-v0-dark-bg border-v0-border-primary text-sm font-light focus:border-v0-gold rounded-md"
              />
            </div>
          </div>

          {/* Scrollable File Tree */}
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            <div className="p-2">
              {fileTree.map((node, index) => (
                <FileTreeNode key={index} node={node} onToggle={toggleFolder} onFileClick={openFile} level={0} />
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel - Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Sticky Tab Bar */}
          <div className="sticky top-0 z-40 h-11 bg-v0-bg-secondary border-b border-v0-border-primary flex items-center">
            <div className="flex">
              <div className="flex items-center px-4 py-2 bg-v0-dark-bg border-r border-v0-border-primary text-sm font-light">
                <FileText className="w-4 h-4 mr-3 text-v0-gold stroke-1" />
                {activeTab}
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-3 hover:bg-v0-border-primary">
                  <X className="w-3 h-3 stroke-1" />
                </Button>
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3 px-4">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-v0-gold hover:bg-v0-border-primary font-light">
                <Save className="w-4 h-4 mr-2 stroke-1" />
                Save
              </Button>
            </div>
          </div>

          {/* Scrollable Editor Content */}
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            <div className="p-6 bg-v0-dark-bg">
              <div className="max-w-4xl mx-auto">
                <div className="font-mono text-base leading-relaxed font-light">
                  <div className="text-3xl font-serif font-normal text-v0-gold mb-6"># Product Specification</div>
                  <div className="text-xl font-serif text-v0-teal mb-4">## Overview</div>
                  <p className="mb-6 text-v0-text-primary leading-7">
                    <span className="bg-v0-gold bg-opacity-30 px-1 rounded font-semibold">Project Yarn</span> is an
                    AI-native IDE for documents, designed for professional writers who need structured workflows and
                    intelligent assistance. The application combines the power of modern code editors with
                    document-centric features for{" "}
                    <span className="bg-v0-teal bg-opacity-30 px-1 rounded font-semibold">Product Managers</span>,{" "}
                    <span className="bg-v0-teal bg-opacity-30 px-1 rounded font-semibold">Tech Leads</span>, and{" "}
                    <span className="bg-v0-teal bg-opacity-30 px-1 rounded font-semibold">Content Strategists</span>.
                  </p>

                  <div className="text-xl font-serif text-v0-teal mb-4">## Core Features</div>
                  <ul className="list-disc list-inside mb-6 space-y-2 text-v0-text-primary leading-7">
                    <li>
                      <strong className="text-v0-gold font-medium">AI-Native</strong>: Integrated AI assistance for
                      writing, editing, and research
                    </li>
                    <li>
                      <strong className="text-v0-gold font-medium">Local-First</strong>: All documents stored locally
                      with optional cloud sync
                    </li>
                    <li>
                      <strong className="text-v0-gold font-medium">Structured Workflows</strong>: Project-based
                      organization with templates
                    </li>
                  </ul>

                  <div className="text-xl font-serif text-v0-teal mb-4">## User Onboarding</div>
                  <p className="mb-3 text-v0-text-primary leading-7">
                    The{" "}
                    <span className="bg-v0-gold bg-opacity-30 px-1 rounded font-semibold">onboarding process</span>{" "}
                    should be streamlined and focus on getting users productive quickly:
                    <span className="text-v0-text-muted ml-3 italic font-light">
                      // AI suggestion: Consider adding progressive disclosure here
                    </span>
                  </p>

                  <div className="bg-v0-bg-tertiary border border-v0-border-primary rounded-lg p-4 mb-6">
                    <div className="text-xs text-v0-text-muted mb-3 font-light">Mermaid Diagram Preview:</div>
                    <div className="bg-white p-4 rounded-md text-black text-sm">
                      <div className="text-center space-y-3">
                        <div className="inline-block bg-blue-100 px-4 py-2 rounded-md font-medium">Welcome Screen</div>
                        <div className="text-xs text-v0-text-muted">↓</div>
                        <div className="inline-block bg-green-100 px-4 py-2 rounded-md font-medium">
                          Create/Open Project
                        </div>
                        <div className="text-xs text-v0-text-muted">↓</div>
                        <div className="inline-block bg-yellow-100 px-4 py-2 rounded-md font-medium">
                          Setup AI Providers
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xl font-serif text-v0-teal mb-4">## Technical Architecture</div>
                  <p className="mb-6 text-v0-text-primary leading-7">
                    Built with <span className="bg-v0-teal bg-opacity-30 px-1 rounded font-semibold">Electron</span>{" "}
                    for cross-platform compatibility, using a modern web stack for the UI and local
                    <span className="bg-v0-teal bg-opacity-30 px-1 rounded font-semibold">SQLite</span> for document
                    storage. See{" "}
                    <a href="#" className="text-v0-gold underline hover:text-v0-gold-hover font-semibold">
                      architecture.md
                    </a>{" "}
                    for detailed specifications.
                  </p>

                  {/* Additional content for scrolling demonstration */}
                  <div className="text-xl font-serif text-v0-teal mb-4">## Implementation Details</div>
                  <p className="mb-6 text-v0-text-primary leading-7">
                    The application architecture follows modern best practices with a clear separation of concerns. The
                    frontend is built using React with TypeScript for type safety and better developer experience.
                  </p>

                  <div className="text-xl font-serif text-v0-teal mb-4">## Performance Considerations</div>
                  <p className="mb-6 text-v0-text-primary leading-7">
                    Performance is critical for a professional writing tool. We implement virtual scrolling for large
                    documents, lazy loading for file trees, and efficient diff algorithms for real-time collaboration.
                  </p>

                  <div className="text-xl font-serif text-v0-teal mb-4">## Security & Privacy</div>
                  <p className="mb-6 text-v0-text-primary leading-7">
                    All documents are stored locally by default, with optional encrypted cloud sync. API keys are stored
                    securely in the system keychain, and all AI communications are encrypted in transit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Assistant */}
        <div className="w-80 bg-v0-bg-tertiary border-l border-v0-border-primary flex flex-col overflow-hidden">
          {/* Sticky Panel Header */}
          <div className="sticky top-0 z-40 bg-v0-bg-tertiary p-4 border-b border-v0-border-primary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-normal text-v0-gold flex items-center">
                <Bot className="w-5 h-5 mr-3 stroke-1" />
                AI Assistant
              </h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-v0-border-primary text-v0-text-muted">
                <MoreHorizontal className="w-4 h-4 stroke-1" />
              </Button>
            </div>

            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-9 bg-v0-dark-bg border-v0-border-primary focus:border-v0-gold font-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-v0-bg-secondary border-v0-border-primary">
                <SelectItem value="local-phi3">Local Phi-3</SelectItem>
                <SelectItem value="bedrock-claude">Bedrock Claude</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scrollable Chat Content */}
          <div className="flex-1 overflow-y-auto scrollbar-custom p-3">
            <div className="space-y-4">
              {chatHistory.map((message, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {message.role === "user" ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3 text-v0-gold" />
                    )}
                    <div className="text-xs text-v0-text-muted">{message.role === "user" ? "You" : "Assistant"}</div>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono font-light">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Input Area */}
          <div className="sticky bottom-0 bg-v0-bg-tertiary p-3 border-t border-v0-border-primary">
            <div className="relative">
              <Textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask AI for help with your document..."
                className="w-full min-h-[60px] pr-20 bg-v0-dark-bg border-v0-border-primary focus:border-v0-gold resize-none"
              />
              <div className="absolute right-2 bottom-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-v0-text-muted hover:bg-v0-border-primary hover:text-v0-text-primary"
                >
                  <Paperclip className="w-4 h-4 stroke-1" />
                </Button>
                <Button
                  size="sm"
                  className="h-8 w-8 p-0 bg-v0-gold text-black hover:bg-v0-gold-hover"
                  disabled={!chatMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-v0-border-primary border-v0-border-primary">
                Improve writing
              </Badge>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-v0-border-primary border-v0-border-primary">
                Add examples
              </Badge>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-v0-border-primary border-v0-border-primary">
                Summarize
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FileTreeNodeProps {
  node: FileNode
  onToggle: (path: string) => void
  onFileClick: (fileName: string) => void
  level: number
}

function FileTreeNode({ node, onToggle, onFileClick, level }: FileTreeNodeProps) {
  const handleClick = () => {
    if (node.type === "folder") {
      onToggle(node.name)
    } else {
      onFileClick(node.name)
    }
  }

  return (
    <div>
      <div
        className={`flex items-center py-2 px-3 rounded-md cursor-pointer hover:bg-v0-bg-secondary transition-colors ${
          node.isActive ? "bg-v0-bg-tertiary text-v0-gold" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
      >
        {node.type === "folder" ? (
          <>
            {node.isOpen ? (
              <ChevronDown className="w-4 h-4 mr-2 stroke-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2 stroke-1" />
            )}
            {node.isOpen ? (
              <FolderOpen className="w-4 h-4 mr-3 text-v0-gold stroke-1" />
            ) : (
              <Folder className="w-4 h-4 mr-3 text-v0-gold stroke-1" />
            )}
          </>
        ) : (
          <FileText className="w-4 h-4 mr-3 ml-6 text-v0-teal stroke-1" />
        )}
        <span className="text-xs font-light truncate">{node.name}</span>
      </div>

      {node.type === "folder" && node.isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode key={index} node={child} onToggle={onToggle} onFileClick={onFileClick} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
