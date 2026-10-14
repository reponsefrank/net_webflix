/**
 * Maps the local catalogue's genre names to TMDB genre ids, so the Movies page
 * can page `/discover/movie` for whatever genre is selected. Names that have no
 * TMDB equivalent (or the "All" pseudo-genre) return `null`.
 */
export const TMDB_GENRE_IDS = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
}

export function tmdbGenreId(name) {
  return TMDB_GENRE_IDS[name] ?? null
}
