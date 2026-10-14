import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ActionButtons from '../components/ActionButtons'
import CastRow from '../components/CastRow'
import FavoriteButton from '../components/FavoriteButton'
import Player from '../components/Player'
import Poster from '../components/Poster'
import WhereToWatch from '../components/WhereToWatch'
import { ClockIcon, StarIcon } from '../components/icons'
import { getTmdbMovieDetails, isTmdbConfigured } from '../lib/tmdb'
import { getPlayableMovieById, toVideoSource } from '../data/playable'

/**
 * TMDB movie detail page, reached by clicking any poster that carries a TMDB id
 * (home rows, the Load More grid, search results and Favorites).
 *
 * Shows the backdrop, title, year, rating, runtime, genres and overview, a heart
 * favorite button, a Cast row with each actor's age, and - pinned to the bottom -
 * a single Download (left) / Watch (right) row. Watch opens the full-screen
 * `Player`; when no legal source exists in `src/data/playable.js` the row is
 * replaced by the TMDB "Where to watch" panel.
 */
export default function TmdbMovieDetail() {
  const { id } = useParams()
  const configured = isTmdbConfigured()

  const [status, setStatus] = useState(() => (configured ? 'loading' : 'unconfigured'))
  const [movie, setMovie] = useState(null)
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)
  const [playing, setPlaying] = useState(null)
  const requestRef = useRef(0)

  useEffect(() => {
    if (!configured) return undefined
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setStatus('loading')
    setError('')

    getTmdbMovieDetails(id)
      .then((data) => {
        if (requestId !== requestRef.current) return
        setMovie(data)
        setStatus('success')
      })
      .catch((err) => {
        if (requestId !== requestRef.current) return
        setError(err?.message || 'Could not load this movie from TMDB.')
        setStatus('error')
      })

    return undefined
  }, [configured, id, nonce])

  if (!configured) {
    return (
      <div className="page">
        <div className="empty">
          <h2>Movie details need a TMDB key</h2>
          <p>
            Add <code>VITE_TMDB_API_KEY</code> to your <code>.env</code> file and restart the
            dev server to load TMDB details.
          </p>
          <Link className="btn btn--primary" to="/movies">
            Browse the catalogue
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="page detail detail--loading">
        <div className="empty">
          <span className="whereToWatch__spinner" aria-hidden="true" />
          <p>Loading movie details…</p>
        </div>
      </div>
    )
  }

  if (status === 'error' || !movie) {
    return (
      <div className="page">
        <div className="empty">
          <h2>We could not load this movie</h2>
          <p>{error || 'The movie may have been removed, or TMDB is unavailable.'}</p>
          <div className="empty__actions">
            <button type="button" className="btn btn--primary" onClick={() => setNonce((n) => n + 1)}>
              Retry
            </button>
            <Link className="btn btn--ghost" to="/movies">
              Browse movies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const playable = getPlayableMovieById(id)
  const video = toVideoSource(playable)
  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0
  const minutes = movie.runtime ? movie.runtime % 60 : 0

  return (
    <article className="detail">
      <div
        className="detail__backdrop"
        style={movie.backdrop ? { backgroundImage: `url("${movie.backdrop}")` } : undefined}
      />
      <div className="detail__scrim" />

      <div className="detail__inner">
        <Link to="/movies" className="detail__back">
          &larr; Back to movies
        </Link>

        <div className="detail__head">
          <Poster movie={movie} className="detail__poster" alt={`${movie.title} poster`} />

          <div className="detail__info">
            <div className="detail__titleRow">
              <h1>{movie.title}</h1>
              <FavoriteButton movie={movie} className="detail__fav" size={22} />
            </div>
            {movie.tagline ? <p className="detail__tagline">{movie.tagline}</p> : null}

            <div className="detail__meta">
              <span className="detail__rating">
                <StarIcon size={14} />
                {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : 'Not rated'}
              </span>
              {movie.year ? <span>{movie.year}</span> : null}
              {movie.runtime ? (
                <span className="detail__runtime">
                  <ClockIcon size={14} />
                  {hours}h {minutes}m
                </span>
              ) : null}
              <span className="detail__hd">HD</span>
            </div>

            {movie.genres?.length ? (
              <div className="detail__genres">
                {movie.genres.map((genre) => (
                  <span key={genre} className="chip chip--static">
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="detail__overview">
              {movie.overview || 'No description available for this movie yet.'}
            </p>

            {movie.director ? (
              <dl className="detail__credits">
                <div>
                  <dt>Director</dt>
                  <dd>{movie.director.name}</dd>
                </div>
              </dl>
            ) : null}

            {/* Bottom action row: Download (left) / Watch (right), or the
                Where-to-watch panel when there is no legal source. */}
            <div className="detail__actionsBar">
              {video ? (
                <ActionButtons downloadUrl={video.url} onWatch={() => setPlaying(video)} />
              ) : (
                <WhereToWatch mediaType="movie" tmdbId={id} title={movie.title} />
              )}
            </div>
          </div>
        </div>

        <CastRow mediaType="movie" tmdbId={id} />
      </div>

      {playing ? (
        <Player
          source={playing}
          title={movie.title}
          subtitle="Full movie"
          poster={movie.backdrop || movie.poster}
          onClose={() => setPlaying(null)}
        />
      ) : null}
    </article>
  )
}
