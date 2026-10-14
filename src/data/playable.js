/**
 * Legal, openly-licensed video sources.
 *
 * Nothing here is scraped or pirated: every entry is a public-domain film or an
 * openly-licensed title (e.g. the Blender Foundation's Creative Commons movies)
 * served from a stable, legitimate host (the Internet Archive). When a title has
 * no entry, the UI hides the Watch/Download buttons and shows the TMDB
 * "Where to watch" panel instead - it never falls back to a fake or pirated URL.
 *
 * Keys
 * ----
 *   playableMovies   - the TMDB id (for TMDB titles) or the local catalogue slug
 *                      `id` (for offline titles), as a string.
 *   playableEpisodes - `${seriesId}-s${season}-e${episode}` where `seriesId` is
 *                      the TMDB TV id, e.g. "1399-s1-e1". Seasons/episodes are
 *                      1-based, matching TMDB.
 *
 * Adding a title
 * --------------
 *   1. Confirm you may distribute the file (public domain, CC, or your own).
 *   2. Add an entry with a direct MP4/WebM URL and its MIME `type`.
 *   3. The movie page then shows Download (left) / Watch (right) automatically.
 */

const ARCHIVE = 'https://archive.org/download'

/** Openly-licensed movies, keyed by TMDB id or local catalogue id. */
export const playableMovies = {
  // Blender Foundation open movies (Creative Commons Attribution).
  '10378': {
    url: `${ARCHIVE}/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4`,
    type: 'video/mp4',
    label: 'Big Buck Bunny',
    quality: '720p',
    license: 'CC BY 3.0',
  },
  '45745': {
    url: `${ARCHIVE}/Sintel/sintel-2048-surround.mp4`,
    type: 'video/mp4',
    label: 'Sintel',
    quality: '2048p',
    license: 'CC BY 3.0',
  },
  '133701': {
    url: `${ARCHIVE}/Tears-of-Steel/tears_of_steel_1080p.mp4`,
    type: 'video/mp4',
    label: 'Tears of Steel',
    quality: '1080p',
    license: 'CC BY 3.0',
  },
  '9761': {
    url: `${ARCHIVE}/ElephantsDream/ed_1024_512kb.mp4`,
    type: 'video/mp4',
    label: 'Elephants Dream',
    quality: '1024p',
    license: 'CC BY 2.5',
  },
}

/**
 * Openly-licensed episodes, keyed `${seriesId}-s${season}-e${episode}`.
 *
 * Example:
 *   '1399-s1-e1': { url: 'https://example.org/legal/episode.mp4', type: 'video/mp4' },
 */
export const playableEpisodes = {}

/** Stable key for a movie, matching the keys above. */
export function moviePlayKey(movie) {
  if (!movie) return ''
  if (movie.tmdbId != null) return String(movie.tmdbId)
  if (movie.id != null) return String(movie.id)
  return ''
}

/** Stable key for one episode, e.g. "1399-s1-e1". */
export function episodePlayKey(seriesId, seasonNumber, episodeNumber) {
  return `${seriesId}-s${seasonNumber}-e${episodeNumber}`
}

/** The playable source for a movie object, or null. */
export function getPlayableMovie(movie) {
  return playableMovies[moviePlayKey(movie)] || null
}

/** The playable source for a movie by route id (TMDB id or local slug), or null. */
export function getPlayableMovieById(id) {
  if (id == null) return null
  return playableMovies[String(id)] || null
}

/** The playable source for a single episode, or null. */
export function getPlayableEpisode(seriesId, seasonNumber, episodeNumber) {
  return playableEpisodes[episodePlayKey(seriesId, seasonNumber, episodeNumber)] || null
}

/** Normalise a playable entry into `{ url, type }` for the <video> element. */
export function toVideoSource(entry) {
  if (!entry || !entry.url) return null
  return { url: entry.url, type: entry.type || 'video/mp4' }
}
