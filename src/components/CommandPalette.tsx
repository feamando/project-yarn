import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { V0ModalHeader } from "@/components/v0-components/composition-patterns";
import { YarnLogo } from "@/components/v0-components/yarn-logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { 
  Command, 
  Search, 
  FileText, 
  Zap, 
  Settings, 
  Plus,
  ArrowRight,
  Keyboard
} from 'lucide-react';

// Command types
interface CommandAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'document' | 'transformation' | 'ai' | 'project' | 'settings';
  keywords: string[];
  action: () => void;
  shortcut?: string;
}

// Mock document for demo purposes
interface Document {
  id: string;
  name: string;
  path: string;
  state: 'draft' | 'memo' | 'prfaq' | 'prd' | 'epic_breakdown' | 'archived';
  projectId: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocument?: Document;
  onShowTransformation?: (document: Document) => void;
  onShowSettings?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  currentDocument,
  onShowTransformation,
  onShowSettings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define available commands
  const commands: CommandAction[] = [
    // Document commands
    {
      id: 'new-document',
      label: 'New Document',
      description: 'Create a new document in the current project',
      icon: <Plus className="h-4 w-4" />,
      category: 'document',
      keywords: ['new', 'create', 'document', 'file'],
      action: () => {
        console.log('Create new document');
        onClose();
      },
      shortcut: 'Ctrl+N'
    },
    {
      id: 'open-document',
      label: 'Open Document',
      description: 'Open an existing document',
      icon: <FileText className="h-4 w-4" />,
      category: 'document',
      keywords: ['open', 'document', 'file'],
      action: () => {
        console.log('Open document');
        onClose();
      },
      shortcut: 'Ctrl+O'
    },
    // Transformation commands
    ...(currentDocument ? [
      {
        id: 'transform-document',
        label: 'Transform Document',
        description: `Transform "${currentDocument.name}" to a different format`,
        icon: <Zap className="h-4 w-4" />,
        category: 'transformation' as const,
        keywords: ['transform', 'convert', 'change', 'format', 'fsm'],
        action: () => {
          onShowTransformation?.(currentDocument);
          onClose();
        },
        shortcut: 'Ctrl+T'
      },
      {
        id: 'transform-to-memo',
        label: 'Transform to Memo',
        description: `Convert "${currentDocument.name}" to memo format`,
        icon: <ArrowRight className="h-4 w-4" />,
        category: 'transformation' as const,
        keywords: ['memo', 'transform', 'convert'],
        action: () => {
          onShowTransformation?.(currentDocument);
          onClose();
        }
      },
      {
        id: 'transform-to-prfaq',
        label: 'Transform to PR FAQ',
        description: `Convert "${currentDocument.name}" to PR FAQ format`,
        icon: <ArrowRight className="h-4 w-4" />,
        category: 'transformation' as const,
        keywords: ['prfaq', 'pr', 'faq', 'transform', 'convert'],
        action: () => {
          onShowTransformation?.(currentDocument);
          onClose();
        }
      }
    ] : []),
    // AI commands
    {
      id: 'ai-settings',
      label: 'AI Settings',
      description: 'Configure AI providers and credentials',
      icon: <Settings className="h-4 w-4" />,
      category: 'ai',
      keywords: ['ai', 'settings', 'providers', 'credentials', 'bedrock', 'gemini'],
      action: () => {
        onShowSettings?.();
        onClose();
      },
      shortcut: 'Ctrl+,'
    },
    {
      id: 'ai-chat',
      label: 'Focus AI Chat',
      description: 'Focus on the AI chat panel',
      icon: <Command className="h-4 w-4" />,
      category: 'ai',
      keywords: ['ai', 'chat', 'focus', 'assistant'],
      action: () => {
        console.log('Focus AI chat');
        onClose();
      },
      shortcut: 'Ctrl+/'
    }
  ];

  // Filter commands based on search query
  const filteredCommands = commands.filter(command => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      command.label.toLowerCase().includes(query) ||
      command.description.toLowerCase().includes(query) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Set up keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const category = command.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(command);
    return groups;
  }, {} as Record<string, CommandAction[]>);

  // Category display names
  const categoryNames = {
    document: 'Documents',
    transformation: 'Transformations',
    ai: 'AI & Settings',
    project: 'Projects',
    settings: 'Settings'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <div className="p-4 pb-2">
          <V0ModalHeader
            title="Command Palette"
            description="Search and execute commands quickly"
            icon={<YarnLogo className="w-5 h-5" />}
          />
        </div>

        {/* Search Input */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands..."
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Commands List */}
        <ScrollArea className="max-h-96 px-4 pb-4">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No commands found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {categoryNames[category as keyof typeof categoryNames]}
                  </h3>
                  <div className="space-y-1">
                    {categoryCommands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <Button
                          key={command.id}
                          variant={isSelected ? "secondary" : "ghost"}
                          className="w-full justify-start h-auto p-3 text-left"
                          onClick={command.action}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="flex-shrink-0">
                              {command.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">
                                  {command.label}
                                </span>
                                {command.shortcut && (
                                  <Badge variant="outline" className="text-xs">
                                    <Keyboard className="h-2 w-2 mr-1" />
                                    {command.shortcut}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {command.description}
                              </p>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-[#2A2A2A]/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
