import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Brand } from '@/components/brand'

describe('Brand', () => {
  it('renders the brand component', () => {
    render(<Brand />)
    // Adjust the assertion based on what your Brand component renders
    expect(screen.getByRole('link')).toBeDefined()
  })
})
