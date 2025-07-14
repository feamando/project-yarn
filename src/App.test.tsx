import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from './App'

// Mock the Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn().mockResolvedValue('Hello from Rust!')
}))

test('renders welcome message', () => {
  render(<App />)
  const welcomeElement = screen.getByText(/Welcome to Project Yarn!/i)
  expect(welcomeElement).toBeInTheDocument()
})

test('renders greet input and button', () => {
  render(<App />)
  const inputElement = screen.getByPlaceholderText(/Enter a name.../i)
  const buttonElement = screen.getByText(/Greet/i)
  
  expect(inputElement).toBeInTheDocument()
  expect(buttonElement).toBeInTheDocument()
})

test('greet functionality works', async () => {
  const { invoke } = await import('@tauri-apps/api/tauri')
  
  render(<App />)
  
  const inputElement = screen.getByPlaceholderText(/Enter a name.../i)
  const buttonElement = screen.getByText(/Greet/i)
  
  fireEvent.change(inputElement, { target: { value: 'Test User' } })
  fireEvent.click(buttonElement)
  
  await waitFor(() => {
    expect(invoke).toHaveBeenCalledWith('greet', { name: 'Test User' })
  })
  
  const greetMessage = await screen.findByText(/Hello from Rust!/i)
  expect(greetMessage).toBeInTheDocument()
})
