import { Fragment, useEffect, useRef, useState } from 'react'
import LoadMore from './LoadMore'
import MovieCardSkeleton from './MovieCardSkeleton'
import { dedupe, itemKey, useLoadMore } from '../hooks/useLoadMore'

/**
 * The one reusable "grid + Load More" block used across the site.
 *
 * It owns the whole pagination story so pages never repeat this logic:
 *   - loads page 1 itself and shows skeletons while it arrives
 *   - appends later pages below the existing items (never replaces them)
 *   - de-duplicates by id, so nothing can appear twice
 *   - keeps the scroll position (it never scrolls the window)
 *   - shows a spinner + disables the button while a page is loading
 *   - flips to "No more results" at the last page, and to a friendly message
 *     with a "Try again" button if a request fails
 *   - resets to page 1 and clears the old items whenever `resetKey` changes
 *     (a new search text, genre, sort or filter)
 *
 * Props:
 *   loadPage(page)        -> Promise<{ results, totalPages }>   (required)
 *   renderItem(item, i)   -> ReactNode                          (required)
 *   resetKey              -> change this to restart from page 1
 *   gridClassName         -> wrapper class, defaults to "grid"
 *   renderSkeleton(count) -> custom loading placeholder
 *   emptyState            -> node shown when page 1 returns nothing
 *   onLoaded(items)       -> notified whenever the visible list changes
 */
export default function PaginatedGrid({
  loadPage,
  renderItem,
  resetKey = '',
  gridClassName = 'grid',
  renderSkeleton,
  skeletonCount = 10,
  skeletonVariant = 'tmdb',
  emptyState = null,
  doneLabel = 'No more results',
  buttonLabel = 'Load More',
  onLoaded,
}) {
  const [base, setBase] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)
  const requestRef = useRef(0)
  const loadRef = useRef(loadPage)
  loadRef.current = loadPage

  // Pages 2, 3, ... are delegated to the shared hook.
  const more = useLoadMore((page) => loadRef.current(page), { resetKey })

  useEffect(() => {
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setStatus('loading')
    setError('')
    setBase([])

    loadRef.current(1)
      .then((data) => {
        if (requestId !== requestRef.current) return
        setBase((data && data.results) || [])
        setTotalPages((data && data.totalPages) ?? 1)
        setStatus('ready')
      })
      .catch((err) => {
        if (requestId !== requestRef.current) return
        setError(err?.message || 'Could not reach TMDB right now.')
        setStatus('error')
      })
  }, [resetKey, nonce])

  const seen = new Set(base.map(itemKey))
  const items = [...base, ...dedupe(more.items, seen)]

  useEffect(() => {
    if (status === 'ready' && onLoaded) onLoaded(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, items.length])

  if (status === 'loading') {
    if (renderSkeleton) return renderSkeleton(skeletonCount)
    return (
      <div className={gridClassName} aria-hidden="true">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <MovieCardSkeleton key={index} variant={skeletonVariant} />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="empty picker__error" role="alert">
        <h2>Could not load results</h2>
        <p>{error}</p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setNonce((value) => value + 1)}
        >
          Try again
        </button>
      </div>
    )
  }

  if (!items.length) return emptyState

  const done = totalPages <= 1 || more.status === 'done'

  return (
    <>
      <div className={gridClassName}>
        {items.map((item, index) => (
          <Fragment key={itemKey(item) || index}>{renderItem(item, index)}</Fragment>
        ))}
      </div>

      <LoadMore
        status={done ? 'done' : more.status}
        onLoad={more.loadMore}
        onRetry={more.retry}
        label={buttonLabel}
        doneLabel={doneLabel}
      />
    </>
  )
}
