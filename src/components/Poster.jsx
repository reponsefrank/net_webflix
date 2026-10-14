import { useEffect, useState } from 'react'
import { makeFallbackPoster, makePoster } from '../lib/artwork'
import { fetchMoviePosterUrl, isTmdbConfigured } from '../lib/tmdb'

/**
 * Movie poster resolver.
 *
 * Priority order:
 *   1. `movie.poster` – an explicit poster URL already attached to the movie.
 *   2. TMDB – when an API key is configured, look the title up on The Movie
 *      Database and render the real poster built from its `poster_path`.
 *   3. Generated artwork – offline fallback when TMDB is not configured.
 *   4. If an image fails to load: a plain generated poster, then a clean CSS
 *      placeholder. Never a broken-image icon, and never a random poster.
 *
 * Loading and no-poster/error states render as styled placeholders, so every
 * spot that uses `<Poster>` keeps its aspect ratio and layout.
 */
export default function Poster({ movie, className, alt = '', loading = 'lazy' }) {
  const useTmdb = !movie.poster && isTmdbConfigured()
  const [tmdbState, setTmdbState] = useState({ status: 'idle', url: null })
  const [stage, setStage] = useState(0)

  const identity = `${movie.id ?? ''}|${movie.title ?? ''}|${movie.year ?? ''}|${movie.poster ?? ''}`

  // A different movie restarts the whole chain: the image fallback stage and
  // any TMDB lookup currently in flight.
  useEffect(() => {
    setStage(0)
    setTmdbState({ status: 'idle', url: null })
  }, [identity])

  useEffect(() => {
    if (!useTmdb) return undefined
    let cancelled = false
    setTmdbState({ status: 'loading', url: null })
    fetchMoviePosterUrl(movie.title, movie.year)
      .then((url) => {
        if (cancelled) return
        setTmdbState({ status: url ? 'ready' : 'none', url })
      })
      .catch(() => {
        if (cancelled) return
        setTmdbState({ status: 'error', url: null })
      })
    return () => {
      cancelled = true
    }
  }, [identity, useTmdb])

  const placeholderClass = `${className ? `${className} ` : ''}poster--placeholder`

  function placeholder(extraClass) {
    return (
      <div className={`${placeholderClass}${extraClass ? ` ${extraClass}` : ''}`} role="img" aria-label={alt || movie.title}>
        <span>{movie.title}</span>
      </div>
    )
  }

  // TMDB lookup in progress – loading state.
  if (useTmdb && (tmdbState.status === 'idle' || tmdbState.status === 'loading')) {
    return placeholder('poster--loading')
  }

  // TMDB found no poster, or the lookup failed – render the branded generated
  // artwork (title on a red-accented gradient) so the slot is never blank. If
  // even that fails to decode, fall back to the plain placeholder.
  if (useTmdb && tmdbState.status !== 'ready') {
    if (stage >= 1) return placeholder()
    return (
      <img
        className={className}
        src={makePoster(movie)}
        alt={alt}
        width={400}
        height={600}
        loading={loading}
        data-poster-fallback="true"
        onError={() => setStage((current) => current + 1)}
      />
    )
  }

  // Both the real image and the generated fallback failed to decode.
  if (stage >= 2) {
    return placeholder()
  }

  const source =
    movie.poster ||
    (useTmdb && tmdbState.status === 'ready' ? tmdbState.url : null) ||
    makePoster(movie)

  return (
    <img
      className={className}
      src={source}
      alt={alt}
      width={400}
      height={600}
      loading={loading}
      data-poster-fallback={stage === 1 ? 'true' : undefined}
      onError={() => setStage((current) => current + 1)}
    />
  )
}