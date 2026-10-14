import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { movies as catalogue } from '../data/movies'

/**
 * Favorites ("My Favorites") are stored as full movie objects - not just ids -
 * so the Favorites page can render a saved TMDB film (which has no local
 * catalogue entry) exactly like a saved local one. The whole list lives in
 * localStorage under its own key and is shared through this context, so the
 * heart on any card and the Favorites page always agree.
 */

const STORAGE_KEY = 'netwebfilx:favorites'

const FavoritesContext = createContext(null)

/**
 * Stable identity for a movie across every source: the TMDB id first (explorer
 * and home-page titles), then the local catalogue id. Returns '' when the movie
 * has neither, so it can never be saved without a way to identify it.
 */
export function favoriteKey(movie) {
  if (!movie) return ''
  if (movie.tmdbId != null) return `tmdb:${movie.tmdbId}`
  if (movie.id != null) return `id:${movie.id}`
  return ''
}

/** Load and normalise the stored favorites, migrating the old id-only format. */
function readStoredFavorites() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const seen = new Set()
    const out = []
    for (const entry of parsed) {
      // Older versions stored bare local-catalogue ids (strings); resolve those
      // back to the full catalogue movie so existing favorites are not lost.
      const movie =
        typeof entry === 'string'
          ? catalogue.find((item) => item.id === entry)
          : entry && typeof entry === 'object' && favoriteKey(entry)
            ? entry
            : null
      if (!movie) continue
      const key = favoriteKey(movie)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(movie)
    }
    return out
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(readStoredFavorites)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // Storage can be unavailable (private mode, disabled cookies). Favorites
      // still work for the session, they just will not be remembered.
    }
  }, [favorites])

  const has = useCallback(
    (movieOrKey) => {
      const key = typeof movieOrKey === 'string' ? movieOrKey : favoriteKey(movieOrKey)
      if (!key) return false
      return favorites.some((movie) => favoriteKey(movie) === key)
    },
    [favorites],
  )

  const toggle = useCallback((movie) => {
    const key = favoriteKey(movie)
    if (!key) return
    setFavorites((prev) =>
      prev.some((item) => favoriteKey(item) === key)
        ? prev.filter((item) => favoriteKey(item) !== key)
        : [movie, ...prev],
    )
  }, [])

  const remove = useCallback((movieOrKey) => {
    const key = typeof movieOrKey === 'string' ? movieOrKey : favoriteKey(movieOrKey)
    if (!key) return
    setFavorites((prev) => prev.filter((movie) => favoriteKey(movie) !== key))
  }, [])

  const clear = useCallback(() => setFavorites([]), [])

  const value = useMemo(
    () => ({ favorites, has, toggle, remove, clear }),
    [favorites, has, toggle, remove, clear],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used inside a FavoritesProvider')
  }
  return context
}
