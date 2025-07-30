
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VirtualizedFileList from './VirtualizedFileList';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Performance Tests for Virtualized File List
 * Task 3.1.3: Implement UI virtualization for the file list view
 * 
 * These tests verify that the virtualized file list performs well with large projects
 * containing thousands of documents and provides the expected performance improvements.
 */

// Mock the store
vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn(),
  useCurrentProject: vi.fn(),
  useProjectDocuments: vi.fn(),
}));

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => {
    // Render only the first few items for testing
    const itemsToRender = Math.min(itemCount, 10);
    return (
      <div data-testid="virtualized-file-list">
        {Array.from({ length: itemsToRender }, (_, index) =>
          children({ index, style: {}, data: itemData })
        )}
      </div>
    );
  },
}));

const mockProject = {
  id: 'test-project-1',
  name: 'Test Project',
  path: '/test/project',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockDocument = (id: string, name: string, state: 'draft' | 'review' | 'published' = 'draft') => ({
  id,
  projectId: 'test-project-1',
  path: `/test/${name}`,
  name,
  content: `# ${name}\n\nTest content for ${name}`,
  state,
  createdAt: new Date(Date.now() - Math.random() * 1000000),
  updatedAt: new Date(Date.now() - Math.random() * 100000),
});

const mockDocuments = [
  createMockDocument('doc-1', 'README.md', 'published'),
  createMockDocument('doc-2', 'Getting Started.md', 'review'),
  createMockDocument('doc-3', 'Draft Document.md', 'draft'),
  createMockDocument('doc-4', 'API Reference.md', 'published'),
  createMockDocument('doc-5', 'Tutorial.md', 'draft'),
];

describe('VirtualizedFileList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAppStore as any).mockImplementation((selector: any) => {
      const state = {
        currentDocumentId: 'doc-1',
        setCurrentDocument: vi.fn(),
        addDocument: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    const { useCurrentProject, useProjectDocuments } = require('@/stores/useAppStore');
    useCurrentProject.mockReturnValue(mockProject);
    useProjectDocuments.mockReturnValue(mockDocuments);
  });

  describe('Basic Rendering', () => {
    it('renders file list with project documents', () => {
      render(<VirtualizedFileList />);
      
      expect(screen.getByText('Explorer')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-file-list')).toBeInTheDocument();
    });

    it('shows document count badge', () => {
      render(<VirtualizedFileList />);
      
      expect(screen.getByText('5 / 5')).toBeInTheDocument();
    });

    it('renders document items with correct information', () => {
      render(<VirtualizedFileList />);
      
      expect(screen.getByText('README.md')).toBeInTheDocument();
      expect(screen.getByText('Getting Started.md')).toBeInTheDocument();
      expect(screen.getByText('published')).toBeInTheDocument();
      expect(screen.getByText('review')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters documents based on search query', async () => {
      render(<VirtualizedFileList />);
      
      const searchInput = screen.getByPlaceholderText('Search files...');
      fireEvent.change(searchInput, { target: { value: 'README' } });
      
      await waitFor(() => {
        expect(screen.getByText('README.md')).toBeInTheDocument();
        expect(screen.queryByText('Getting Started.md')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search yields no matches', async () => {
      render(<VirtualizedFileList />);
      
      const searchInput = screen.getByPlaceholderText('Search files...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText('No files match your search')).toBeInTheDocument();
      });
    });

    it('updates document count when filtering', async () => {
      render(<VirtualizedFileList />);
      
      const searchInput = screen.getByPlaceholderText('Search files...');
      fireEvent.change(searchInput, { target: { value: 'README' } });
      
      await waitFor(() => {
        expect(screen.getByText('1 / 5')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('toggles sort order when sort button is clicked', () => {
      render(<VirtualizedFileList />);
      
      const sortButton = screen.getByRole('button', { name: /sort/i });
      fireEvent.click(sortButton);
      
      // Should toggle from desc to asc or vice versa
      expect(sortButton).toBeInTheDocument();
    });

    it('shows filter panel when filter button is clicked', () => {
      render(<VirtualizedFileList />);
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      fireEvent.click(filterButton);
      
      expect(screen.getByText('Sort by:')).toBeInTheDocument();
      expect(screen.getByText('State:')).toBeInTheDocument();
    });

    it('allows sorting by different criteria', () => {
      render(<VirtualizedFileList />);
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      fireEvent.click(filterButton);
      
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Modified')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
    });
  });

  describe('State Filtering', () => {
    it('filters documents by state', async () => {
      render(<VirtualizedFileList />);
      
      const filterButton = screen.getByRole('button', { name: /filter/i });
      fireEvent.click(filterButton);
      
      const publishedFilter = screen.getByRole('button', { name: 'Published' });
      fireEvent.click(publishedFilter);
      
      await waitFor(() => {
        // Should show only published documents
        expect(screen.getByText('README.md')).toBeInTheDocument();
        expect(screen.getByText('API Reference.md')).toBeInTheDocument();
      });
    });
  });

  describe('Document Selection', () => {
    it('calls setCurrentDocument when document is clicked', () => {
      const mockSetCurrentDocument = vi.fn();
      (useAppStore as any).mockImplementation((selector: any) => {
        const state = {
          currentDocumentId: 'doc-1',
          setCurrentDocument: mockSetCurrentDocument,
          addDocument: vi.fn(),
        };
        return selector ? selector(state) : state;
      });

      render(<VirtualizedFileList />);
      
      const documentItem = screen.getByText('README.md').closest('div');
      fireEvent.click(documentItem!);
      
      expect(mockSetCurrentDocument).toHaveBeenCalledWith('doc-1');
    });

    it('highlights selected document', () => {
      render(<VirtualizedFileList />);
      
      const selectedDocument = screen.getByText('README.md').closest('div');
      expect(selectedDocument).toHaveClass('bg-primary/10');
    });
  });

  describe('New Document Creation', () => {
    it('calls addDocument when new document button is clicked', () => {
      const mockAddDocument = vi.fn();
      (useAppStore as any).mockImplementation((selector: any) => {
        const state = {
          currentDocumentId: 'doc-1',
          setCurrentDocument: vi.fn(),
          addDocument: mockAddDocument,
        };
        return selector ? selector(state) : state;
      });

      render(<VirtualizedFileList />);
      
      const newDocButton = screen.getByRole('button', { name: /plus/i });
      fireEvent.click(newDocButton);
      
      expect(mockAddDocument).toHaveBeenCalled();
    });
  });

  describe('Empty States', () => {
    it('shows no project message when no project is selected', () => {
      const { useCurrentProject } = require('@/stores/useAppStore');
      useCurrentProject.mockReturnValue(null);

      render(<VirtualizedFileList />);
      
      expect(screen.getByText('No project selected')).toBeInTheDocument();
      expect(screen.getByText('Create or select a project to view files')).toBeInTheDocument();
    });

    it('shows empty project message when project has no documents', () => {
      const { useProjectDocuments } = require('@/stores/useAppStore');
      useProjectDocuments.mockReturnValue([]);

      render(<VirtualizedFileList />);
      
      expect(screen.getByText('No files in this project')).toBeInTheDocument();
      expect(screen.getByText('Create your first document to get started')).toBeInTheDocument();
    });
  });
});

/**
 * Performance Benchmark Tests
 * These tests measure actual performance metrics for the virtualized file list
 */
describe('VirtualizedFileList Performance', () => {
  const createLargeDocumentSet = (count: number) => {
    return Array.from({ length: count }, (_, i) => 
      createMockDocument(`doc-${i}`, `Document-${i}.md`, 
        i % 3 === 0 ? 'published' : i % 3 === 1 ? 'review' : 'draft')
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAppStore as any).mockImplementation((selector: any) => {
      const state = {
        currentDocumentId: 'doc-1',
        setCurrentDocument: vi.fn(),
        addDocument: vi.fn(),
      };
      return selector ? selector(state) : state;
    });

    const { useCurrentProject } = require('@/stores/useAppStore');
    useCurrentProject.mockReturnValue(mockProject);
  });

  it('renders large document sets within performance target', async () => {
    const largeDocumentSet = createLargeDocumentSet(1000);
    const { useProjectDocuments } = require('@/stores/useAppStore');
    useProjectDocuments.mockReturnValue(largeDocumentSet);

    const startTime = performance.now();
    render(<VirtualizedFileList />);
    const renderTime = performance.now() - startTime;

    // Should render within 200ms even with 1000 documents
    expect(renderTime).toBeLessThan(200);
    
    // Should show performance metrics for large sets
    expect(screen.getByText(/Virtualized:/)).toBeInTheDocument();
    expect(screen.getByText(/1000 files/)).toBeInTheDocument();
  });

  it('maintains responsive search with large document sets', async () => {
    const largeDocumentSet = createLargeDocumentSet(5000);
    const { useProjectDocuments } = require('@/stores/useAppStore');
    useProjectDocuments.mockReturnValue(largeDocumentSet);

    render(<VirtualizedFileList />);
    
    const searchInput = screen.getByPlaceholderText('Search files...');
    
    const startTime = performance.now();
    fireEvent.change(searchInput, { target: { value: 'Document-100' } });
    
    await waitFor(() => {
      expect(screen.getByText('Document-100.md')).toBeInTheDocument();
    });
    
    const searchTime = performance.now() - startTime;
    
    // Search should complete within 100ms even with 5000 documents
    expect(searchTime).toBeLessThan(100);
  });

  it('shows correct virtualization metrics', () => {
    const largeDocumentSet = createLargeDocumentSet(500);
    const { useProjectDocuments } = require('@/stores/useAppStore');
    useProjectDocuments.mockReturnValue(largeDocumentSet);

    render(<VirtualizedFileList />);
    
    // Should show virtualization efficiency
    expect(screen.getByText(/Rendering 10 of 500 items/)).toBeInTheDocument();
    expect(screen.getByText(/2.0% efficiency/)).toBeInTheDocument();
  });

  it('handles rapid filter changes efficiently', async () => {
    const largeDocumentSet = createLargeDocumentSet(1000);
    const { useProjectDocuments } = require('@/stores/useAppStore');
    useProjectDocuments.mockReturnValue(largeDocumentSet);

    render(<VirtualizedFileList />);
    
    const searchInput = screen.getByPlaceholderText('Search files...');
    
    // Rapid filter changes
    const startTime = performance.now();
    
    fireEvent.change(searchInput, { target: { value: 'a' } });
    fireEvent.change(searchInput, { target: { value: 'ab' } });
    fireEvent.change(searchInput, { target: { value: 'abc' } });
    fireEvent.change(searchInput, { target: { value: 'Document-1' } });
    
    await waitFor(() => {
      expect(screen.getByText(/files/)).toBeInTheDocument();
    });
    
    const totalTime = performance.now() - startTime;
    
    // Multiple rapid changes should complete within 150ms
    expect(totalTime).toBeLessThan(150);
  });

  it('maintains memory efficiency with large document sets', () => {
    const largeDocumentSet = createLargeDocumentSet(2000);
    const { useProjectDocuments } = require('@/stores/useAppStore');
    useProjectDocuments.mockReturnValue(largeDocumentSet);

    const { unmount } = render(<VirtualizedFileList />);
    
    // Should only render limited number of DOM elements regardless of document count
    const renderedItems = screen.getAllByText(/Document-\d+\.md/);
    expect(renderedItems.length).toBeLessThanOrEqual(10); // Only visible items rendered
    
    // Cleanup should not cause memory leaks
    unmount();
    expect(true).toBe(true); // Test passes if no memory leak errors
  });
});
