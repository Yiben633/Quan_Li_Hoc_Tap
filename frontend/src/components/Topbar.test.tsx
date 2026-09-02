import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Topbar } from './Topbar'

vi.mock('../features/notifications/notifications.hooks', () => ({
  useMarkAllNotificationsReadMutation: () => ({ mutate: vi.fn() }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn() }),
  useNotificationsQuery: () => ({ data: { items: [], pagination: { total: 0 } }, isError: false, isLoading: false }),
}))

function renderTopbar(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Topbar menuOpen={false} onMenu={() => undefined} />
    </MemoryRouter>,
  )
}

describe('Topbar contextual search', () => {
  it.each([
    ['/tasks', 'Tìm công việc', 'Tìm công việc...'],
    ['/notes', 'Tìm ghi chú', 'Tìm ghi chú...'],
    ['/topics', 'Tìm môn học', 'Tìm môn học...'],
  ])('uses accurate wording on %s', (pathname, label, placeholder) => {
    renderTopbar(pathname)

    expect(screen.getByRole('textbox', { name: label })).toHaveAttribute('placeholder', placeholder)
  })

  it('hides the search form where no contextual search is supported', () => {
    renderTopbar('/admin')

    expect(screen.queryByRole('search')).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })
})
