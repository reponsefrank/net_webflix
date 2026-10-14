/**
 * Canonical route helpers for movie/series posters.
 *
 * A movie object may carry a TMDB `tmdbId` (live data) or a local catalogue slug
 * `id` (offline data). Both resolve to the same `/movie/:id` route, which
 * dispatches to the right detail page. TV shows always use `/tv/:id`.
 */
export function moviePath(movie) {
  if (!movie) return '/movies'
  if (movie.tmdbId != null) return `/movie/${movie.tmdbId}`
  if (movie.id != null) return `/movie/${movie.id}`
  return '/movies'
}

export function tvPath(show) {
  const id = show?.tmdbId ?? show?.id
  return id != null ? `/tv/${id}` : '/tv-shows'
}
