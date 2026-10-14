import { useEffect, useState } from 'react'

/**
 * Actor/director profile photo with a clean fallback.
 *
 * TMDB provides real `profile_path` values; if a photo is missing or fails to
 * load, a branded placeholder with the person's initials is shown instead of a
 * broken image or a random face.
 */
export default function PersonPhoto({ src, name, className = '', alt }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  const label = alt || name || ''
  const initials = ((name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')) || '?'

  if (!src || failed) {
    return (
      <div
        className={`personPhoto ${className} personPhoto--placeholder`.trim()}
        role="img"
        aria-label={label}
      >
        <span aria-hidden="true">{initials}</span>
      </div>
    )
  }

  return (
    <img
      className={`personPhoto ${className}`.trim()}
      src={src}
      alt={label}
      width={400}
      height={600}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}