// AI Blocks Manager Component
// Task 3.3.1: Implement Reusable Prompts (AI Blocks)
// 
// Main component for managing AI Blocks (reusable prompts)

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useAiBlocksStore, AiBlock, AiBlockFilter, AiBlockSortBy, SortDirection } from '../../stores/useAiBlocksStore';
import { V0AIProcessingPanel } from '../v0-components/composition-patterns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// Dialog imports removed - not used
// Textarea import removed - not used
import { Label } from '../ui/label';
// Separator import removed - not used
import { ScrollArea } from '../ui/scroll-area';
import { 
  Search, 
  Plus, 
  Star, 
  Filter,
  SortAsc,
  SortDesc,
  BookOpen,
  Zap,
  // TrendingUp removed - not used
  Settings,
  // Download, Upload removed - not used
  AlertCircle,
  // CheckCircle removed - not used
} from 'lucide-react';
import { AiBlockCard } from './AiBlockCard';
import { CreateAiBlockModal } from './CreateAiBlockModal';
import { EditAiBlockModal } from './EditAiBlockModal';
import { VariableInputModal } from './VariableInputModal';
import { AiBlockStats } from './AiBlockStats';

export const AiBlocksManager: React.FC = () => {
  const {
    aiBlocks,
    categories,
    usageStats,
    selectedAiBlock,
    isLoading,
    error,
    searchQuery,
    sortBy,
    sortDirection,
    isCreateModalOpen,
    isEditModalOpen,
    isVariableModalOpen,
    
    loadAiBlocks,
    searchAiBlocks,
    filterAiBlocks,
    sortAiBlocks,
    selectAiBlock,
    toggleFavorite,
    deleteAiBlock,
    duplicateAiBlock,
    loadCategories,
    loadUsageStats,
    
    openCreateModal,
    openEditModal,
    openVariableModal,
    setSearchQuery,
    clearError,
  } = useAiBlocksStore();

  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadAiBlocks();
    loadCategories();
    loadUsageStats();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        if (localSearchQuery.trim()) {
          searchAiBlocks(localSearchQuery);
        } else {
          loadAiBlocks();
        }
        setSearchQuery(localSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    let filter: AiBlockFilter = {};
    
    switch (tab) {
      case 'favorites':
        filter = { is_favorite: true };
        break;
      case 'system':
        filter = { is_system: true };
        break;
      case 'user':
        filter = { is_system: false };
        break;
      case 'all':
      default:
        filter = {};
        break;
    }
    
    filterAiBlocks(filter);
  };

  // Handle category filter
  const handleCategoryFilter = (category: string) => {
    if (category === 'all') {
      filterAiBlocks({});
    } else {
      filterAiBlocks({ category });
    }
  };

  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    const sortByEnum = newSortBy as AiBlockSortBy;
    const newDirection = sortBy === sortByEnum && sortDirection === SortDirection.Desc 
      ? SortDirection.Asc 
      : SortDirection.Desc;
    sortAiBlocks(sortByEnum, newDirection);
  };

  // Handle AI Block actions
  const handleEdit = (aiBlock: AiBlock) => {
    openEditModal(aiBlock);
  };

  const handleUse = (aiBlock: AiBlock) => {
    if (aiBlock.variables.length > 0) {
      openVariableModal(aiBlock);
    } else {
      // Process template without variables
      // This would typically integrate with the AI chat system
      console.log('Using AI Block:', aiBlock.name);
    }
  };

  const handleDuplicate = async (aiBlock: AiBlock) => {
    try {
      await duplicateAiBlock(aiBlock.id);
    } catch (error) {
      console.error('Failed to duplicate AI Block:', error);
    }
  };

  const handleDelete = async (aiBlock: AiBlock) => {
    if (window.confirm(`Are you sure you want to delete "${aiBlock.name}"?`)) {
      try {
        await deleteAiBlock(aiBlock.id);
      } catch (error) {
        console.error('Failed to delete AI Block:', error);
      }
    }
  };

  const handleToggleFavorite = async (aiBlock: AiBlock) => {
    try {
      await toggleFavorite(aiBlock.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-v0-dark-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Zap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-serif font-bold">AI Blocks</h1>
          <Badge variant="secondary">{aiBlocks.length}</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Block
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-v0-radius-md flex items-center">
          <AlertCircle className="h-4 w-4 text-destructive mr-2" />
          <span className="text-sm text-destructive">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="ml-auto"
          >
            ×
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search AI Blocks..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Filters & Sorting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select onValueChange={handleCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <Label className="text-xs">Sort By</Label>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AiBlockSortBy.Name}>Name</SelectItem>
                      <SelectItem value={AiBlockSortBy.UpdatedAt}>Updated</SelectItem>
                      <SelectItem value={AiBlockSortBy.CreatedAt}>Created</SelectItem>
                      <SelectItem value={AiBlockSortBy.UsageCount}>Usage</SelectItem>
                      <SelectItem value={AiBlockSortBy.Category}>Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Direction */}
                <div>
                  <Label className="text-xs">Direction</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sortAiBlocks(sortBy, 
                      sortDirection === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc
                    )}
                    className="w-full justify-start"
                  >
                    {sortDirection === SortDirection.Desc ? (
                      <SortDesc className="h-4 w-4 mr-2" />
                    ) : (
                      <SortAsc className="h-4 w-4 mr-2" />
                    )}
                    {sortDirection === SortDirection.Desc ? 'Descending' : 'Ascending'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="h-4 w-4 mr-1" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings className="h-4 w-4 mr-1" />
              System
            </TabsTrigger>
            <TabsTrigger value="user">
              <BookOpen className="h-4 w-4 mr-1" />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="h-64">
                <V0AIProcessingPanel
                  isProcessing={true}
                  processedItems={0}
                  totalItems={1}
                  title="Loading AI Blocks"
                  status="active"
                  className="h-full"
                />
              </div>
            ) : aiBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-serif font-medium mb-2">No AI Blocks Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Create your first AI Block to get started.'}
                </p>
                {!searchQuery && (
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create AI Block
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {aiBlocks.map((aiBlock) => (
                    <AiBlockCard
                      key={aiBlock.id}
                      aiBlock={aiBlock}
                      onEdit={handleEdit}
                      onUse={handleUse}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                      onToggleFavorite={handleToggleFavorite}
                      onSelect={selectAiBlock}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Usage Stats Sidebar */}
      {usageStats && (
        <div className="border-t p-4">
          <AiBlockStats />
        </div>
      )}

      {/* Modals */}
      <CreateAiBlockModal 
        isOpen={isCreateModalOpen}
        onClose={() => useAiBlocksStore.getState().closeCreateModal()}
      />
      
      <EditAiBlockModal 
        isOpen={isEditModalOpen}
        onClose={() => useAiBlocksStore.getState().closeEditModal()}
        aiBlock={selectedAiBlock}
      />
      
      <VariableInputModal 
        isOpen={isVariableModalOpen}
        onClose={() => useAiBlocksStore.getState().closeVariableModal()}
        aiBlock={selectedAiBlock}
        onUse={(processedPrompt: string) => {
          // Handle the processed prompt - could integrate with chat or copy to clipboard
          console.log('Processed prompt:', processedPrompt);
          useAiBlocksStore.getState().closeVariableModal();
        }}
      />
    </div>
  );
};
