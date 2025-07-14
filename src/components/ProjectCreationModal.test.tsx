import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, vi, beforeEach, describe } from 'vitest'
import { ProjectCreationModal } from './ProjectCreationModal'

// Mock the Tauri API
const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke
}))

// Mock the Zustand store
const mockAddProject = vi.fn()
const mockSetCurrentProject = vi.fn()

vi.mock('../stores/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    addProject: mockAddProject,
    setCurrentProject: mockSetCurrentProject
  }))
}))

describe('ProjectCreationModal', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    mockInvoke.mockResolvedValue(JSON.stringify({
      id: 'test-project-id',
      name: 'Test Project',
      path: './projects/test-project',
      created_at: 1640995200, // 2022-01-01 00:00:00 UTC
      updated_at: 1640995200
    }))
  })

  test('renders modal when open', () => {
    render(
      <ProjectCreationModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    )

    expect(screen.getByText('Create New Project')).toBeInTheDocument()
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  test('does not render modal when closed', () => {
    render(
      <ProjectCreationModal 
        open={false} 
        onOpenChange={mockOnOpenChange} 
      />
    )

    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument()
  })

  test('calls onOpenChange when cancel button is clicked', () => {
    render(
      <ProjectCreationModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  test('validates empty project name', async () => {
    render(
      <ProjectCreationModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    )

    const createButton = screen.getByRole('button', { name: /create project/i })
    
    // Create button should be disabled when input is empty
    expect(createButton).toBeDisabled()
    
    // Try to submit form with empty input
    fireEvent.click(createButton)
    
    // Should not call the backend
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  test('successfully creates project', async () => {
    render(
      <ProjectCreationModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    )

    const input = screen.getByLabelText('Project Name')
    const createButton = screen.getByRole('button', { name: /create project/i })

    // Enter project name
    fireEvent.change(input, { target: { value: 'Test Project' } })
    
    // Button should now be enabled
    expect(createButton).not.toBeDisabled()

    // Submit the form
    fireEvent.click(createButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument()
    })

    // Should call the Tauri backend command
    expect(mockInvoke).toHaveBeenCalledWith('create_project', { name: 'Test Project' })

    // Wait for async operations to complete
    await waitFor(() => {
      // Should add project to store
      expect(mockAddProject).toHaveBeenCalledWith({
        id: 'test-project-id',
        name: 'Test Project',
        path: './projects/test-project'
      })

      // Should set as current project
      expect(mockSetCurrentProject).toHaveBeenCalledWith('test-project-id')

      // Should close modal
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  test('handles backend error gracefully', async () => {
    // Mock backend error
    mockInvoke.mockRejectedValue(new Error('Database connection failed'))

    render(
      <ProjectCreationModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    )

    const input = screen.getByLabelText('Project Name')
    const createButton = screen.getByRole('button', { name: /create project/i })

    // Enter project name
    fireEvent.change(input, { target: { value: 'Test Project' } })
    fireEvent.click(createButton)

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/database connection failed/i)).toBeInTheDocument()
    })

    // Should not add project to store or close modal
    expect(mockAddProject).not.toHaveBeenCalled()
    expect(mockSetCurrentProject).not.toHaveBeenCalled()
    expect(mockOnOpenChange).not.toHaveBeenCalled()
  })

  test('sanitizes project names correctly', async () => {
    render(
      <ProjectCreationModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    )

    const input = screen.getByLabelText('Project Name')
    const createButton = screen.getByRole('button', { name: /create project/i })

    // Enter project name with spaces and special characters
    fireEvent.change(input, { target: { value: '  My Special Project  ' } })
    fireEvent.click(createButton)

    await waitFor(() => {
      // Should trim whitespace when calling backend
      expect(mockInvoke).toHaveBeenCalledWith('create_project', { name: 'My Special Project' })
    })
  })

  test('disables form elements during loading', async () => {
    // Mock slow backend response
    let resolvePromise: (value: string) => void
    const slowPromise = new Promise<string>((resolve) => {
      resolvePromise = resolve
    })
    mockInvoke.mockReturnValue(slowPromise)

    render(
      <ProjectCreationModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    )

    const input = screen.getByLabelText('Project Name')
    const createButton = screen.getByRole('button', { name: /create project/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })

    // Enter project name and submit
    fireEvent.change(input, { target: { value: 'Test Project' } })
    fireEvent.click(createButton)

    // During loading, form elements should be disabled
    await waitFor(() => {
      expect(input).toBeDisabled()
      expect(createButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })

    // Resolve the promise
    resolvePromise!(JSON.stringify({
      id: 'test-id',
      name: 'Test Project',
      path: './projects/test-project',
      created_at: 1640995200,
      updated_at: 1640995200
    }))

    // After completion, modal should close
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
