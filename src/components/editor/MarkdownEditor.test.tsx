import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { expect, vi, beforeEach, afterEach, describe, it } from 'vitest'
import MarkdownEditor from './MarkdownEditor'

// Mock the Tauri API
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke
}))

// Mock the Zustand store
const mockUpdateDocument = vi.fn()
const mockUseCurrentDocument = vi.fn()

vi.mock('../../stores/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    updateDocument: mockUpdateDocument,
    settings: {
      autoSave: false,
      fontSize: 'base' as const,
      wordWrap: true,
    },
  })),
  useCurrentDocument: mockUseCurrentDocument,
}))

describe('MarkdownEditor - AI Autocomplete Feature', () => {
  const mockDocument = {
    id: 'test-doc-1',
    name: 'Test Document',
    content: 'Initial content',
    state: 'draft' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup store mocks
    mockUseCurrentDocument.mockReturnValue(mockDocument)
    
    // Setup default IPC mock for get_autocomplete
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === 'get_autocomplete') {
        return Promise.resolve('This is an AI-generated suggestion based on your context.')
      }
      return Promise.resolve('')
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('AI Autocomplete Debouncing', () => {
    it('should debounce input and call get_autocomplete after 300ms', async () => {
      vi.useFakeTimers()
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type some content
      fireEvent.change(textarea, { target: { value: 'This is a test document with some content' } })
      
      // Should not call get_autocomplete immediately
      expect(mockInvoke).not.toHaveBeenCalled()
      
      // Fast forward 200ms - should still not call
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(mockInvoke).not.toHaveBeenCalled()
      
      // Fast forward another 150ms (total 350ms) - should call now
      act(() => {
        vi.advanceTimersByTime(150)
      })
      
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_autocomplete', {
          context: expect.stringContaining('test document with some content')
        })
      })
    })

    it('should reset debounce timer when user continues typing', async () => {
      vi.useFakeTimers()
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type some content
      fireEvent.change(textarea, { target: { value: 'First part' } })
      
      // Wait 200ms
      act(() => {
        vi.advanceTimersByTime(200)
      })
      
      // Type more content (should reset timer)
      fireEvent.change(textarea, { target: { value: 'First part second part' } })
      
      // Wait another 200ms (total would be 400ms from first input, but only 200ms from second)
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(mockInvoke).not.toHaveBeenCalled()
      
      // Wait another 150ms (300ms from second input)
      act(() => {
        vi.advanceTimersByTime(150)
      })
      
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_autocomplete', {
          context: expect.stringContaining('First part second part')
        })
      })
    })

    it('should not trigger autocomplete for short content (less than 10 characters)', async () => {
      vi.useFakeTimers()
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type short content
      fireEvent.change(textarea, { target: { value: 'Short' } })
      
      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      // Should not call get_autocomplete for short content
      expect(mockInvoke).not.toHaveBeenCalled()
    })
  })

  describe('AI Suggestion Display', () => {
    it('should show loading indicator while fetching AI suggestion', async () => {
      vi.useFakeTimers()
      
      // Mock a slow response
      mockInvoke.mockImplementation((cmd) => {
        if (cmd === 'get_autocomplete') {
          return new Promise(resolve => setTimeout(() => resolve('AI suggestion'), 1000))
        }
        return Promise.resolve('')
      })
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type content to trigger autocomplete
      fireEvent.change(textarea, { target: { value: 'This is a long enough text to trigger AI autocomplete' } })
      
      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByText('AI thinking...')).toBeInTheDocument()
      })
    })

    it('should display AI suggestion overlay when received', async () => {
      vi.useFakeTimers()
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type content
      fireEvent.change(textarea, { target: { value: 'This is a document about artificial intelligence and machine learning' } })
      
      // Wait for debounce and API call
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        expect(screen.getByText('AI Suggestion')).toBeInTheDocument()
        expect(screen.getByText('This is an AI-generated suggestion based on your context.')).toBeInTheDocument()
        expect(screen.getByText('Press Tab to accept, Esc to dismiss')).toBeInTheDocument()
      })
    })

    it('should show AI ready indicator in status bar', async () => {
      vi.useFakeTimers()
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type content
      fireEvent.change(textarea, { target: { value: 'This is a long document with plenty of context for AI' } })
      
      // Wait for debounce and API call
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        expect(screen.getByText('✨ AI Ready')).toBeInTheDocument()
        expect(screen.getByText('AI suggestion ready')).toBeInTheDocument()
      })
    })
  })

  describe('AI Suggestion Interactions', () => {
    const setupWithSuggestion = async () => {
      vi.useFakeTimers()
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type content to trigger autocomplete
      fireEvent.change(textarea, { target: { value: 'This is a document about machine learning algorithms' } })
      
      // Wait for debounce and suggestion to appear
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        expect(screen.getByText('AI Suggestion')).toBeInTheDocument()
      })
      
      return { textarea }
    }

    it('should accept suggestion when Tab key is pressed', async () => {
      const { textarea } = await setupWithSuggestion()
      
      // Press Tab to accept suggestion
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' })
      
      // Should insert suggestion into textarea
      await waitFor(() => {
        expect(textarea).toHaveValue(
          'This is a document about machine learning algorithmsThis is an AI-generated suggestion based on your context.'
        )
      })
      
      // Should hide the suggestion overlay
      expect(screen.queryByText('AI Suggestion')).not.toBeInTheDocument()
    })

    it('should dismiss suggestion when Escape key is pressed', async () => {
      const { textarea } = await setupWithSuggestion()
      
      // Press Escape to dismiss suggestion
      fireEvent.keyDown(textarea, { key: 'Escape', code: 'Escape' })
      
      // Should hide the suggestion overlay
      await waitFor(() => {
        expect(screen.queryByText('AI Suggestion')).not.toBeInTheDocument()
      })
    })

    it('should accept suggestion when Accept button is clicked', async () => {
      const { textarea } = await setupWithSuggestion()
      
      // Click Accept button
      const acceptButton = screen.getByRole('button', { name: 'Accept' })
      fireEvent.click(acceptButton)
      
      // Should insert suggestion into textarea
      await waitFor(() => {
        expect(textarea).toHaveValue(
          'This is a document about machine learning algorithmsThis is an AI-generated suggestion based on your context.'
        )
      })
      
      // Should hide the suggestion overlay
      expect(screen.queryByText('AI Suggestion')).not.toBeInTheDocument()
    })

    it('should dismiss suggestion when Dismiss button is clicked', async () => {
      await setupWithSuggestion()
      
      // Click Dismiss button
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' })
      fireEvent.click(dismissButton)
      
      // Should hide the suggestion overlay
      await waitFor(() => {
        expect(screen.queryByText('AI Suggestion')).not.toBeInTheDocument()
      })
    })

    it('should dismiss suggestion when close button (×) is clicked', async () => {
      await setupWithSuggestion()
      
      // Click close button
      const closeButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(closeButton)
      
      // Should hide the suggestion overlay
      await waitFor(() => {
        expect(screen.queryByText('AI Suggestion')).not.toBeInTheDocument()
      })
    })
  })

  describe('Context Handling', () => {
    it('should send last 200 characters as context to get_autocomplete', async () => {
      vi.useFakeTimers()
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type long content (more than 200 characters)
      const longContent = 'A'.repeat(250) + 'This should be included in context'
      fireEvent.change(textarea, { target: { value: longContent } })
      
      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_autocomplete', {
          context: expect.stringMatching(/^A{50}This should be included in context$/)
        })
      })
    })

    it('should handle cursor position correctly when sending context', async () => {
      vi.useFakeTimers()
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type content and position cursor in middle
      fireEvent.change(textarea, { target: { value: 'Beginning of document. Middle section. End of document.' } })
      
      // Move cursor to middle and type more content
      textarea.setSelectionRange(25, 25) // Position after "Middle"
      fireEvent.change(textarea, { target: { value: 'Beginning of document. Middle inserted text section. End of document.' } })
      
      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('get_autocomplete', {
          context: expect.stringContaining('Middle inserted text')
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      vi.useFakeTimers()
      
      // Mock API error
      mockInvoke.mockImplementation((cmd) => {
        if (cmd === 'get_autocomplete') {
          return Promise.reject(new Error('AI service unavailable'))
        }
        return Promise.resolve('')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type content
      fireEvent.change(textarea, { target: { value: 'This should trigger an error in the AI service' } })
      
      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'AI autocomplete failed:',
          expect.any(Error)
        )
      })
      
      // Should not show suggestion overlay
      expect(screen.queryByText('AI Suggestion')).not.toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle empty or invalid AI responses', async () => {
      vi.useFakeTimers()
      
      // Mock empty response
      mockInvoke.mockImplementation((cmd) => {
        if (cmd === 'get_autocomplete') {
          return Promise.resolve('')
        }
        return Promise.resolve('')
      })
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type content
      fireEvent.change(textarea, { target: { value: 'This should not show any suggestion' } })
      
      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
      
      // Should not show suggestion overlay for empty response
      expect(screen.queryByText('AI Suggestion')).not.toBeInTheDocument()
    })
  })

  describe('Integration with Existing Features', () => {
    it('should clear suggestions when document changes', async () => {
      vi.useFakeTimers()
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type content and get suggestion
      fireEvent.change(textarea, { target: { value: 'This is a document with AI suggestions' } })
      
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      await waitFor(() => {
        expect(screen.getByText('AI Suggestion')).toBeInTheDocument()
      })
      
      // Change document in store
      mockUseCurrentDocument.mockReturnValue({
        ...mockDocument,
        id: 'different-doc',
        content: 'Different content',
      })
      
      // Re-render to trigger useEffect
      render(<MarkdownEditor />)
      
      // Should clear suggestions
      expect(screen.queryByText('AI Suggestion')).not.toBeInTheDocument()
    })

    it('should update cursor position tracking in status bar', async () => {
      
      render(<MarkdownEditor />)
      const textarea = screen.getByPlaceholderText('Start writing your document...') as HTMLTextAreaElement
      
      // Type content
      fireEvent.change(textarea, { target: { value: 'Hello world' } })
      
      // Check cursor position in status bar
      await waitFor(() => {
        expect(screen.getByText(/Column 12/)).toBeInTheDocument()
      })
      
      // Move cursor
      fireEvent.click(textarea)
      textarea.setSelectionRange(5, 5)
      fireEvent.select(textarea)
      
      await waitFor(() => {
        expect(screen.getByText(/Column 6/)).toBeInTheDocument()
      })
    })
  })
})
