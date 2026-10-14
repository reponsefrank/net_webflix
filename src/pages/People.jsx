import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PersonCard from '../components/PersonCard'
import { getPopularPeople, isTmdbConfigured } from '../lib/tmdb'

const SKELETON_COUNT = 10

/**
 * Popular Actors: the TMDB "popular people" list. Each card reuses the shared
 * `PersonCard` and links to the existing `/explorer/person/:id` profile route,
 * so biographies and filmographies keep working unchanged.
 */
export default function People() {
  const configured = isTmdbConfigured()
  const [people, setPeople] = useState([])
  const [status, setStatus] = useState(configured ? 'loading' : 'unconfigured')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!configured) return undefined
    let cancelled = false
    setError('')
    if (page === 1) {
      setPeople([])
      setStatus('loading')
    } else {
      setLoadingMore(true)
    }

    getPopularPeople(page)
      .then((data) => {
        if (cancelled) return
        setPeople((prev) => (page === 1 ? data.results : [...prev, ...data.results]))
        setHasMore(page < data.totalPages && data.results.length > 0)
        setStatus('ready')
        setLoadingMore(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message || 'Could not reach TMDB right now.')
        setLoadingMore(false)
        setStatus(page === 1 ? 'error' : 'ready')
      })

    return () => {
      cancelled = true
    }
  }, [configured, page, nonce])

  function retry() {
    setPage(1)
    setNonce((value) => value + 1)
  }

  return (
    <div className="page">
      <header className="page__head">
        <span className="picker__eyebrow">People</span>
        <h1>Popular Actors</h1>
        <p className="page__lead">
          The actors and directors trending on TMDB right now. Open a profile for their biography,
          known-for titles and full filmography.
        </p>
      </header>

      {status === 'unconfigured' && (
        <div className="empty">
          <h2>Popular actors need a TMDB key</h2>
          <p>
            This list is powered by TMDB. Add <code>VITE_TMDB_API_KEY</code> to your{' '}
            <code>.env</code> file and restart the dev server to load it.
          </p>
          <div className="empty__actions">
            <Link to="/actors" className="btn btn--primary">
              Browse Actors
            </Link>
            <Link to="/movies" className="btn btn--ghost">
              Browse movies
            </Link>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="grid grid--people" aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div className="personCard personCard--skeleton" key={index}>
              <div className="skeleton personCard--skeleton__photo" />
              <div className="personCard__body">
                <span className="skeleton castSkeleton__line" />
                <span className="skeleton castSkeleton__line castSkeleton__line--short" />
                {/* Mirror the "known for" mini-posters so the grid keeps its height. */}
                <div className="personCard__known">
                  {Array.from({ length: 3 }).map((__, mini) => (
                    <span className="skeleton personCard__mini" key={mini} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="empty picker__error" role="alert">
          <h2>Could not load popular actors</h2>
          <p>{error}</p>
          <button type="button" className="btn btn--primary" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="grid grid--people">
            {people.map((person) => (
              <PersonCard key={person.tmdbId} person={person} />
            ))}
          </div>

          {hasMore && (
            <div className="loadMore">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPage((value) => value + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
