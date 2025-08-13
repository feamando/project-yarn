import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
// no-op
import ThemeProvider from '@/components/theme-provider'

describe('ThemeProvider', () => {
  it('mounts without crashing', () => {
    const { container } = render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    )
    expect(container).toBeTruthy()
  })
})

