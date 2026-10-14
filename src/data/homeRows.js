import {
  discoverMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
} from '../lib/tmdb'

/**
 * The definitions for the homepage rows.
 *
 * The whole point of this file is that adding a row is one line. Make one with
 * `createRow` and drop it into the `homeRows` array below:
 *
 *   createRow('Comedy Picks', 35)          // a TMDB genre row
 *   createRow('Trending Now', null, {      // a row backed by another endpoint
 *     key: 'trending',
 *     chip: false,
 *     load: () => getTrendingMovies(),
 *   })
 */

/** TMDB genre ids used by the discover endpoint. */
export const GENRE_IDS = {
  action: 28,
  animation: 16,
  comedy: 35,
  family: 10751,
  horror: 27,
  music: 10402,
  romance: 10749,
}

/** URL-safe slug used when a row has no explicit key. */
function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * One reusable row factory. Give it a title and a TMDB genre id and it returns a
 * row the homepage can render:
 *
 *   createRow('Comedy Picks', GENRE_IDS.comedy)
 *
 * For rows that are not genre-based (trending, popular, upcoming, top rated)
 * pass `null` as the genre id and provide a `load` function in the options.
 *
 * Options:
 *   key       - stable id and scroll anchor (default: `genre-<id>` or a title slug)
 *   chip      - show a jump-to-row chip (default: true for genre rows, false otherwise)
 *   chipLabel - label for the chip (default: the title)
 *   genreName - local catalogue genre used by the "See all" link
 *   moreLink  - override the "See all" target
 *   load      - override the fetch function
 */
export function createRow(title, genreId, options = {}) {
  const isGenre = genreId != null
  const genreName = options.genreName || title

  return {
    key: options.key || (isGenre ? `genre-${genreId}` : slug(title)),
    title,
    genreId: isGenre ? genreId : null,
    chip: options.chip ?? isGenre,
    chipLabel: options.chipLabel || title,
    moreLink:
      options.moreLink ||
      (isGenre ? `/movies?genre=${encodeURIComponent(genreName)}` : '/movies'),
    // Genre rows fetch with `discoverMovies` (already sorted by popularity).
    // Every `load` takes a page so rows can paginate behind "Load More".
    load: options.load || ((page = 1) => discoverMovies({ genreId, page })),
  }
}

/**
 * Every row on the homepage, in order. To add a new one, add a line here:
 *
 *   createRow('Documentaries', 99),
 */
export const homeRows = [
  // --- the original rows ---
  createRow('Trending Now', null, {
    key: 'trending',
    chip: false,
    moreLink: '/movies?sort=trending',
    load: (page = 1) => getTrendingMovies(page),
  }),
  createRow('Popular on Net Web Flix', null, {
    key: 'popular',
    chip: false,
    moreLink: '/movies?sort=trending',
    load: (page = 1) => getPopularMovies(page),
  }),
  createRow('Upcoming', null, {
    key: 'upcoming',
    chip: false,
    moreLink: '/movies?sort=newest',
    load: (page = 1) => getUpcomingMovies(page),
  }),

  // --- genre rows (one line each) ---
  createRow('Comedy Picks', GENRE_IDS.comedy, { chipLabel: 'Comedy', genreName: 'Comedy' }),
  createRow('Music', GENRE_IDS.music, { chipLabel: 'Music', genreName: 'Music' }),
  createRow('Action Hits', GENRE_IDS.action, { chipLabel: 'Action', genreName: 'Action' }),
  createRow('Romance', GENRE_IDS.romance, { chipLabel: 'Romance', genreName: 'Romance' }),
  createRow('Horror Nights', GENRE_IDS.horror, { chipLabel: 'Horror', genreName: 'Horror' }),
  createRow('Animation / Anime', GENRE_IDS.animation, {
    chipLabel: 'Animation',
    genreName: 'Animation',
  }),
  createRow('Family', GENRE_IDS.family, { chipLabel: 'Family', genreName: 'Family' }),

  // --- top rated endpoint ---
  createRow('Top Rated All Time', null, {
    key: 'top-rated',
    chip: true,
    chipLabel: 'Top Rated',
    moreLink: '/movies?sort=rating',
    load: (page = 1) => getTopRatedMovies(page),
  }),
]
