import { act, render } from '@testing-library/react'
import { Profiler } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { natureAssets } from '../../config/natureAssets'
import { NatureMascot } from './NatureMascot'

describe('NatureMascot', () => {
  it('renders exactly one image from the requested animal source', () => {
    const { container } = render(
      <NatureMascot animal="fox" motion="study" priority size={180} />,
    )

    const image = container.querySelector('img')

    expect(image).toHaveAttribute('src', natureAssets.mascots.fox)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('applies the requested CSS motion class without a frame timer', () => {
    const setInterval = vi.fn()
    const requestAnimationFrame = vi.fn()
    vi.stubGlobal('setInterval', setInterval)
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)

    try {
      const { container } = render(<NatureMascot animal="fox" motion="study" />)

      expect(container.querySelector('.nature-mascot')).toHaveClass('nature-mascot-motion-study')
      expect(container.querySelector('.nature-mascot')).toHaveClass('nature-motion')
      expect(setInterval).not.toHaveBeenCalled()
      expect(requestAnimationFrame).not.toHaveBeenCalled()
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  it('does not re-render or swap its image source over time for CSS motion', () => {
    vi.useFakeTimers()
    const onRender = vi.fn()

    try {
      const { container } = render(
        <Profiler id="nature-mascot" onRender={onRender}>
          <NatureMascot animal="fox" motion="study" />
        </Profiler>,
      )
      const image = container.querySelector('img')
      const initialSource = image?.getAttribute('src')

      act(() => {
        vi.advanceTimersByTime(60_000)
      })

      expect(onRender).toHaveBeenCalledTimes(1)
      expect(container.querySelector('img')).toBe(image)
      expect(image).toHaveAttribute('src', initialSource ?? '')
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('uses the requested custom size and eager priority', () => {
    const { container } = render(<NatureMascot animal="fox" priority size={180} />)
    const image = container.querySelector('img')

    expect(image).toHaveAttribute('width', '180')
    expect(image).toHaveAttribute('height', '180')
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('fetchpriority', 'high')
  })

  it('hides decorative mascots from assistive technology', () => {
    const { container } = render(<NatureMascot animal="fox" />)

    expect(container.querySelector('.nature-mascot')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
  })

  it('exposes a meaningful mascot alternative when requested', () => {
    const { container } = render(
      <NatureMascot animal="owl" alt="Cú mèo đang đọc sách" decorative={false} />,
    )

    expect(container.querySelector('.nature-mascot')).not.toHaveAttribute('aria-hidden')
    expect(container.querySelector('img')).toHaveAttribute('alt', 'Cú mèo đang đọc sách')
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy')
    expect(container.querySelector('img')).not.toHaveAttribute('fetchpriority')
  })

})
