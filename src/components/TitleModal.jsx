import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Poster from './Poster'
import TrailerPlayer from './TrailerPlayer'
import { CloseIcon, PlayIcon, StarIcon } from './icons'

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])'

/**
 * Details modal opened from the homepage hero and poster cards.
 *
 * It keeps the two actions separate, exactly like the rest of the site:
 *   - "Play"           -> plays the full movie (calls `onPlay`, which opens the
 *                         full-movie player). It never plays the trailer.
 *   - "Watch Trailer"  -> plays the official trailer (resolved from TMDB's
 *                         `/movie/{id}/videos` endpoint via `TrailerPlayer`).
 *
 * On its own the modal only shows a poster preview and the title's details -
 * it no longer auto-plays the trailer when opened, unless the caller explicitly
 * passes `autoPlay` (used when a visitor asked for the trailer).
 *
 * Accessibility follows the app's other modals: focus trapping, Escape to
 * close, click-the-overlay to close, body scroll lock and focus restoration.
 */
export default function TitleModal({ movie, onClose, autoPlay = false, onPlay }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const previouslyFocused = useRef(null)
  const titleId = useId()
  const [playTrailer, setPlayTrailer] = useState(Boolean(autoPlay))

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const nodes = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE))
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    previouslyFocused.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus()
      }
    }
  }, [onKeyDown])

  function handleOverlayMouseDown(event) {
    if (event.target === event.currentTarget) onClose()
  }

  function handlePlay() {
    if (onPlay) onPlay(movie)
  }

  const rated = typeof movie.rating === 'number'
  const genres = (movie.genres || []).slice(0, 3).join(' / ')

  return createPortal(
    <div className="modal titleModal" role="presentation" onMouseDown={handleOverlayMouseDown}>
      <div
        className="modal__dialog titleModal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <button
          ref={closeRef}
          type="button"
          className="modal__close titleModal__close"
          aria-label="Close player"
          onClick={onClose}
        >
          <CloseIcon size={22} />
        </button>

        <div className="titleModal__stage">
          {playTrailer ? (
            <TrailerPlayer movie={movie} autoPlay />
          ) : (
            <div className="titleModal__poster">
              <Poster movie={movie} className="titleModal__posterImg" alt={`${movie.title} poster`} />
            </div>
          )}
        </div>

        <div className="titleModal__body">
          <h2 id={titleId} className="titleModal__title">
            {movie.title}
          </h2>

          <div className="titleModal__meta">
            {rated ? (
              <span className="titleModal__rating">
                <StarIcon size={14} />
                {movie.rating.toFixed(1)}
              </span>
            ) : (
              <span className="titleModal__unrated">Not rated</span>
            )}
            {movie.year && <span>{movie.year}</span>}
            {genres && <span>{genres}</span>}
          </div>

          <p className="titleModal__overview">
            {movie.overview || 'No description available for this title yet.'}
          </p>

          <div className="titleModal__actions">
            <button type="button" className="btn btn--primary" onClick={handlePlay}>
              <PlayIcon />
              Play
            </button>
            {!playTrailer && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPlayTrailer(true)}
              >
                <PlayIcon size={16} />
                Watch Trailer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
