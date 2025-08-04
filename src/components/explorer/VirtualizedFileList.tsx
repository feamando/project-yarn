import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { 
  FileText, 
  Folder, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { YarnLogo } from '@/components/v0-components/yarn-logo';
import { V0SidebarItem } from '@/components/v0-components/composition-patterns';
import { useAppStore, useCurrentProject, useProjectDocuments, Document } from '@/stores/useAppStore';

/**
 * Virtualized File List Component
 * Task 3.1.3: Implement UI virtualization for the file list view
 * 
 * This component implements virtual scrolling to optimize performance
 * when working with projects containing thousands of documents.
 */

interface VirtualizedFileListProps {
  className?: string;
}

interface FileItemData {
  documents: Document[];
  onDocumentSelect: (document: Document) => void;
  onDocumentAction: (document: Document, action: string) => void;
  selectedDocumentId: string | null;
  searchQuery: string;
  sortBy: 'name' | 'modified' | 'created' | 'state';
  sortOrder: 'asc' | 'desc';
}

interface FileItemProps {
  index: number;
  style: React.CSSProperties;
  data: FileItemData;
}

const FileItem: React.FC<FileItemProps> = ({ index, style, data }) => {
  const { documents, onDocumentSelect, onDocumentAction, selectedDocumentId } = data;
  const document = documents[index];
  const isSelected = selectedDocumentId === document.id;

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft': return 'bg-v0-text-muted text-v0-text-primary';
      case 'memo': return 'bg-v0-teal/20 text-v0-teal';
      case 'prfaq': return 'bg-v0-red/20 text-v0-red';
      case 'prd': return 'bg-v0-gold/20 text-v0-gold';
      case 'epic_breakdown': return 'bg-v0-teal/30 text-v0-teal';
      case 'archived': return 'bg-v0-border-subtle text-v0-text-secondary';
      default: return 'bg-v0-border-subtle text-v0-text-secondary';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Create badge component for document state
  const stateBadge = (
    <Badge variant="secondary" className={`text-xs px-v0-2 py-v0-1 rounded-v0-sm ${getStateColor(document.state)}`}>
      {document.state}
    </Badge>
  );

  return (
    <div style={style} className="px-v0-3">
      <div className="relative group">
        <V0SidebarItem
          icon={<FileText className="h-4 w-4" />}
          label={document.name}
          isActive={isSelected}
          badge={stateBadge}
          onClick={() => onDocumentSelect(document)}
          className="w-full justify-start mb-v0-1 hover:bg-v0-bg-secondary pr-v0-8"
        />
        {/* Action button positioned absolutely to avoid button nesting */}
        <div 
          className="absolute right-v0-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDocumentAction(document, 'menu');
          }}
        >
          <div className="h-6 w-6 flex items-center justify-center text-v0-text-secondary hover:text-v0-text-primary hover:bg-v0-bg-tertiary rounded-v0-sm cursor-pointer">
            <MoreHorizontal className="h-3 w-3" />
          </div>
        </div>
      </div>
      <div className="px-v0-6 pb-v0-2">
        <div className="text-xs text-v0-text-secondary truncate" title={document.path}>
          {document.path} • {formatDate(document.updatedAt)}
        </div>
      </div>
    </div>
  );
};

export const VirtualizedFileList: React.FC<VirtualizedFileListProps> = ({ className }) => {
  const currentProject = useCurrentProject();
  const projectDocuments = useProjectDocuments(currentProject?.id || null);
  const { setCurrentDocument, addDocument } = useAppStore();
  const currentDocumentId = useAppStore(state => state.currentDocumentId);
  
  // Local state for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'created' | 'state'>('modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterByState, setFilterByState] = useState<string[]>([]);
  
  // Virtualization state
  const [containerHeight, setContainerHeight] = useState(400);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100;
        setContainerHeight(Math.max(300, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    if (!projectDocuments) return [];

    let filtered = projectDocuments;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(query) ||
        doc.path.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query)
      );
    }

    // Apply state filter
    if (filterByState.length > 0) {
      filtered = filtered.filter(doc => filterByState.includes(doc.state));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'modified':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'state':
          comparison = a.state.localeCompare(b.state);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [projectDocuments, searchQuery, sortBy, sortOrder, filterByState]);

  // Handle document selection
  const handleDocumentSelect = useCallback((document: Document) => {
    setCurrentDocument(document.id);
  }, [setCurrentDocument]);

  // Handle document actions
  const handleDocumentAction = useCallback((document: Document, action: string) => {
    switch (action) {
      case 'menu':
        // TODO: Implement context menu
        console.log('Document menu for:', document.name);
        break;
      default:
        break;
    }
  }, []);

  // Handle new document creation
  const handleNewDocument = useCallback(() => {
    if (!currentProject) return;

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      projectId: currentProject.id,
      path: `/untitled-${Date.now()}.md`,
      name: `Untitled-${Date.now()}.md`,
      content: '# New Document\n\nStart writing here...',
      state: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    addDocument(newDoc);
  }, [currentProject, addDocument]);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Toggle state filter
  const toggleStateFilter = useCallback((state: string) => {
    setFilterByState(prev => 
      prev.includes(state) 
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  }, []);

  // Performance metrics for large projects
  const showPerformanceMetrics = filteredAndSortedDocuments.length > 100;
  const virtualizationRatio = Math.min(20, filteredAndSortedDocuments.length) / filteredAndSortedDocuments.length;

  const itemData: FileItemData = {
    documents: filteredAndSortedDocuments,
    onDocumentSelect: handleDocumentSelect,
    onDocumentAction: handleDocumentAction,
    selectedDocumentId: currentDocumentId,
    searchQuery,
    sortBy,
    sortOrder
  };

  if (!currentProject) {
    return (
      <div className={`h-full ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <YarnLogo className="w-8 h-8" />
              <Folder className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No project selected</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create or select a project to view files
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-v0-dark-bg ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="p-4 border-b border-v0-border-primary">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Folder className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Explorer</span>
            {projectDocuments && (
              <Badge variant="secondary" className="text-xs">
                {filteredAndSortedDocuments.length} / {projectDocuments.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-7 w-7 p-0 ${showFilters ? 'bg-v0-bg-secondary' : ''}`}
            >
              <Filter className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSortOrder}
              className="h-7 w-7 p-0"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewDocument}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Sort by:</span>
              <div className="flex space-x-1">
                {(['name', 'modified', 'created', 'state'] as const).map((sort) => (
                  <Button
                    key={sort}
                    variant={sortBy === sort ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy(sort)}
                    className="h-6 px-2 text-xs"
                  >
                    {sort === 'modified' ? 'Modified' : 
                     sort === 'created' ? 'Created' : 
                     sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">State:</span>
              <div className="flex space-x-1">
                {['draft', 'memo', 'prfaq', 'prd', 'epic_breakdown', 'archived'].map((state) => (
                  <Button
                    key={state}
                    variant={filterByState.includes(state) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => toggleStateFilter(state)}
                    className="h-6 px-2 text-xs"
                  >
                    {state.charAt(0).toUpperCase() + state.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <div className="px-4 py-2 bg-v0-bg-secondary/30 border-b border-v0-border-primary">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Virtualized:</span> Rendering {Math.min(20, filteredAndSortedDocuments.length)} of {filteredAndSortedDocuments.length} items
            <span className="ml-2">({(virtualizationRatio * 100).toFixed(1)}% efficiency)</span>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-hidden">
        {filteredAndSortedDocuments.length === 0 ? (
          <div className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <YarnLogo className="w-8 h-8" />
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {searchQuery ? 'No files match your search' : 'No files in this project'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first document to get started'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewDocument}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Button>
            )}
          </div>
        ) : (
          <List
            ref={listRef}
            height={containerHeight}
            width="100%"
            itemCount={filteredAndSortedDocuments.length}
            itemSize={60}
            itemData={itemData}
            className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          >
            {FileItem}
          </List>
        )}
      </div>

      {/* Footer Stats */}
      {projectDocuments && projectDocuments.length > 0 && (
        <div className="px-4 py-2 border-t border-v0-border-primary bg-v0-bg-secondary/20">
          <div className="text-xs text-muted-foreground">
            {filteredAndSortedDocuments.length} files
            {searchQuery && ` (filtered from ${projectDocuments.length})`}
            {showPerformanceMetrics && (
              <span className="ml-2">• Virtualized for performance</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedFileList;
