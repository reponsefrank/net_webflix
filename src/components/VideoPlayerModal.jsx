import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fetchMovieTrailer, isTmdbConfigured } from '../lib/tmdb'
import { getDemoPlaySource, getPlaySource } from '../data/playback'
import { CloseIcon } from './icons'

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, video, iframe, [tabindex]:not([tabindex="-1"])'

/**
 * Responsive in-page video player modal.
 *
 * Source resolution (never guessed):
 *  1. A licensed source declared for the title in `src/data/playback.js` is
 *     played in a native HTML5 `<video>` element.
 *  2. Otherwise the official trailer is resolved through TMDB's `/videos`
 *     endpoint and embedded from YouTube.
 *  3. If neither exists (or the licensed file fails to load) a friendly message
 *     is shown, and the trailer is offered as a fallback when available.
 *
 * Handles focus trapping, Escape, overlay click, body scroll lock and focus
 * restoration, and is responsive down to small mobile widths.
 */
export default function VideoPlayerModal({ movie, onClose, trailerOnly = false }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const previouslyFocused = useRef(null)
  const titleId = useId()

  const licensed = useMemo(() => {
    const real = getPlaySource(movie)
    if (real) return real
    // No licensed file declared for this title: fall back to the bundled demo
    // clip so "Play" always has a full movie to play. It is labelled honestly
    // as a demo sample in the footer, never passed off as the real film.
    return getDemoPlaySource(movie)
  }, [movie])

  const configured = isTmdbConfigured()
  const [trailer, setTrailer] = useState({ status: configured ? 'loading' : 'none', data: null })
  const [useTrailer, setUseTrailer] = useState(Boolean(trailerOnly))
  const [fileError, setFileError] = useState(false)

  const tmdbId = movie?.tmdbId
  const title = movie?.title
  const year = movie?.year

  // Resolve the official trailer. It powers both the no-licensed-file path and
  // the fallback when a licensed file is declared but fails to play.
  useEffect(() => {
    if (!configured) {
      setTrailer({ status: 'none', data: null })
      return undefined
    }
    let cancelled = false
    setTrailer({ status: 'loading', data: null })
    fetchMovieTrailer({ tmdbId, title, year })
      .then((data) => {
        if (cancelled) return
        setTrailer({ status: data ? 'ready' : 'none', data })
      })
      .catch(() => {
        if (cancelled) return
        setTrailer({ status: 'error', data: null })
      })
    return () => {
      cancelled = true
    }
  }, [configured, tmdbId, title, year])

  // "Watch Trailer" mode is trailer-only: licensed files and the demo clip are
  // never played, only the official TMDB/YouTube trailer (or a friendly message).
  useEffect(() => {
    setUseTrailer(Boolean(trailerOnly))
    setFileError(false)
  }, [movie?.id, trailerOnly])

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

  const showLicensed = !trailerOnly && Boolean(licensed) && !useTrailer && !fileError
  const trailerReady = trailer.status === 'ready' && Boolean(trailer.data)
  const showingTrailer = !showLicensed && trailerReady
  const displayTitle = title || 'this title'

  let media
  if (showLicensed) {
    media = (
      <div className="videoModal__frame">
        <video
          className="videoModal__video"
          controls
          autoPlay
          playsInline
          preload="metadata"
          poster={licensed.poster || undefined}
          onError={() => setFileError(true)}
        >
          {licensed.sources.map((source) => (
            <source key={source.url} src={source.url} type={source.type} />
          ))}
          Your browser cannot play this video.
        </video>
      </div>
    )
  } else if (trailer.status === 'loading') {
    media = (
      <div className="videoModal__state" role="status">
        <span className="spinner" aria-hidden="true" />
        <p className="videoModal__message">Loading video&hellip;</p>
      </div>
    )
  } else if (showingTrailer) {
    const { embedUrl, name, type } = trailer.data
    media = (
      <div className="videoModal__frame">
        <iframe
          className="videoModal__iframe"
          src={`${embedUrl}&autoplay=1`}
          title={`${name} - ${displayTitle} (${type})`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    )
  } else {
    media = (
      <div
        className="videoModal__state videoModal__state--empty"
        role={fileError || trailer.status === 'error' ? 'alert' : 'status'}
      >
        <p className="videoModal__message">
          {fileError
            ? `This video could not be played for ${displayTitle}.`
            : trailerOnly
              ? `No trailer is available for ${displayTitle} right now.`
              : `No trailer or licensed video is available for ${displayTitle} right now.`}
        </p>
        <p className="videoModal__hint">
          {fileError || trailer.status === 'error'
            ? 'The source may be unavailable. Please try again later.'
            : trailerOnly
              ? 'Official trailers come from TMDB. Add a TMDB API key to enable them.'
              : 'Add a TMDB API key for official trailers, or declare a licensed source in src/data/playback.js.'}
        </p>
      </div>
    )
  }

  let note
  if (showLicensed) {
    note = licensed.demo
      ? 'Demo sample clip — a placeholder made for this demo, not the film.'
      : `${licensed.label}${licensed.quality ? ` · ${licensed.quality}` : ''}`
  } else if (showingTrailer) {
    note = 'Official trailer provided by TMDB / YouTube. This is not the full movie.'
  } else {
    note = 'Playback is only ever offered for authorized sources.'
  }

  const modeLabel = showLicensed
    ? licensed.demo
      ? 'Demo sample clip'
      : 'Licensed video'
    : showingTrailer
      ? 'Official trailer'
      : 'Video'

  return createPortal(
    <div className="modal videoModal" role="presentation" onMouseDown={handleOverlayMouseDown}>
      <div
        className="modal__dialog videoModal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <button
          ref={closeRef}
          type="button"
          className="modal__close"
          aria-label="Close video player"
          onClick={onClose}
        >
          <CloseIcon size={20} />
        </button>

        <div className="videoModal__head">
          <h2 id={titleId} className="videoModal__title">
            {displayTitle}
          </h2>
          <p className="videoModal__meta">{modeLabel}</p>
        </div>

        <div className="videoModal__media">{media}</div>

        <div className="videoModal__foot">
          <p className="videoModal__note">{note}</p>

          <div className="videoModal__controls">
            {!trailerOnly && showLicensed && trailerReady && (
              <button type="button" className="btn btn--ghost" onClick={() => setUseTrailer(true)}>
                Play official trailer
              </button>
            )}

            {!trailerOnly && showingTrailer && licensed && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setFileError(false)
                  setUseTrailer(false)
                }}
              >
                {fileError ? 'Retry video' : licensed.demo ? 'Play the demo clip' : 'Play licensed video'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
