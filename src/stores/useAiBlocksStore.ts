// AI Blocks Store
// Task 3.3.1: Implement Reusable Prompts (AI Blocks)
// 
// Zustand store for managing AI Blocks state and operations

import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

// Types for AI Blocks
export interface PromptVariable {
  name: string;
  var_type: string; // "text", "number", "boolean", "select"
  description: string;
  required: boolean;
  default_value?: string;
  options?: string[]; // For select type
}

// Export alias for component compatibility
export type AiBlockVariable = PromptVariable;

export interface AiBlock {
  id: string;
  name: string;
  description?: string;
  prompt_template: string;
  category: string;
  tags: string[];
  is_system: boolean;
  is_favorite: boolean;
  usage_count: number;
  created_at: number;
  updated_at: number;
  created_by?: string;
  variables: PromptVariable[];
}

export interface AiBlockFilter {
  category?: string;
  tags?: string[];
  is_system?: boolean;
  is_favorite?: boolean;
  search_query?: string;
}

export enum AiBlockSortBy {
  Name = 'Name',
  CreatedAt = 'CreatedAt',
  UpdatedAt = 'UpdatedAt',
  UsageCount = 'UsageCount',
  Category = 'Category',
}

export enum SortDirection {
  Asc = 'Asc',
  Desc = 'Desc',
}

export interface ProcessedPrompt {
  ai_block_id: string;
  ai_block_name: string;
  original_template: string;
  processed_prompt: string;
  variables_used: Record<string, string>;
  processing_timestamp: number;
}

export interface AiBlockUsageStats {
  total_blocks: number;
  user_blocks: number;
  system_blocks: number;
  favorite_blocks: number;
  total_usage: number;
  categories: string[];
}

export interface CreateAiBlockRequest {
  name: string;
  description?: string;
  prompt_template: string;
  category?: string;
  tags?: string[];
  variables?: PromptVariable[];
  created_by?: string;
}

export interface UpdateAiBlockRequest {
  name?: string;
  description?: string | null;
  prompt_template?: string;
  category?: string;
  tags?: string[];
  is_favorite?: boolean;
  variables?: PromptVariable[];
}

export interface TemplateValidationResult {
  is_valid: boolean;
  template_variables: string[];
  undefined_variables: string[];
  unused_variables: string[];
  missing_required_variables: string[];
  warnings: string[];
}

// AI Blocks Store State
interface AiBlocksState {
  // Data
  aiBlocks: AiBlock[];
  categories: string[];
  usageStats: AiBlockUsageStats | null;
  
  // UI State
  selectedAiBlock: AiBlock | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  currentFilter: AiBlockFilter;
  sortBy: AiBlockSortBy;
  sortDirection: SortDirection;
  
  // Modal/Dialog State
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isVariableModalOpen: boolean;
  selectedVariables: Record<string, string>;
  
  // Actions
  loadAiBlocks: () => Promise<void>;
  searchAiBlocks: (query: string) => Promise<void>;
  filterAiBlocks: (filter: AiBlockFilter) => Promise<void>;
  sortAiBlocks: (sortBy: AiBlockSortBy, direction: SortDirection) => void;
  
  createAiBlock: (request: CreateAiBlockRequest) => Promise<AiBlock>;
  updateAiBlock: (id: string, request: UpdateAiBlockRequest) => Promise<AiBlock>;
  deleteAiBlock: (id: string) => Promise<void>;
  duplicateAiBlock: (id: string, newName?: string) => Promise<AiBlock>;
  
  selectAiBlock: (aiBlock: AiBlock | null) => void;
  toggleFavorite: (id: string) => Promise<void>;
  
  processTemplate: (id: string, variables: Record<string, string>) => Promise<ProcessedPrompt>;
  validateTemplate: (template: string, variables: PromptVariable[]) => Promise<TemplateValidationResult>;
  
  loadCategories: () => Promise<void>;
  loadUsageStats: () => Promise<void>;
  
  // Modal Actions
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (aiBlock: AiBlock) => void;
  closeEditModal: () => void;
  openVariableModal: (aiBlock: AiBlock) => void;
  closeVariableModal: () => void;
  setSelectedVariables: (variables: Record<string, string>) => void;
  
  // Utility Actions
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchQuery: (query: string) => void;
}

// Create the AI Blocks store
export const useAiBlocksStore = create<AiBlocksState>((set, get) => ({
  // Initial State
  aiBlocks: [],
  categories: [],
  usageStats: null,
  selectedAiBlock: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  currentFilter: {},
  sortBy: AiBlockSortBy.UpdatedAt,
  sortDirection: SortDirection.Desc,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isVariableModalOpen: false,
  selectedVariables: {},

  // Load AI Blocks
  loadAiBlocks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { currentFilter, sortBy, sortDirection } = get();
      const aiBlocks = await invoke<AiBlock[]>('get_ai_blocks', {
        filter: Object.keys(currentFilter).length > 0 ? currentFilter : null,
        sortBy,
        sortDirection,
        limit: null,
      });
      set({ aiBlocks, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // Search AI Blocks
  searchAiBlocks: async (query: string) => {
    set({ isLoading: true, error: null, searchQuery: query });
    try {
      const aiBlocks = await invoke<AiBlock[]>('search_ai_blocks', {
        query,
        limit: null,
      });
      set({ aiBlocks, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // Filter AI Blocks
  filterAiBlocks: async (filter: AiBlockFilter) => {
    set({ isLoading: true, error: null, currentFilter: filter });
    try {
      const { sortBy, sortDirection } = get();
      const aiBlocks = await invoke<AiBlock[]>('get_ai_blocks', {
        filter,
        sortBy,
        sortDirection,
        limit: null,
      });
      set({ aiBlocks, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // Sort AI Blocks
  sortAiBlocks: (sortBy: AiBlockSortBy, direction: SortDirection) => {
    set({ sortBy, sortDirection: direction });
    get().loadAiBlocks();
  },

  // Create AI Block
  createAiBlock: async (request: CreateAiBlockRequest) => {
    set({ isLoading: true, error: null });
    try {
      const aiBlock = await invoke<AiBlock>('create_ai_block', { request });
      const { aiBlocks } = get();
      set({ 
        aiBlocks: [aiBlock, ...aiBlocks], 
        isLoading: false,
        isCreateModalOpen: false 
      });
      return aiBlock;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Update AI Block
  updateAiBlock: async (id: string, request: UpdateAiBlockRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedAiBlock = await invoke<AiBlock>('update_ai_block', { id, request });
      const { aiBlocks } = get();
      const updatedAiBlocks = aiBlocks.map(block => 
        block.id === id ? updatedAiBlock : block
      );
      set({ 
        aiBlocks: updatedAiBlocks, 
        isLoading: false,
        isEditModalOpen: false,
        selectedAiBlock: updatedAiBlock
      });
      return updatedAiBlock;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Delete AI Block
  deleteAiBlock: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('delete_ai_block', { id });
      const { aiBlocks, selectedAiBlock } = get();
      const updatedAiBlocks = aiBlocks.filter(block => block.id !== id);
      set({ 
        aiBlocks: updatedAiBlocks, 
        isLoading: false,
        selectedAiBlock: selectedAiBlock?.id === id ? null : selectedAiBlock
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Duplicate AI Block
  duplicateAiBlock: async (id: string, newName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const duplicatedAiBlock = await invoke<AiBlock>('duplicate_ai_block', { id, newName });
      const { aiBlocks } = get();
      set({ 
        aiBlocks: [duplicatedAiBlock, ...aiBlocks], 
        isLoading: false 
      });
      return duplicatedAiBlock;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Select AI Block
  selectAiBlock: (aiBlock: AiBlock | null) => {
    set({ selectedAiBlock: aiBlock });
  },

  // Toggle Favorite
  toggleFavorite: async (id: string) => {
    try {
      const newStatus = await invoke<boolean>('toggle_ai_block_favorite', { id });
      const { aiBlocks } = get();
      const updatedAiBlocks = aiBlocks.map(block => 
        block.id === id ? { ...block, is_favorite: newStatus } : block
      );
      set({ aiBlocks: updatedAiBlocks });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  // Process Template
  processTemplate: async (id: string, variables: Record<string, string>) => {
    set({ isLoading: true, error: null });
    try {
      const processedPrompt = await invoke<ProcessedPrompt>('process_ai_block_template', {
        id,
        variables,
      });
      set({ isLoading: false });
      return processedPrompt;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Validate Template
  validateTemplate: async (template: string, variables: PromptVariable[]) => {
    try {
      const validation = await invoke<TemplateValidationResult>('validate_ai_block_template', {
        template,
        variables,
      });
      return validation;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  // Load Categories
  loadCategories: async () => {
    try {
      const categories = await invoke<string[]>('get_ai_block_categories');
      set({ categories });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  // Load Usage Stats
  loadUsageStats: async () => {
    try {
      const usageStats = await invoke<AiBlockUsageStats>('get_ai_blocks_usage_stats');
      set({ usageStats });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  // Modal Actions
  openCreateModal: () => set({ isCreateModalOpen: true, error: null }),
  closeCreateModal: () => set({ isCreateModalOpen: false, error: null }),
  
  openEditModal: (aiBlock: AiBlock) => set({ 
    isEditModalOpen: true, 
    selectedAiBlock: aiBlock, 
    error: null 
  }),
  closeEditModal: () => set({ isEditModalOpen: false, error: null }),
  
  openVariableModal: (aiBlock: AiBlock) => {
    const initialVariables: Record<string, string> = {};
    aiBlock.variables.forEach(variable => {
      if (variable.default_value) {
        initialVariables[variable.name] = variable.default_value;
      }
    });
    set({ 
      isVariableModalOpen: true, 
      selectedAiBlock: aiBlock,
      selectedVariables: initialVariables,
      error: null 
    });
  },
  closeVariableModal: () => set({ 
    isVariableModalOpen: false, 
    selectedVariables: {},
    error: null 
  }),
  
  setSelectedVariables: (variables: Record<string, string>) => {
    set({ selectedVariables: variables });
  },

  // Utility Actions
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
}));
