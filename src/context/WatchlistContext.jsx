import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'netwebfilx:watchlist'

const WatchlistContext = createContext(null)

function readStoredIds() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function WatchlistProvider({ children }) {
  const [ids, setIds] = useState(readStoredIds)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // Storage can be unavailable (private mode, disabled cookies). The list
      // still works for the current session, it just will not be remembered.
    }
  }, [ids])

  const has = useCallback((id) => ids.includes(id), [ids])

  const toggle = useCallback((id) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]))
  }, [])

  const remove = useCallback((id) => {
    setIds((prev) => prev.filter((item) => item !== id))
  }, [])

  const clear = useCallback(() => setIds([]), [])

  const value = useMemo(
    () => ({ ids, has, toggle, remove, clear }),
    [ids, has, toggle, remove, clear],
  )

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

export function useWatchlist() {
  const context = useContext(WatchlistContext)
  if (!context) {
    throw new Error('useWatchlist must be used inside a WatchlistProvider')
  }
  return context
}
