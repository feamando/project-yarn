"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "lucide-react"

// Import the new components at the top
import { YarnLogo } from "@/components/yarn-logo"
import { ContextIndicator } from "@/components/context-indicator"

interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  isOpen?: boolean
  isActive?: boolean
}

export function ProjectYarnIDE() {
  const [activeTab, setActiveTab] = useState("product-spec.md")
  const [selectedModel, setSelectedModel] = useState("bedrock-claude")
  const [chatMessage, setChatMessage] = useState("")
  const [showNewProject, setShowNewProject] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [bedrockKey, setBedrockKey] = useState("")
  const [geminiKey, setGeminiKey] = useState("")

  const [fileTree, setFileTree] = useState<FileNode[]>([
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
  ])

  const toggleFolder = (path: string) => {
    // Implementation for folder toggle
  }

  const openFile = (fileName: string) => {
    setActiveTab(fileName)
  }

  return (
    <div className="h-screen flex flex-col bg-[#1E1E1E] text-[#D4D4D4]">
      {/* Title Bar */}
      <div className="h-14 bg-[#2D2D30] flex items-center justify-between px-6 border-b border-[#3E3E42]">
        <div className="flex items-center gap-3">
          <YarnLogo className="w-6 h-6" />
          <span className="text-base font-serif font-light text-[#D4D4D4]">Project Yarn</span>
          <div className="w-px h-4 bg-[#3E3E42] mx-2"></div>
          <span className="text-sm font-light text-[#858585]">Product Strategy Project</span>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm font-light hover:bg-[#3E3E42] bg-[#FF4136] text-white hover:bg-[#E6392F]"
              >
                <Plus className="w-4 h-4 mr-2 stroke-1" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#252526] border-[#3E3E42] text-[#D4D4D4]">
              <DialogHeader>
                <DialogTitle className="text-[#FFD700]">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Name</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="bg-[#1E1E1E] border-[#3E3E42] focus:border-[#FFD700]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowNewProject(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-[#FFD700] text-black hover:bg-[#E6C200]">Create Project</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-[#858585] hover:bg-[#3E3E42] hover:text-[#D4D4D4]"
              >
                <Settings className="w-4 h-4 stroke-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#252526] border-[#3E3E42] text-[#D4D4D4] max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#FFD700]">AI Provider Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Amazon Bedrock API Key</label>
                  <Input
                    type="password"
                    value={bedrockKey}
                    onChange={(e) => setBedrockKey(e.target.value)}
                    placeholder="Enter Bedrock API key..."
                    className="bg-[#1E1E1E] border-[#3E3E42] focus:border-[#FFD700]"
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
                    className="bg-[#1E1E1E] border-[#3E3E42] focus:border-[#FFD700]"
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
                  <Button className="bg-[#FFD700] text-black hover:bg-[#E6C200]">Save Settings</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - File Navigator */}
        <div className="w-64 bg-[#252526] border-r border-[#3E3E42] flex flex-col">
          <div className="p-4 border-b border-[#3E3E42]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-serif font-normal text-[#FFD700] truncate">Product Strategy</h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#3E3E42]">
                <Plus className="w-4 h-4 stroke-1" />
              </Button>
            </div>

            <ContextIndicator isProcessing={true} />

            <div className="relative mt-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#858585] stroke-1" />
              <Input
                placeholder="Search files..."
                className="h-9 pl-10 bg-[#1E1E1E] border-[#3E3E42] text-sm font-light focus:border-[#FFD700] rounded-md"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {fileTree.map((node, index) => (
                <FileTreeNode key={index} node={node} onToggle={toggleFolder} onFileClick={openFile} level={0} />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Editor */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="h-11 bg-[#2D2D30] border-b border-[#3E3E42] flex items-center">
            <div className="flex">
              <div className="flex items-center px-4 py-2 bg-[#1E1E1E] border-r border-[#3E3E42] text-sm font-light">
                <FileText className="w-4 h-4 mr-3 text-[#FFD700] stroke-1" />
                {activeTab}
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-3 hover:bg-[#3E3E42]">
                  <X className="w-3 h-3 stroke-1" />
                </Button>
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3 px-4">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-[#FFD700] hover:bg-[#3E3E42] font-light">
                <Save className="w-4 h-4 mr-2 stroke-1" />
                Save
              </Button>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 p-6 bg-[#1E1E1E] overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="font-mono text-base leading-relaxed font-light">
                <div className="text-3xl font-serif font-normal text-[#FFD700] mb-6"># Product Specification</div>
                <div className="text-xl font-serif text-[#4EC9B0] mb-4">## Overview</div>
                <p className="mb-6 text-[#D4D4D4] leading-7">
                  <span className="bg-[#FFD700] bg-opacity-30 px-1 rounded font-semibold">Project Yarn</span> is an
                  AI-native IDE for documents, designed for professional writers who need structured workflows and
                  intelligent assistance. The application combines the power of modern code editors with
                  document-centric features for{" "}
                  <span className="bg-[#4EC9B0] bg-opacity-30 px-1 rounded font-semibold">Product Managers</span>,{" "}
                  <span className="bg-[#4EC9B0] bg-opacity-30 px-1 rounded font-semibold">Tech Leads</span>, and{" "}
                  <span className="bg-[#4EC9B0] bg-opacity-30 px-1 rounded font-semibold">Content Strategists</span>.
                </p>

                <div className="text-xl font-serif text-[#4EC9B0] mb-4">## Core Features</div>
                <ul className="list-disc list-inside mb-6 space-y-2 text-[#D4D4D4] leading-7">
                  <li>
                    <strong className="text-[#FFD700] font-medium">AI-Native</strong>: Integrated AI assistance for
                    writing, editing, and research
                  </li>
                  <li>
                    <strong className="text-[#FFD700] font-medium">Local-First</strong>: All documents stored locally
                    with optional cloud sync
                  </li>
                  <li>
                    <strong className="text-[#FFD700] font-medium">Structured Workflows</strong>: Project-based
                    organization with templates
                  </li>
                </ul>

                <div className="text-xl font-serif text-[#4EC9B0] mb-4">## User Onboarding</div>
                <p className="mb-3 text-[#D4D4D4] leading-7">
                  The <span className="bg-[#FFD700] bg-opacity-30 px-1 rounded font-semibold">onboarding process</span>{" "}
                  should be streamlined and focus on getting users productive quickly:
                  <span className="text-[#858585] ml-3 italic font-light">
                    // AI suggestion: Consider adding progressive disclosure here
                  </span>
                </p>

                <div className="bg-[#252526] border border-[#3E3E42] rounded-lg p-4 mb-6">
                  <div className="text-xs text-[#858585] mb-3 font-light">Mermaid Diagram Preview:</div>
                  <div className="bg-white p-4 rounded-md text-black text-sm">
                    <div className="text-center space-y-3">
                      <div className="inline-block bg-blue-100 px-4 py-2 rounded-md font-medium">Welcome Screen</div>
                      <div className="text-xs text-gray-500">↓</div>
                      <div className="inline-block bg-green-100 px-4 py-2 rounded-md font-medium">
                        Create/Open Project
                      </div>
                      <div className="text-xs text-gray-500">↓</div>
                      <div className="inline-block bg-yellow-100 px-4 py-2 rounded-md font-medium">
                        Setup AI Providers
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xl font-serif text-[#4EC9B0] mb-4">## Technical Architecture</div>
                <p className="mb-6 text-[#D4D4D4] leading-7">
                  Built with <span className="bg-[#4EC9B0] bg-opacity-30 px-1 rounded font-semibold">Electron</span> for
                  cross-platform compatibility, using a modern web stack for the UI and local
                  <span className="bg-[#4EC9B0] bg-opacity-30 px-1 rounded font-semibold">SQLite</span> for document
                  storage. See{" "}
                  <a href="#" className="text-[#FFD700] underline hover:text-[#E6C200] font-semibold">
                    architecture.md
                  </a>{" "}
                  for detailed specifications.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Assistant */}
        <div className="w-80 bg-[#252526] border-l border-[#3E3E42] flex flex-col">
          <div className="p-4 border-b border-[#3E3E42]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-normal text-[#FFD700] flex items-center">
                <Bot className="w-5 h-5 mr-3 stroke-1" />
                AI Assistant
              </h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#3E3E42] text-[#858585]">
                <MoreHorizontal className="w-4 h-4 stroke-1" />
              </Button>
            </div>

            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-9 bg-[#1E1E1E] border-[#3E3E42] focus:border-[#FFD700] font-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2D2D30] border-[#3E3E42]">
                <SelectItem value="local-phi3">Local Phi-3</SelectItem>
                <SelectItem value="bedrock-claude">Bedrock Claude</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              {chatHistory.map((message, index) => (
                <div key={index} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#3E3E42] flex items-center justify-center flex-shrink-0">
                    {message.role === "user" ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3 text-[#FFD700]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#858585] mb-1">{message.role === "user" ? "You" : "Assistant"}</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono font-light">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-[#3E3E42]">
            <div className="flex gap-2">
              <Textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask AI for help with your document..."
                className="flex-1 min-h-[60px] bg-[#1E1E1E] border-[#3E3E42] focus:border-[#FFD700] resize-none"
              />
              <Button
                size="sm"
                className="bg-[#FFD700] text-black hover:bg-[#E6C200] self-end"
                disabled={!chatMessage.trim()}
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#3E3E42] border-[#3E3E42]">
                Improve writing
              </Badge>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#3E3E42] border-[#3E3E42]">
                Add examples
              </Badge>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#3E3E42] border-[#3E3E42]">
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
        className={`flex items-center py-2 px-3 rounded-md cursor-pointer hover:bg-[#2A2D2E] transition-colors ${
          node.isActive ? "bg-[#37373D] text-[#FFD700]" : ""
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
              <FolderOpen className="w-4 h-4 mr-3 text-[#FFD700] stroke-1" />
            ) : (
              <Folder className="w-4 h-4 mr-3 text-[#FFD700] stroke-1" />
            )}
          </>
        ) : (
          <FileText className="w-4 h-4 mr-3 ml-6 text-[#4EC9B0] stroke-1" />
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
