import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { natureAssets } from '../../config/natureAssets'
import { NatureMascot } from './NatureMascot'

describe('NatureMascot', () => {
  it('renders one eager decorative image with a fixed size and CSS motion class', () => {
    const { container } = render(
      <NatureMascot animal="fox" motion="study" priority size={180} />,
    )

    const mascot = container.querySelector('.nature-mascot')
    const image = container.querySelector('img')

    expect(mascot).toHaveClass('nature-mascot-motion-study')
    expect(mascot).toHaveAttribute('aria-hidden', 'true')
    expect(image).toHaveAttribute('src', natureAssets.mascots.fox)
    expect(image).toHaveAttribute('width', '180')
    expect(image).toHaveAttribute('height', '180')
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('alt', '')
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('exposes a meaningful mascot alternative when requested', () => {
    const { container } = render(
      <NatureMascot animal="owl" alt="Cú mèo đang đọc sách" decorative={false} />,
    )

    expect(container.querySelector('.nature-mascot')).not.toHaveAttribute('aria-hidden')
    expect(container.querySelector('img')).toHaveAttribute('alt', 'Cú mèo đang đọc sách')
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy')
  })
})
