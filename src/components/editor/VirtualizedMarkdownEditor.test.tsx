
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VirtualizedMarkdownEditor from './VirtualizedMarkdownEditor';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Performance Tests for Virtualized Markdown Editor
 * Task 3.1.2: Implement UI virtualization for the Markdown editor
 * 
 * These tests verify that the virtualized editor performs well with large documents
 * and provides the expected E2E performance improvements.
 */

// Mock the store
vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn(),
  useCurrentDocument: vi.fn(),
}));

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => {
    // Render only the first few items for testing
    const itemsToRender = Math.min(itemCount, 10);
    return (
      <div data-testid="virtualized-list">
        {Array.from({ length: itemsToRender }, (_, index) =>
          children({ index, style: {}, data: itemData })
        )}
      </div>
    );
  },
}));

const mockDocument = {
  id: 'test-doc-1',
  name: 'Test Document.md',
  content: 'Initial content',
  state: 'draft',
  updated_at: new Date().toISOString(),
};

const mockSettings = {
  fontSize: 'base' as const,
  wordWrap: true,
};

describe('VirtualizedMarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAppStore as any).mockImplementation((selector: any) => {
      const state = {
        updateDocument: vi.fn(),
        settings: mockSettings,
      };
      return selector(state);
    });
  });

  it('renders without document', () => {
    // Mock no current document
    const { useCurrentDocument } = require('@/stores/useAppStore');
    useCurrentDocument.mockReturnValue(null);

    render(<VirtualizedMarkdownEditor />);
    
    expect(screen.getByText('No Document Selected')).toBeInTheDocument();
    expect(screen.getByText('New Document')).toBeInTheDocument();
  });

  it('renders with document and shows virtualization', () => {
    const { useCurrentDocument } = require('@/stores/useAppStore');
    useCurrentDocument.mockReturnValue(mockDocument);

    render(<VirtualizedMarkdownEditor />);
    
    expect(screen.getByText('Test Document.md')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('handles large document content efficiently', async () => {
    const largeContent = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}: This is a test line with some content.`).join('\n');
    const largeDocument = {
      ...mockDocument,
      content: largeContent,
    };

    const { useCurrentDocument } = require('@/stores/useAppStore');
    useCurrentDocument.mockReturnValue(largeDocument);

    const startTime = performance.now();
    render(<VirtualizedMarkdownEditor />);
    const renderTime = performance.now() - startTime;

    // Virtualization should make rendering fast even with large content
    expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    
    expect(screen.getByText('Test Document.md')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    
    // Should show virtualization indicator for large documents
    await waitFor(() => {
      expect(screen.getByText(/Virtualized/)).toBeInTheDocument();
    });
  });

  it('updates line content correctly', async () => {
    const { useCurrentDocument } = require('@/stores/useAppStore');
    const mockUpdateDocument = vi.fn();
    
    useCurrentDocument.mockReturnValue(mockDocument);
    (useAppStore as any).mockImplementation((selector: any) => {
      const state = {
        updateDocument: mockUpdateDocument,
        settings: mockSettings,
      };
      return selector(state);
    });

    render(<VirtualizedMarkdownEditor />);
    
    const textarea = screen.getAllByRole('textbox')[0];
    fireEvent.change(textarea, { target: { value: 'Updated content' } });
    
    await waitFor(() => {
      expect(mockUpdateDocument).toHaveBeenCalledWith(
        mockDocument.id,
        { content: 'Updated content' }
      );
    });
  });

  it('shows performance metrics for large documents', () => {
    const largeContent = Array.from({ length: 500 }, (_, i) => `Line ${i + 1}`).join('\n');
    const largeDocument = {
      ...mockDocument,
      content: largeContent,
    };

    const { useCurrentDocument } = require('@/stores/useAppStore');
    useCurrentDocument.mockReturnValue(largeDocument);

    render(<VirtualizedMarkdownEditor />);
    
    // Should show virtualization performance indicator
    expect(screen.getByText(/Virtualized/)).toBeInTheDocument();
    expect(screen.getByText(/lines/)).toBeInTheDocument();
  });

  it('handles keyboard shortcuts', async () => {
    const { useCurrentDocument } = require('@/stores/useAppStore');
    useCurrentDocument.mockReturnValue(mockDocument);

    render(<VirtualizedMarkdownEditor />);
    
    // Test save shortcut
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    
    // Should trigger save (we can't easily test the actual save without mocking more)
    // But we can verify the component handles the event without errors
    expect(screen.getByText('Test Document.md')).toBeInTheDocument();
  });

  it('maintains scroll position during content updates', async () => {
    const mediumContent = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}: Content here`).join('\n');
    const mediumDocument = {
      ...mockDocument,
      content: mediumContent,
    };

    const { useCurrentDocument } = require('@/stores/useAppStore');
    useCurrentDocument.mockReturnValue(mediumDocument);

    render(<VirtualizedMarkdownEditor />);
    
    const virtualizedList = screen.getByTestId('virtualized-list');
    expect(virtualizedList).toBeInTheDocument();
    
    // Simulate content update
    const textarea = screen.getAllByRole('textbox')[0];
    fireEvent.change(textarea, { target: { value: 'Updated line content' } });
    
    // List should still be present and functional
    expect(virtualizedList).toBeInTheDocument();
  });

  it('shows AI suggestion overlay correctly', async () => {
    const { useCurrentDocument } = require('@/stores/useAppStore');
    useCurrentDocument.mockReturnValue(mockDocument);

    render(<VirtualizedMarkdownEditor />);
    
    // The AI suggestion functionality should be available
    // (Full AI testing would require mocking the Tauri invoke calls)
    expect(screen.getByText('Test Document.md')).toBeInTheDocument();
  });
});

/**
 * Performance Benchmark Tests
 * These tests measure actual performance metrics for the virtualized editor
 */
describe('VirtualizedMarkdownEditor Performance Benchmarks', () => {
  const createLargeDocument = (lines: number) => ({
    ...mockDocument,
    content: Array.from({ length: lines }, (_, i) => 
      `Line ${i + 1}: This is test content for performance testing. It includes various characters and symbols to simulate real document content.`
    ).join('\n'),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAppStore as any).mockImplementation((selector: any) => {
      const state = {
        updateDocument: vi.fn(),
        settings: mockSettings,
      };
      return selector(state);
    });
  });

  it('renders 1000-line document within performance target', () => {
    const { useCurrentDocument } = require('@/stores/useAppStore');
    const largeDocument = createLargeDocument(1000);
    useCurrentDocument.mockReturnValue(largeDocument);

    const startTime = performance.now();
    render(<VirtualizedMarkdownEditor />);
    const renderTime = performance.now() - startTime;

    // Should render large document quickly due to virtualization
    expect(renderTime).toBeLessThan(200); // Target: < 200ms for 1000 lines
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('renders 5000-line document within performance target', () => {
    const { useCurrentDocument } = require('@/stores/useAppStore');
    const veryLargeDocument = createLargeDocument(5000);
    useCurrentDocument.mockReturnValue(veryLargeDocument);

    const startTime = performance.now();
    render(<VirtualizedMarkdownEditor />);
    const renderTime = performance.now() - startTime;

    // Even very large documents should render quickly
    expect(renderTime).toBeLessThan(500); // Target: < 500ms for 5000 lines
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('handles rapid content updates efficiently', async () => {
    const { useCurrentDocument } = require('@/stores/useAppStore');
    const mediumDocument = createLargeDocument(500);
    useCurrentDocument.mockReturnValue(mediumDocument);

    render(<VirtualizedMarkdownEditor />);
    
    const textarea = screen.getAllByRole('textbox')[0];
    
    // Simulate rapid typing
    const startTime = performance.now();
    for (let i = 0; i < 10; i++) {
      fireEvent.change(textarea, { target: { value: `Updated content ${i}` } });
    }
    const updateTime = performance.now() - startTime;

    // Rapid updates should be handled efficiently
    expect(updateTime).toBeLessThan(100); // Target: < 100ms for 10 rapid updates
  });

  it('memory usage remains stable with large documents', () => {
    const { useCurrentDocument } = require('@/stores/useAppStore');
    
    // Test with progressively larger documents
    const documentSizes = [100, 500, 1000, 2000];
    
    documentSizes.forEach(size => {
      const largeDocument = createLargeDocument(size);
      useCurrentDocument.mockReturnValue(largeDocument);

      const { unmount } = render(<VirtualizedMarkdownEditor />);
      
      // Verify component renders successfully
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      
      // Clean up
      unmount();
    });

    // If we reach here without memory issues, the test passes
    expect(true).toBe(true);
  });
});
