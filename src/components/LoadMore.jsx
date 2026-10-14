import { ChevronDown, Loader2 } from 'lucide-react'

/**
 * The shared "Load More" pagination button.
 *
 * It is purely presentational: the caller owns the paging state (usually via
 * `useLoadMore` or `useReveal`) and passes it in. Four visual states:
 *
 *   idle    - the solid red button with a down chevron (lucide-react)
 *   loading - a spinning Loader2 icon + "Loading...", disabled so it can't be
 *             clicked twice while a page is in flight
 *   error   - a friendly message with a "Try again" button
 *   done    - the button is hidden; a quiet message confirms the last page
 */
export default function LoadMore({
  status = 'idle',
  onLoad,
  onRetry,
  label = 'Load More',
  doneLabel = 'No more results',
  compact = false,
}) {
  // Last page reached: the button disappears completely.
  if (status === 'done') {
    return (
      <p className={`loadMore__done${compact ? ' loadMore__done--compact' : ''}`} role="status">
        {doneLabel}
      </p>
    )
  }

  if (status === 'error') {
    return (
      <div className={`loadMore__error${compact ? ' loadMore__error--compact' : ''}`} role="alert">
        <p>We couldn&apos;t load more right now.</p>
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Try again
        </button>
      </div>
    )
  }

  const loading = status === 'loading'

  return (
    <div className={`loadMore${compact ? ' loadMore--compact' : ''}`}>
      <button
        type="button"
        className="load-more-btn"
        onClick={onLoad}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          <Loader2 className="load-more-btn__icon load-more-btn__icon--spin" size={18} aria-hidden="true" />
        ) : (
          <ChevronDown className="load-more-btn__icon" size={18} aria-hidden="true" />
        )}
        {loading ? 'Loading...' : label}
      </button>
    </div>
  )
}
