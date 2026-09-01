import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../config/features', () => ({ aiFeaturesEnabled: false }))

import { AICoachPage } from './AICoachPage'

describe('AICoachPage when AI is disabled', () => {
  it('renders a safe unavailable state without a chat interface', () => {
    render(<MemoryRouter initialEntries={['/ai-coach']}><AICoachPage /></MemoryRouter>)

    expect(screen.getByRole('status')).toHaveTextContent('AI Coach chưa khả dụng trong môi trường này.')
    expect(screen.getByRole('link', { name: 'Công việc' })).toHaveAttribute('href', '/tasks')
    expect(screen.getByRole('link', { name: 'Kế hoạch' })).toHaveAttribute('href', '/study-plans')
    expect(screen.queryByLabelText('Tin nhắn cho Trợ lý AI')).not.toBeInTheDocument()
  })
})
