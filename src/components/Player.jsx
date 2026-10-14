import { useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { SkipForward, X } from 'lucide-react'

/**
 * Full-screen HTML5 video player modal.
 *
 * Reusable everywhere a legal video needs to play: it renders a native
 * `<video controls autoPlay playsInline>` (no embeds, no scraped streams), locks
 * background scrolling, closes on Escape or a click outside the player, and
 * moves focus to the close button on open.
 *
 * Series pass an `onNext` handler, which reveals a "Next episode" button; the
 * parent changes `source` and the `key` on the video remounts it so the next
 * episode autoplays.
 */
export default function Player({
  source,
  title = 'Video',
  subtitle = '',
  poster,
  onClose,
  onNext,
  nextLabel = 'Next episode',
}) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const previouslyFocused = useRef(null)
  const titleId = useId()

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
      }
    },
    [onClose],
  )

  useEffect(() => {
    previouslyFocused.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      const node = previouslyFocused.current
      if (node && typeof node.focus === 'function') node.focus()
    }
  }, [])

  if (!source || !source.url || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="player"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div className="player__frame" ref={dialogRef}>
        <div className="player__bar">
          <div className="player__meta">
            <span className="player__eyebrow">Now playing</span>
            <p className="player__title" id={titleId}>
              {title}
              {subtitle ? <span className="player__subtitle"> · {subtitle}</span> : null}
            </p>
          </div>
          <div className="player__controls">
            {onNext ? (
              <button type="button" className="btn btn--ghost player__next" onClick={onNext}>
                <SkipForward size={18} aria-hidden="true" />
                {nextLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="player__close"
              onClick={onClose}
              ref={closeRef}
              aria-label="Close player"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
        </div>

        <video
          key={source.url}
          className="player__video"
          controls
          autoPlay
          playsInline
          preload="metadata"
          poster={poster || undefined}
        >
          <source src={source.url} type={source.type || 'video/mp4'} />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>,
    document.body,
  )
}
