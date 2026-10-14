import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import HomeCard from './HomeCard'
import MovieCardSkeleton from './MovieCardSkeleton'
import LoadMore from './LoadMore'
import { ChevronIcon } from './icons'
import { dedupe, itemKey, useLoadMore } from '../hooks/useLoadMore'

const SKELETON_COUNT = 8

/**
 * Horizontal, scrollable movie row (Trending / Popular / genre rows / ...).
 *
 * Same interaction as the existing `MovieRow` - scroll-snap, mouse/keyboard
 * friendly arrow buttons that disable at the ends - but it renders `HomeCard`
 * tiles that link to each title's detail page.
 *
 * Each row loads independently, so it owns its own state:
 *   - `loading` -> a row of poster skeletons
 *   - `error`   -> a small inline message with a Retry button
 *   - `ready`   -> the real posters (or nothing if the list came back empty)
 *
 * When the caller passes `loadMore`, a "Load More" button sits under the
 * scroller and appends the next TMDB page to *this* row (deduped by id),
 * leaving the already-shown titles untouched.
 *
 * A "See all" link sits on the right of the title and the section `id` matches
 * the genre chips so they can jump straight here.
 */
export default function HomeRow({
  id,
  title,
  movies = [],
  status = 'ready',
  moreLink,
  onRetry,
  loadMore,
}) {
  const scrollerRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const more = useLoadMore(loadMore, { resetKey: id })

  // Base titles + any appended pages, never duplicated.
  const seen = new Set(movies.map(itemKey))
  const displayMovies = [...movies, ...dedupe(more.items, seen)]

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 8)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [updateArrows, displayMovies.length, status])

  function scrollBy(direction) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.85, 240), behavior: 'smooth' })
  }

  const ready = status === 'ready'

  // Nothing to show once a row loaded but came back empty.
  if (ready && !movies.length) return null

  return (
    <section className="row home-row" id={id}>
      <div className="row__head">
        <h2>{title}</h2>
        <div className="row__actions">
          {moreLink && (
            <Link to={moreLink} className="row__more">
              See all
            </Link>
          )}
          {ready && displayMovies.length > 0 && (
            <>
              <button
                type="button"
                className="row__arrow"
                onClick={() => scrollBy(-1)}
                disabled={atStart}
                aria-label={`Scroll ${title} left`}
              >
                <ChevronIcon direction="left" size={20} />
              </button>
              <button
                type="button"
                className="row__arrow"
                onClick={() => scrollBy(1)}
                disabled={atEnd}
                aria-label={`Scroll ${title} right`}
              >
                <ChevronIcon direction="right" size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {status === 'loading' && (
        <div className="row__scroller" aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="row__error" role="status">
          <p>We couldn&apos;t load this row right now.</p>
          {onRetry && (
            <button type="button" className="btn btn--ghost row__retry" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}

      {ready && movies.length > 0 && (
        <div className="row__scroller" ref={scrollerRef} onScroll={updateArrows}>
          {displayMovies.map((movie, index) => (
            <HomeCard key={movie.tmdbId ?? movie.id ?? index} movie={movie} />
          ))}
        </div>
      )}

      {ready && movies.length > 0 && loadMore && (
        <LoadMore
          status={more.status}
          onLoad={more.loadMore}
          onRetry={more.retry}
          doneLabel="No more titles"
          compact
        />
      )}
    </section>
  )
}
