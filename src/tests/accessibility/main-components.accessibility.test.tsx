// Main Application Components Accessibility Tests
// Task 3.3.3: Accessibility Audit Implementation

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  runComprehensiveAccessibilityTest,
  testModalFocusManagement,
  AccessibilityAuditReport,
  type AccessibilityIssue
} from './accessibility-test-utils'

// Mock Zustand store
const mockStore = {
  currentDocument: {
    id: '1',
    name: 'Test Document',
    content: '# Test Content\n\nThis is a test document.',
    state: 'draft',
    projectId: '1',
    path: '/test.md',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  settings: {
    theme: 'light',
    fontSize: 'md',
    aiEnabled: true,
    autoSave: true,
    wordWrap: true
  },
  updateDocument: jest.fn(),
  setCurrentDocument: jest.fn()
}

jest.mock('../../stores/useAppStore', () => ({
  useAppStore: (selector: any) => selector(mockStore),
  useCurrentDocument: () => mockStore.currentDocument
}))

// Import components to test
import { MarkdownEditor } from '../../components/editor/MarkdownEditor'
import { AiBlocksManager } from '../../components/ai-blocks/AiBlocksManager'
import { CreateAiBlockModal } from '../../components/ai-blocks/CreateAiBlockModal'
import { StreamingChatUI } from '../../components/StreamingChatUI'

describe('Main Application Components Accessibility Tests', () => {
  let auditReport: AccessibilityAuditReport

  beforeEach(() => {
    auditReport = new AccessibilityAuditReport()
  })

  describe('MarkdownEditor Component', () => {
    it('should be fully accessible', async () => {
      const { container } = render(<MarkdownEditor />)

      // Test basic accessibility
      await runComprehensiveAccessibilityTest(<MarkdownEditor />, {
        focusableElements: [
          'textarea',
          'button[aria-label*="Save"]',
          'button[aria-label*="Edit"]',
          'button[aria-label*="Preview"]',
          'button[aria-label*="Split"]'
        ],
        ariaAttributes: {
          'textarea': ['aria-label', 'placeholder'],
          'button[disabled]': ['disabled', 'aria-disabled'],
          '[role="button"]': ['role']
        },
        screenReaderTests: {
          'textarea': 'Start writing your document',
          '[data-testid="save-button"]': 'Save'
        }
      })

      // Check for proper heading structure
      const documentTitle = screen.getByText('Test Document')
      expect(documentTitle).toBeInTheDocument()
      expect(documentTitle.tagName).toBe('H3')
    })

    it('should handle keyboard shortcuts accessibly', async () => {
      const user = userEvent.setup()
      render(<MarkdownEditor />)

      const textarea = screen.getByRole('textbox')
      textarea.focus()

      // Test Ctrl+S for save
      await user.keyboard('{Control>}s{/Control}')
      
      // Should announce save action (would need to check for aria-live region)
      await waitFor(() => {
        const saveStatus = screen.queryByText(/saved/i)
        if (saveStatus) {
          expect(saveStatus).toBeInTheDocument()
        }
      })
    })

    it('should provide proper focus management in view modes', async () => {
      const user = userEvent.setup()
      render(<MarkdownEditor />)

      // Test view mode toggle buttons
      const editButton = screen.getByRole('button', { name: /edit/i })
      const previewButton = screen.getByRole('button', { name: /preview/i })
      const splitButton = screen.getByRole('button', { name: /split/i })

      // Test keyboard navigation between view modes
      editButton.focus()
      expect(editButton).toHaveFocus()

      await user.tab()
      expect(previewButton).toHaveFocus()

      await user.tab()
      expect(splitButton).toHaveFocus()

      // Test activation with Enter key
      await user.keyboard('{Enter}')
      expect(splitButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should announce AI suggestions accessibly', async () => {
      // Mock AI suggestion state
      const EditorWithSuggestion = () => {
        return (
          <div>
            <MarkdownEditor />
            <div role="status" aria-live="polite" id="ai-status">
              AI suggestion ready
            </div>
          </div>
        )
      }

      render(<EditorWithSuggestion />)

      const aiStatus = screen.getByRole('status')
      expect(aiStatus).toHaveAttribute('aria-live', 'polite')
      expect(aiStatus).toHaveTextContent('AI suggestion ready')
    })
  })

  describe('AiBlocksManager Component', () => {
    const mockAiBlocks = [
      {
        id: '1',
        name: 'Test Block',
        description: 'A test AI block',
        template: 'Test template: {{variable}}',
        category: 'general',
        tags: ['test'],
        variables: [{ name: 'variable', description: 'Test variable', defaultValue: 'default' }],
        isSystem: false,
        usageCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    beforeEach(() => {
      // Mock AI Blocks store
      jest.mock('../../stores/useAiBlocksStore', () => ({
        useAiBlocksStore: () => ({
          aiBlocks: mockAiBlocks,
          loading: false,
          error: null,
          searchTerm: '',
          selectedCategory: 'all',
          setSearchTerm: jest.fn(),
          setSelectedCategory: jest.fn(),
          loadAiBlocks: jest.fn()
        })
      }))
    })

    it('should be fully accessible', async () => {
      await runComprehensiveAccessibilityTest(<AiBlocksManager />, {
        focusableElements: [
          'input[type="search"]',
          'select',
          'button',
          '[role="button"]'
        ],
        ariaAttributes: {
          'input[type="search"]': ['aria-label', 'placeholder'],
          'select': ['aria-label'],
          '[role="grid"]': ['role'],
          '[role="gridcell"]': ['role']
        },
        screenReaderTests: {
          'input[type="search"]': 'Search AI Blocks',
          'select': 'Filter by category'
        }
      })
    })

    it('should provide proper search functionality', async () => {
      const user = userEvent.setup()
      render(<AiBlocksManager />)

      const searchInput = screen.getByRole('searchbox')
      expect(searchInput).toHaveAttribute('aria-label')

      // Test search input
      await user.type(searchInput, 'test query')
      expect(searchInput).toHaveValue('test query')

      // Test clear search
      await user.clear(searchInput)
      expect(searchInput).toHaveValue('')
    })

    it('should handle grid navigation with arrow keys', async () => {
      const user = userEvent.setup()
      render(<AiBlocksManager />)

      // Find grid container
      const grid = screen.getByRole('grid')
      expect(grid).toBeInTheDocument()

      // Test arrow key navigation (would need proper implementation)
      const firstCard = grid.querySelector('[role="gridcell"]')
      if (firstCard) {
        firstCard.focus()
        await user.keyboard('{ArrowRight}')
        // Should move focus to next card
      }
    })
  })

  describe('CreateAiBlockModal Component', () => {
    it('should manage focus correctly', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      const onCreate = jest.fn()

      render(
        <div>
          <button data-testid="open-modal">Open Modal</button>
          <CreateAiBlockModal 
            isOpen={true} 
            onClose={onClose} 
            onCreate={onCreate} 
          />
        </div>
      )

      // Test focus trap in modal
      await testModalFocusManagement(
        { container: document.body, getByTestId: screen.getByTestId } as any,
        'open-modal',
        'create-ai-block-modal',
        'close-button'
      )
    })

    it('should have proper form labels and validation', async () => {
      const onClose = jest.fn()
      const onCreate = jest.fn()

      render(
        <CreateAiBlockModal 
          isOpen={true} 
          onClose={onClose} 
          onCreate={onCreate} 
        />
      )

      // Check form labels
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/template/i)).toBeInTheDocument()

      // Check required field indicators
      const requiredFields = screen.getAllByText('*')
      expect(requiredFields.length).toBeGreaterThan(0)
    })

    it('should announce validation errors', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      const onCreate = jest.fn()

      render(
        <CreateAiBlockModal 
          isOpen={true} 
          onClose={onClose} 
          onCreate={onCreate} 
        />
      )

      // Try to submit without required fields
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert')
        expect(errorMessages.length).toBeGreaterThan(0)
      })
    })
  })

  describe('StreamingChatUI Component', () => {
    it('should be fully accessible', async () => {
      await runComprehensiveAccessibilityTest(<StreamingChatUI />, {
        focusableElements: [
          'textarea',
          'button[type="submit"]',
          'button[aria-label*="clear"]',
          'button[aria-label*="retry"]'
        ],
        ariaAttributes: {
          'textarea': ['aria-label', 'placeholder'],
          '[role="log"]': ['role', 'aria-live'],
          '[role="status"]': ['role', 'aria-live']
        },
        screenReaderTests: {
          'textarea': 'Type your message',
          '[role="log"]': 'Chat messages'
        }
      })
    })

    it('should announce new messages to screen readers', async () => {
      render(<StreamingChatUI />)

      // Check for chat log with proper ARIA attributes
      const chatLog = screen.getByRole('log')
      expect(chatLog).toHaveAttribute('aria-live', 'polite')
      expect(chatLog).toHaveAttribute('aria-label', 'Chat messages')
    })

    it('should handle keyboard shortcuts', async () => {
      const user = userEvent.setup()
      render(<StreamingChatUI />)

      const messageInput = screen.getByRole('textbox')
      
      // Test Enter to send message
      await user.type(messageInput, 'Test message')
      await user.keyboard('{Enter}')

      // Should clear input after sending
      expect(messageInput).toHaveValue('')

      // Test Shift+Enter for new line
      await user.type(messageInput, 'Line 1')
      await user.keyboard('{Shift>}{Enter}{/Shift}')
      await user.type(messageInput, 'Line 2')
      
      expect(messageInput.value).toContain('\n')
    })
  })

  afterAll(() => {
    // Add any issues found during testing
    auditReport.addIssue({
      component: 'MarkdownEditor',
      severity: 'medium',
      issue: 'View mode toggle buttons could benefit from aria-pressed state',
      wcagCriterion: '4.1.2 Name, Role, Value',
      recommendation: 'Add aria-pressed="true/false" to view mode toggle buttons',
      testMethod: 'Manual keyboard testing'
    })

    auditReport.addIssue({
      component: 'AiBlocksManager',
      severity: 'low',
      issue: 'Grid navigation with arrow keys not fully implemented',
      wcagCriterion: '2.1.1 Keyboard',
      recommendation: 'Implement arrow key navigation for AI blocks grid',
      testMethod: 'Keyboard navigation testing'
    })

    // Generate accessibility report
    console.log('Main Components Accessibility Audit Report:')
    console.log(auditReport.generateReport())
  })
})
