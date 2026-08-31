import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NatureEmptyState } from './NatureEmptyState'

describe('NatureEmptyState', () => {
  it('renders its mascot, semantic size, and both actions', () => {
    const { container } = render(
      <NatureEmptyState
        mascot="tasks"
        size="lg"
        title="Chưa có công việc"
        description="Bắt đầu với một bước nhỏ."
        action={<button type="button">Thêm công việc</button>}
        secondaryAction={<a href="/study-plans">Mở kế hoạch</a>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Chưa có công việc' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thêm công việc' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mở kế hoạch' })).toHaveAttribute('href', '/study-plans')
    expect(container.querySelector('.nature-empty-state-lg')).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('width', '132')
  })
})
