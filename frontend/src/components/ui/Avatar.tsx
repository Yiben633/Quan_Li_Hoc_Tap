import { useEffect, useState } from 'react'

type AvatarProps = {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const initial = name.trim().slice(0, 1).toUpperCase()

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (src && !failed) {
    return (
      <img
        className={`avatar avatar-${size}`}
        src={src}
        alt={name}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span className={`avatar avatar-${size}`} aria-label={name}>
      {initial}
    </span>
  )
}
