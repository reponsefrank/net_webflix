import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A stable identity for a movie/show across TMDB pages.
 *
 * TMDB results always carry a numeric `id`; we keep `tmdbId` first because the
 * mapped objects keep the original id there. Falls back to the title so a list
 * can still be de-duplicated even if an id is somehow missing.
 */
export function itemKey(item) {
  if (!item) return ''
  if (typeof item.key === 'string' && item.key) return item.key
  if (item.tmdbId != null) return `tmdb:${item.tmdbId}`
  if (item.id != null) return `id:${item.id}`
  return `title:${item.title || item.name || ''}`
}

/** Remove duplicate items (by `itemKey`), optionally ignoring keys already seen. */
export function dedupe(items, seen = new Set()) {
  const out = []
  for (const item of items) {
    const key = itemKey(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

/**
 * "Load more" pagination for a TMDB list.
 *
 * Give it a `fetchPage(page)` that resolves to `{ results, totalPages }` and it
 * keeps a page counter plus the accumulated items. Call `loadMore()` to fetch
 * the next page and append it (de-duplicated by id); the state machine is:
 *
 *   idle    - ready to load the next page
 *   loading - a request is in flight (the button is disabled / shows a spinner)
 *   error   - the last request failed; `retry()` re-attempts the same page
 *   done    - the last page was reached (or the API returned nothing)
 *
 * `items` only holds pages fetched *after* the caller's first page, so a view
 * that already rendered page 1 can simply combine `base + items`.
 */
export function useLoadMore(fetchPage, { resetKey = '', initialPage = 1 } = {}) {
  const [page, setPage] = useState(initialPage)
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const fetchRef = useRef(fetchPage)
  const busyRef = useRef(false)

  fetchRef.current = fetchPage

  // A new data source (e.g. switching the search query) starts fresh.
  useEffect(() => {
    setPage(initialPage)
    setItems([])
    setStatus('idle')
    setError('')
    // Only react to the reset key; `initialPage` is intentionally stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const run = useCallback(async (targetPage) => {
    if (busyRef.current) return
    busyRef.current = true
    setStatus('loading')
    setError('')

    try {
      const data = await fetchRef.current(targetPage)
      const results = (data && data.results) || []
      const totalPages = (data && data.totalPages) ?? 1

      setItems((prev) => [...prev, ...dedupe(results, new Set(prev.map(itemKey)))])
      setPage(targetPage)
      setStatus(!results.length || targetPage >= totalPages ? 'done' : 'idle')
    } catch (err) {
      setError(err?.message || 'Could not load more right now.')
      setStatus('error')
    } finally {
      busyRef.current = false
    }
  }, [])

  const loadMore = useCallback(() => {
    if (status === 'loading' || status === 'done') return
    run(page + 1)
  }, [page, run, status])

  const retry = useCallback(() => {
    if (status === 'loading') return
    run(page + 1)
  }, [page, run, status])

  return { items, page, status, error, loadMore, retry }
}

/**
 * Client-side counterpart of `useLoadMore` for lists that are already fully in
 * memory (e.g. an actor's filmography). It reveals `pageSize` items at a time
 * and resets to the first page when `resetKey` changes, so both flavours drive
 * the exact same `<LoadMore />` button.
 */
export function useReveal(total, { pageSize = 20, resetKey = '' } = {}) {
  const [count, setCount] = useState(pageSize)

  useEffect(() => {
    setCount(pageSize)
  }, [resetKey, pageSize])

  const visible = Math.min(count, total)
  const hasMore = visible < total
  const showMore = useCallback(() => setCount((value) => value + pageSize), [pageSize])

  return { visible, hasMore, showMore }
}
