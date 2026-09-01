import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Drawer } from './Drawer'
import { Dropdown } from './Dropdown'
import { Modal } from './Modal'

function ModalHarness() {
  const [open, setOpen] = useState(false)
  return <><button type="button" onClick={() => setOpen(true)}>Mở hộp thoại</button><Modal open={open} title="Chỉnh sửa công việc" onClose={() => setOpen(false)} footer={<button type="button">Lưu</button>}><label htmlFor="task-title">Tên công việc</label><input id="task-title" /></Modal></>
}

function DrawerHarness() {
  const [open, setOpen] = useState(false)
  return <><button type="button" onClick={() => setOpen(true)}>Mở ngăn kéo</button><Drawer open={open} title="Chi tiết" onClose={() => setOpen(false)}><button type="button">Tác vụ</button></Drawer></>
}

describe('accessible overlays and menus', () => {
  it('traps focus in a modal and restores it after Escape', async () => {
    const user = userEvent.setup()
    render(<ModalHarness />)
    const opener = screen.getByRole('button', { name: 'Mở hộp thoại' })
    await user.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'Chỉnh sửa công việc' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đóng' })).toHaveFocus())

    await user.tab()
    expect(screen.getByLabelText('Tên công việc')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Lưu' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Đóng' })).toHaveFocus()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(opener).toHaveFocus()
  })

  it('keeps focus in a drawer and closes it with Escape', async () => {
    const user = userEvent.setup()
    render(<DrawerHarness />)
    const opener = screen.getByRole('button', { name: 'Mở ngăn kéo' })
    await user.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'Chi tiết' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đóng' })).toHaveFocus())

    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Tác vụ' })).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(opener).toHaveFocus()
  })

  it('supports keyboard navigation and focus return for action menus', async () => {
    const user = userEvent.setup()
    render(<Dropdown ariaLabel="Thao tác công việc" label="Thao tác"><button type="button">Chỉnh sửa</button><button type="button">Xóa</button></Dropdown>)
    const trigger = screen.getByRole('button', { name: 'Thao tác công việc' })
    trigger.focus()

    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Chỉnh sửa' })).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Xóa' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('button', { name: 'Chỉnh sửa' })).toHaveFocus()
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
