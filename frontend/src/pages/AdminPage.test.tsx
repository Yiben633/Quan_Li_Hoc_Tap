import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AdminPage } from './AdminPage'

vi.mock('../features/admin/admin.hooks', () => ({
  useActivityLogsQuery: vi.fn(),
  useAdminFeedbackQuery: vi.fn(),
  useAdminFeedbackUpdateMutation: vi.fn(),
  useAdminStatisticsQuery: () => ({
    isLoading: false,
    isError: false,
    data: {
      totalUsers: 0,
      activityToday: 0,
      openTasks: 0,
      activeStudyPlans: 0,
      analytics: [],
      attention: { overduePlans: 0 },
      plansRequiringAttention: [],
      recentAdminActivity: [],
    },
    refetch: vi.fn(),
  }),
  useAdminUsersQuery: vi.fn(),
  useAdminUserUpdateMutation: vi.fn(),
  useSystemContentSupportQuery: vi.fn(),
  useTopicTemplateImportMutation: vi.fn(),
}))

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

describe('AdminPage navigation availability', () => {
  it('keeps coming-soon modules informational and does not navigate when clicked', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/admin?tab=overview']}>
        <AdminPage />
        <LocationProbe />
      </MemoryRouter>,
    )

    const comingSoon = screen.getByLabelText('Công việc: Sắp có')
    expect(comingSoon.tagName).toBe('DIV')
    expect(screen.queryByRole('button', { name: 'Công việc' })).not.toBeInTheDocument()

    await user.click(comingSoon)

    expect(screen.getByTestId('location')).toHaveTextContent('/admin?tab=overview')
    expect(screen.getByRole('heading', { name: 'Tổng quan hệ thống' })).toBeInTheDocument()
  })
})
