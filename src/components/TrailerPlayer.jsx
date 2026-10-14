import { useEffect, useState } from 'react'
import { fetchMovieTrailer } from '../lib/tmdb'

/**
 * Responsive trailer player.
 *
 * Resolves a real YouTube trailer through TMDB's official `/movie/{id}/videos`
 * data (falling back to a title/year lookup for the local catalogue) and embeds
 * it in a 16:9 frame. It never invents a video URL: when TMDB is not configured,
 * has no trailer, or the request fails, a friendly "no trailer" state is shown.
 *
 * This plays the official trailer only - never a full movie stream.
 */
export default function TrailerPlayer({ movie, autoPlay = false, className = '' }) {
  const tmdbId = movie?.tmdbId
  const title = movie?.title
  const year = movie?.year
  const identity = `${tmdbId ?? ''}|${title ?? ''}|${year ?? ''}`

  const [state, setState] = useState({ status: 'loading', trailer: null })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', trailer: null })
    fetchMovieTrailer({ tmdbId, title, year })
      .then((trailer) => {
        if (cancelled) return
        setState({ status: trailer ? 'ready' : 'none', trailer })
      })
      .catch(() => {
        if (cancelled) return
        setState({ status: 'error', trailer: null })
      })
    return () => {
      cancelled = true
    }
  }, [identity])

  const classes = `trailerPlayer${className ? ` ${className}` : ''}`

  if (state.status === 'loading') {
    return (
      <div className={`${classes} trailerPlayer--loading`} role="status">
        <span className="spinner" aria-hidden="true" />
        <p>Loading trailer…</p>
      </div>
    )
  }

  if (state.status !== 'ready' || !state.trailer) {
    return (
      <div className={`${classes} trailerPlayer--empty`} role="status">
        <p className="trailerPlayer__message">
          No trailer is available for {title || 'this title'} right now.
        </p>
        <p className="trailerPlayer__hint">
          Trailers appear here whenever TMDB has one for the film.
        </p>
      </div>
    )
  }

  const { embedUrl, name, type } = state.trailer
  const src = autoPlay ? `${embedUrl}&autoplay=1` : embedUrl

  return (
    <figure className={classes}>
      <div className="trailerPlayer__frame">
        <iframe
          src={src}
          title={`${name} - ${title || 'movie'} (${type})`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <figcaption className="trailerPlayer__caption">
        <strong>{name}</strong> · {type} provided by TMDB / YouTube. This is the official trailer, not
        the full movie.
      </figcaption>
    </figure>
  )
}
