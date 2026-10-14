import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PersonPhoto from '../components/PersonPhoto'
import Poster from '../components/Poster'
import TrailerPlayer from '../components/TrailerPlayer'
import { ClockIcon, StarIcon } from '../components/icons'
import { getTmdbMovieDetails, isTmdbConfigured } from '../lib/tmdb'

/**
 * TMDB movie detail page reached from Explorer search results. Shows release
 * date, genres, rating, runtime, description, director and cast - all from
 * TMDB and keyed by the TMDB id in the URL.
 */
export default function ExplorerMovie() {
  const { id } = useParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [movie, setMovie] = useState(null)
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)
  const requestRef = useRef(0)

  const configured = isTmdbConfigured()

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
  }, [id, configured, nonce])

  if (!configured) {
    return (
      <div className="page">
        <div className="empty">
          <h2>Nothing to show here right now</h2>
          <p>
            This movie page is not available at the moment. Head back home to keep browsing.
          </p>
          <div className="empty__actions">
            <Link to="/" className="btn btn--primary">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status !== 'success' || !movie) {
    return (
      <div className="page">
        {status === 'loading' && (
          <>
            <div className="picker__status" role="status">
              <span className="spinner" aria-hidden="true" />
              <p>Loading movie details from TMDB…</p>
            </div>
            <div className="explorerDetail__skeleton" aria-hidden="true">
              <div className="skeleton" />
              <div>
                <div className="skeleton" style={{ height: '2rem' }} />
                <div className="skeleton" style={{ height: '1rem', width: '60%' }} />
                <div className="skeleton" style={{ height: '1rem' }} />
                <div className="skeleton" style={{ height: '1rem', width: '80%' }} />
              </div>
            </div>
          </>
        )}
        {status === 'error' && (
          <div className="empty picker__error" role="alert">
            <h2>Couldn't load this movie</h2>
            <p>{error}</p>
            <div className="empty__actions">
              <button type="button" className="btn btn--primary" onClick={() => setNonce((n) => n + 1)}>
                Retry
              </button>
              <Link to="/" className="btn btn--ghost">
                Back to home
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  const hasBackdrop = Boolean(movie.backdrop)
  const runtime = movie.runtime

  return (
    <article className="detail">
      <div
        className="detail__backdrop"
        style={
          hasBackdrop
            ? { backgroundImage: `url("${movie.backdrop}")` }
            : undefined
        }
      />
      <div className="detail__scrim" />

      <div className="detail__inner">
        <Link to="/" className="detail__back">
          &larr; Back to home
        </Link>

        <div className="detail__head">
          <Poster movie={movie} className="detail__poster" alt={`${movie.title} poster`} />

          <div className="detail__info">
            <h1>{movie.title}</h1>
            {movie.tagline && <p className="detail__tagline">{movie.tagline}</p>}

            <div className="detail__meta">
              {typeof movie.rating === 'number' && (
                <span className="detail__rating">
                  <StarIcon size={14} />
                  {movie.rating.toFixed(1)}
                  <span className="detail__hd">TMDB score</span>
                </span>
              )}
              {movie.releaseDate && <span>{movie.releaseDate}</span>}
              {runtime ? (
                <span className="detail__runtime">
                  <ClockIcon size={14} />
                  {Math.floor(runtime / 60)}h {runtime % 60}m
                </span>
              ) : null}
              {movie.year && <span className="detail__hd">{movie.year}</span>}
            </div>

            {movie.genres.length > 0 && (
              <div className="detail__genres">
                {movie.genres.map((genre) => (
                  <span key={genre} className="chip chip--static">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <p className="detail__overview">{movie.overview || 'No description available for this title.'}</p>

            <dl className="detail__credits">
              {movie.director && (
                <div>
                  <dt>Director</dt>
                  <dd>
                    <Link to={`/person/${movie.director.id}`}>{movie.director.name}</Link>
                  </dd>
                </div>
              )}
              <div>
                <dt>Cast</dt>
                <dd>{movie.cast.length ? `${movie.cast.length} credited roles` : 'Not available'}</dd>
              </div>
            </dl>

            <div className="detail__buttons">
              <Link to="/" className="btn btn--ghost">
                &larr; Back to home
              </Link>
            </div>
          </div>
        </div>

        <section className="detail__trailer" aria-label={`${movie.title} trailer`}>
          <div className="detail__trailerHead">
            <h2>Official trailer</h2>
          </div>
          <TrailerPlayer movie={movie} />
        </section>
      </div>

      {movie.cast.length > 0 && (
        <div className="page">
          <h2 className="explorer__sectionTitle">Cast</h2>
          <div className="explorerCast">
            {movie.cast.map((member) => (
              <Link
                key={`${member.id}-${member.character}`}
                to={`/person/${member.id}`}
                className="castCard"
                aria-label={`${member.name} as ${member.character || 'unknown role'}`}
              >
                <div className="castCard__photo">
                  <PersonPhoto src={member.profile} name={member.name} />
                </div>
                <p className="castCard__name">{member.name}</p>
                {member.character && <p className="castCard__role">{member.character}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}