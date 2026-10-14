/**
 * TMDB (The Movie Database) integration for real poster artwork.
 *
 * Everything here is safe to use even when no API key is configured:
 * `isTmdbConfigured()` returns false and the site keeps rendering its local
 * generated artwork, so nothing breaks offline.
 *
 * SECURITY NOTE: `VITE_TMDB_API_KEY` is embedded in the browser bundle, exactly
 * like TMDB's own browser demos. For a public deployment, proxy the requests
 * through a tiny server route instead, or restrict the key's allowed domains in
 * your TMDB project settings.
 */

const API_BASE_URL = 'https://api.themoviedb.org/3'

/** TMDB image CDN base (see https://developers.themoviedb.org/3/getting-started/images). */
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
export const TMDB_POSTER_SIZE = 'w500'

/**
 * Vite inlines `import.meta.env.VITE_TMDB_API_KEY` at build time, but only when
 * the property access is written plainly. Optional chaining
 * (`import.meta.env?.VITE_TMDB_API_KEY`) defeats the static replacement, so the
 * key must be read without `?.` here.
 */
const RAW_API_KEY = import.meta.env.VITE_TMDB_API_KEY

/** Values people commonly leave in `.env` while still filling it in. */
const PLACEHOLDER_KEYS = new Set([
  'your_key_here',
  'your_api_key',
  'your_api_key_here',
  'replace_me',
  'changeme',
  'tmdb_api_key',
])

/** The trimmed key/read token, or '' when missing or still a placeholder. */
function apiKey() {
  const value = typeof RAW_API_KEY === 'string' ? RAW_API_KEY.trim() : ''
  if (!value || PLACEHOLDER_KEYS.has(value.toLowerCase())) return ''
  return value
}

/**
 * TMDB accepts two credential types and they authenticate differently:
 *   - a v3 API key, sent as the `api_key` query parameter;
 *   - a v4 Read Access Token (a JWT starting with `eyJ`), sent as a Bearer
 *     token in the `Authorization` header.
 * Both are supported so whichever credential is in `.env` just works.
 */
function isV4ReadToken(key) {
  return key.startsWith('eyJ')
}

export function isTmdbConfigured() {
  return Boolean(apiKey())
}

/**
 * Build a poster URL from a TMDB `poster_path` (e.g. `/abc123.jpg`).
 * If the value is already an absolute URL it is returned unchanged.
 */
export function buildPosterUrl(posterPath, size = TMDB_POSTER_SIZE) {
  if (!posterPath) return null
  if (/^https?:\/\//i.test(posterPath)) return posterPath
  return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath.startsWith('/') ? posterPath : `/${posterPath}`}`
}

/** Build a profile-photo URL from a TMDB `profile_path`. Sizes: w45, w185, h632. */
export function buildProfileUrl(profilePath, size = 'w185') {
  if (!profilePath) return null
  if (/^https?:\/\//i.test(profilePath)) return profilePath
  return `${TMDB_IMAGE_BASE_URL}/${size}${profilePath.startsWith('/') ? profilePath : `/${profilePath}`}`
}

/** Build a backdrop URL from a TMDB `backdrop_path`. Sizes: w300, w780, w1280, original. */
export function buildBackdropUrl(backdropPath, size = 'w1280') {
  if (!backdropPath) return null
  if (/^https?:\/\//i.test(backdropPath)) return backdropPath
  return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath.startsWith('/') ? backdropPath : `/${backdropPath}`}`
}

/** Build a still/logo image URL from a TMDB `still_path`/`logo_path`. Sizes: w92, w300, ... */
export function buildImageUrl(path, size = 'w300') {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${TMDB_IMAGE_BASE_URL}/${size}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Build a fully-authenticated TMDB request. Uses the `api_key` query parameter
 * for a v3 key, or an `Authorization: Bearer` header for a v4 read token.
 */
function buildRequest(path, params = {}) {
  const key = apiKey()
  const url = new URL(`${API_BASE_URL}${path}`)
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(name, String(value))
    }
  })

  const headers = {}
  if (isV4ReadToken(key)) {
    headers.Authorization = `Bearer ${key}`
  } else {
    url.searchParams.set('api_key', key)
  }
  return { url: url.toString(), headers }
}

/**
 * Turn a failed HTTP response into a message that says what to fix. A 401
 * almost always means the key is missing, mistyped, or of the wrong type.
 */
function describeHttpError(status) {
  if (status === 401) {
    return 'TMDB rejected the API key (401). Check that VITE_TMDB_API_KEY in .env is a valid TMDB v3 API key or v4 Read Access Token, then restart the dev server.'
  }
  if (status === 404) {
    return 'TMDB could not find that title (404).'
  }
  if (status === 429) {
    return 'TMDB rate limit reached. Wait a moment and try again.'
  }
  return `TMDB request failed (${status}). Try again shortly.`
}

let warnedAboutAuth = false
function warnAuthOnce(message) {
  if (warnedAboutAuth || typeof console === 'undefined') return
  warnedAboutAuth = true
  console.warn(`[netwebfilx] ${message}`)
}

/** Perform an authenticated TMDB request, normalising errors and JSON parsing. */
async function tmdbRequest(path, params = {}) {
  let response
  try {
    const { url, headers } = buildRequest(path, params)
    response = await fetch(url, { headers })
  } catch {
    throw new Error('Could not reach TMDB. Check your internet connection and try again.')
  }
  if (!response.ok) {
    const message = describeHttpError(response.status)
    if (response.status === 401) warnAuthOnce(message)
    throw new Error(message)
  }
  return response.json()
}

async function searchMovie(title, year) {
  const params = {
    query: String(title ?? ''),
    include_adult: 'false',
    page: '1',
  }
  if (year) params.year = String(year)

  const data = await tmdbRequest('/search/movie', params)
  return Array.isArray(data.results) ? data.results : []
}

/**
 * Pick the best poster from TMDB search results. Rules:
 *  - only results that actually have a `poster_path` are candidates,
 *  - a result whose release year matches the requested year is preferred,
 *  - otherwise the first candidate wins. Never random.
 */
function pickPosterPath(results, year) {
  const candidates = results.filter((result) => result && result.poster_path)
  if (!candidates.length) return null
  if (year) {
    const exactYear = candidates.find((result) => {
      const release = result.release_date
      return release && Number(release.slice(0, 4)) === year
    })
    if (exactYear) return exactYear.poster_path
  }
  return candidates[0].poster_path
}

/**
 * In-memory cache so scrolling rows and repeated mounts don't re-hit the API.
 * Successful lookups (including "no poster") are cached; failures are dropped
 * from the cache so a later attempt can retry.
 */
const posterCache = new Map()

/**
 * Resolve a movie's real poster URL from TMDB.
 * Resolves with `null` when TMDB has no poster or no key is configured.
 */
export function fetchMoviePosterUrl(title, year) {
  if (!isTmdbConfigured()) return Promise.resolve(null)

  const key = `${title ?? ''}|${year ?? ''}`
  if (!posterCache.has(key)) {
    const request = searchMovie(title, year)
      .then((results) => buildPosterUrl(pickPosterPath(results, year)))
      .catch((error) => {
        posterCache.delete(key)
        throw error
      })
    posterCache.set(key, request)
  }
  return posterCache.get(key)
}

/* --------------------------------------------------------------------------
   Trailers (TMDB /videos)
   --------------------------------------------------------------------------
   Trailers are streamed from YouTube via TMDB's official video metadata. No
   video URL is ever invented: if TMDB has no YouTube trailer or teaser, the
   caller receives `null` and the UI shows a friendly message.
   -------------------------------------------------------------------------- */

/** Best playable YouTube video for a movie, or null when there is none. */
function pickTrailer(videos) {
  if (!Array.isArray(videos)) return null
  const youtube = videos.filter(
    (video) => video && video.site === 'YouTube' && video.key && (video.type === 'Trailer' || video.type === 'Teaser'),
  )
  if (!youtube.length) return null

  const score = (video) => {
    let value = video.type === 'Trailer' ? 100 : 50
    if (video.official) value += 10
    if (video.iso_639_1 === 'en') value += 5
    return value
  }
  return [...youtube].sort((a, b) => score(b) - score(a))[0]
}

/** Privacy-friendly YouTube embed URL for a video key. */
export function buildTrailerEmbedUrl(key) {
  if (!key) return null
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(key)}?rel=0&modestbranding=1`
}

/** Resolve a title/year to a TMDB movie id (used for local catalogue titles). */
export async function resolveTmdbMovieId(title, year) {
  const results = await searchMovie(title, year)
  if (!results.length) return null
  if (year) {
    const exact = results.find(
      (result) => result.release_date && Number(result.release_date.slice(0, 4)) === year,
    )
    if (exact) return exact.id
  }
  return results[0].id
}

const trailerCache = new Map()

/** Normalised trailer info `{ key, name, type, embedUrl }`, or null. */
export function getTmdbMovieTrailer(tmdbId) {
  ensureConfigured()
  return cacheRequest(trailerCache, `videos:${tmdbId}`, () =>
    tmdbRequest(`/movie/${tmdbId}/videos`).then((data) => {
      const best = pickTrailer(data.results)
      if (!best) return null
      return {
        key: best.key,
        name: best.name || 'Official trailer',
        type: best.type === 'Teaser' ? 'Teaser' : 'Trailer',
        embedUrl: buildTrailerEmbedUrl(best.key),
      }
    }),
  )
}

/**
 * Resolve a trailer for a movie that may carry a TMDB id (explorer) or only a
 * title/year (local catalogue). Resolves with `null` when no trailer exists or
 * when TMDB is not configured. Never returns a guessed or invented URL.
 */
export function fetchMovieTrailer({ tmdbId, title, year }) {
  if (!isTmdbConfigured()) return Promise.resolve(null)
  const cacheKey = tmdbId ? `id:${tmdbId}` : `title:${title ?? ''}|${year ?? ''}`
  return cacheRequest(trailerCache, cacheKey, async () => {
    const id = tmdbId ?? (await resolveTmdbMovieId(title, year))
    if (!id) return null
    return getTmdbMovieTrailer(id)
  })
}

/* --------------------------------------------------------------------------
   Movie & Actor Explorer service
   --------------------------------------------------------------------------
   Additive endpoints used by the /explorer pages. Every lookup is keyed by TMDB
   IDs so images and facts always belong to the correct person or film.

   Shared helpers
   -------------------------------------------------------------------------- */

function ensureConfigured() {
  if (!isTmdbConfigured()) {
    throw new Error(
      'The TMDB API key is not configured. Add VITE_TMDB_API_KEY to a .env file in the project root (next to package.json), then restart the dev server.',
    )
  }
}

/** Cache a promise, dropping it again on failure so retries actually retry. */
function cacheRequest(map, key, factory, max = 250) {
  if (map.has(key)) return map.get(key)
  const request = factory().catch((error) => {
    map.delete(key)
    throw error
  })
  map.set(key, request)
  if (map.size > max) {
    const oldest = map.keys().next().value
    map.delete(oldest)
  }
  return request
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/

function safeYear(dateString) {
  if (!dateString || !DATE_PATTERN.test(dateString)) return null
  return Number(dateString.slice(0, 4))
}

/**
 * Normalise a TMDB movie/document object into the shape the site renders
 * (Poster reads `movie.poster` directly, so poster URLs are attached here and
 * never guessed from a title hash).
 */
export function mapTmdbMovie(tmdb) {
  if (!tmdb) return null
  return {
    tmdbId: tmdb.id,
    title: tmdb.title || tmdb.original_title || 'Untitled',
    tagline: tmdb.tagline || '',
    year: safeYear(tmdb.release_date),
    releaseDate: tmdb.release_date || '',
    rating: typeof tmdb.vote_average === 'number' ? Number(tmdb.vote_average.toFixed(1)) : null,
    runtime: typeof tmdb.runtime === 'number' ? tmdb.runtime : null,
    genres: Array.isArray(tmdb.genres) ? tmdb.genres.map((genre) => genre.name) : [],
    overview: tmdb.overview || '',
    poster: buildPosterUrl(tmdb.poster_path),
    posterPath: tmdb.poster_path || '',
    backdrop: buildBackdropUrl(tmdb.backdrop_path),
    // Used to break relevance ties in search results (exact title first, then
    // the most popular release), never for ranking on its own.
    popularity: typeof tmdb.popularity === 'number' ? tmdb.popularity : 0,
    voteCount: typeof tmdb.vote_count === 'number' ? tmdb.vote_count : 0,
  }
}

function mapTmdbPerson(person) {
  if (!person) return null
  return {
    tmdbId: person.id,
    name: person.name || 'Unknown',
    department: person.known_for_department || '',
    profile: buildProfileUrl(person.profile_path),
    knownFor: (person.known_for || []).map(mapTmdbMovie).filter(Boolean).slice(0, 4),
  }
}

function mapCredit(roleField) {
  return (credit) => ({
    tmdbId: credit.id,
    mediaType: credit.media_type || 'movie',
    title: credit.title || credit.original_title || credit.name || 'Untitled',
    year: safeYear(credit.release_date || credit.first_air_date),
    poster: buildPosterUrl(credit.poster_path),
    role: typeof credit[roleField] === 'string' ? credit[roleField] : '',
    popularity: credit.popularity || 0,
    voteCount: credit.vote_count || 0,
  })
}

function mapMovieDetails(data) {
  const movie = mapTmdbMovie(data)
  const cast = (data.credits?.cast || [])
    .slice(0, 14)
    .map((member) => ({
      id: member.id,
      name: member.name || 'Unknown',
      character: typeof member.character === 'string' ? member.character : '',
      profile: buildProfileUrl(member.profile_path),
    }))
  const crew = (data.credits?.crew || []).map((member) => ({
    id: member.id,
    name: member.name || 'Unknown',
    job: member.job || '',
  }))
  const director = crew.find((member) => member.job === 'Director') || null
  return { ...movie, cast, director }
}

function mapPersonDetails(data) {
  return {
    tmdbId: data.id,
    name: data.name || 'Unknown',
    profile: buildProfileUrl(data.profile_path, 'h632'),
    department: data.known_for_department || '',
    biography: data.biography || '',
    birthday: data.birthday || '',
    deathday: data.deathday || '',
    placeOfBirth: data.place_of_birth || '',
    alsoKnownAs: Array.isArray(data.also_known_as) ? data.also_known_as.filter(Boolean) : [],
  }
}

/** In-memory caches (session only). */
const movieDetailsCache = new Map()
const personDetailsCache = new Map()
const personCreditsCache = new Map()

/* --------------------------------------------------------------------------
   Search
   -------------------------------------------------------------------------- */

/**
 * Search TMDB for movies by name. Returns { results, totalResults } where each
 * result is a fully-normalised movie object. Pass `year` to restrict the
 * search to a primary release year (TMDB `/search/movie` `primary_release_year`).
 */
export function searchMoviesByTitle(query, page = 1, year) {
  ensureConfigured()
  const params = {
    query: String(query).trim(),
    page: String(page),
    include_adult: 'false',
  }
  if (year) params.primary_release_year = String(year)

  return tmdbRequest('/search/movie', params).then((data) => ({
    page: data.page,
    totalResults: data.total_results ?? 0,
    results: (data.results || []).map(mapTmdbMovie).filter(Boolean),
  }))
}

/**
 * Search TMDB for people (actors, directors, crew) by name.
 */
export function searchPeopleByName(query, page = 1) {
  ensureConfigured()
  return tmdbRequest('/search/person', {
    query: String(query).trim(),
    page: String(page),
    include_adult: 'false',
  }).then((data) => ({
    page: data.page,
    totalPages: data.total_pages ?? 1,
    totalResults: data.total_results ?? 0,
    results: (data.results || []).map(mapTmdbPerson).filter(Boolean),
  }))
}

/**
 * Combined TMDB search (`/search/multi`): one request that returns movies and
 * people together. Used by the main search page so a single query surfaces both
 * the closest film and the actors/directors who match the name. TV results are
 * ignored because the site is movie-focused.
 */
export function searchMulti(query, page = 1) {
  ensureConfigured()
  return tmdbRequest('/search/multi', {
    query: String(query).trim(),
    page: String(page),
    include_adult: 'false',
  }).then((data) => {
    const moviesResult = []
    const peopleResult = []
    for (const item of data.results || []) {
      if (!item || !item.media_type) continue
      if (item.media_type === 'movie') {
        const movie = mapTmdbMovie(item)
        if (movie) moviesResult.push(movie)
      } else if (item.media_type === 'person') {
        const person = mapTmdbPerson(item)
        if (person) peopleResult.push(person)
      }
    }
    return {
      page: data.page,
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
      movies: moviesResult,
      people: peopleResult,
    }
  })
}

/* --------------------------------------------------------------------------
   Discover (popular people / popular TV)
   -------------------------------------------------------------------------- */

const popularPeopleCache = new Map()
const popularTvCache = new Map()

/** Popular people (actors, directors, ...) from TMDB `/person/popular`. */
export function getPopularPeople(page = 1) {
  ensureConfigured()
  return cacheRequest(popularPeopleCache, `popular:${page}`, () =>
    tmdbRequest('/person/popular', { page: String(page) }).then((data) => ({
      page: data.page,
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
      results: (data.results || []).map(mapTmdbPerson).filter(Boolean),
    })),
  )
}

/** Normalise a TMDB TV show into the shape the compact `TmdbMovieCard` renders. */
function mapTmdbTv(tv) {
  if (!tv) return null
  return {
    tmdbId: tv.id,
    title: tv.name || tv.original_name || 'Untitled',
    year: safeYear(tv.first_air_date),
    releaseDate: tv.first_air_date || '',
    rating: typeof tv.vote_average === 'number' ? Number(tv.vote_average.toFixed(1)) : null,
    overview: tv.overview || '',
    poster: buildPosterUrl(tv.poster_path),
    posterPath: tv.poster_path || '',
    backdrop: buildBackdropUrl(tv.backdrop_path),
  }
}

/** Popular TV shows from TMDB `/tv/popular`. */
export function getPopularTvShows(page = 1) {
  ensureConfigured()
  return cacheRequest(popularTvCache, `popular:${page}`, () =>
    tmdbRequest('/tv/popular', { page: String(page) }).then((data) => ({
      page: data.page,
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
      results: (data.results || []).map(mapTmdbTv).filter(Boolean),
    })),
  )
}

/* --------------------------------------------------------------------------
   TV details, seasons & watch providers
   --------------------------------------------------------------------------
   Powers the series detail page: the show itself (`/tv/{id}`), its episodes
   (`/tv/{id}/season/{n}`) and the legal streaming options
   (`/movie|tv/{id}/watch/providers`). Each response is normalised to the flat
   shapes the UI renders; nothing is guessed.
   -------------------------------------------------------------------------- */

const tvDetailsCache = new Map()
const tvSeasonCache = new Map()
const watchProvidersCache = new Map()

/** Normalise the full show document (`/tv/{id}`) + its season list. */
function mapTmdbTvDetails(data) {
  const show = mapTmdbTv(data) || {}
  const seasons = (data.seasons || [])
    .filter((season) => season && season.season_number != null)
    .map((season) => ({
      seasonNumber: season.season_number,
      name: season.name || `Season ${season.season_number}`,
      episodeCount: season.episode_count ?? 0,
      airDate: season.air_date || '',
      poster: buildPosterUrl(season.poster_path),
      overview: season.overview || '',
    }))
  const runtimes = Array.isArray(data.episode_run_time) ? data.episode_run_time : []
  return {
    ...show,
    tagline: data.tagline || '',
    genres: Array.isArray(data.genres) ? data.genres.map((genre) => genre.name) : [],
    numberOfSeasons: data.number_of_seasons ?? seasons.length,
    runtime: runtimes.length ? runtimes[0] : null,
    status: data.status || '',
    seasons,
  }
}

/** Normalise one episode of a season. */
function mapTvEpisode(episode) {
  if (!episode) return null
  return {
    episodeNumber: episode.episode_number,
    seasonNumber: episode.season_number,
    name: episode.name || `Episode ${episode.episode_number}`,
    overview: episode.overview || '',
    still: buildImageUrl(episode.still_path, 'w300'),
    runtime: typeof episode.runtime === 'number' ? episode.runtime : null,
    airDate: episode.air_date || '',
    rating: typeof episode.vote_average === 'number' && episode.vote_average > 0
      ? Number(episode.vote_average.toFixed(1))
      : null,
  }
}

/** Full show (backdrop, genres, seasons) by TMDB id. */
export function getTmdbTvDetails(id) {
  ensureConfigured()
  return cacheRequest(tvDetailsCache, `tv:${id}`, () =>
    tmdbRequest(`/tv/${id}`).then(mapTmdbTvDetails),
  )
}

/** One season's episode list from `/tv/{id}/season/{n}`. */
export function getTvSeason(id, seasonNumber) {
  ensureConfigured()
  return cacheRequest(tvSeasonCache, `tv:${id}:s${seasonNumber}`, () =>
    tmdbRequest(`/tv/${id}/season/${seasonNumber}`).then((data) => ({
      seasonNumber: data.season_number ?? seasonNumber,
      name: data.name || `Season ${seasonNumber}`,
      overview: data.overview || '',
      poster: buildPosterUrl(data.poster_path),
      episodes: (data.episodes || []).map(mapTvEpisode).filter(Boolean),
    })),
  )
}

/**
 * Legal streaming/rental/buy options for a movie or show, by TMDB id, for a
 * region (defaults to US). Returns empty lists when TMDB has no data for the
 * region - the UI then shows a friendly "not available" message.
 */
export function getWatchProviders({ mediaType = 'movie', tmdbId, region = 'US' } = {}) {
  ensureConfigured()
  const type = mediaType === 'tv' ? 'tv' : 'movie'
  return cacheRequest(watchProvidersCache, `providers:${type}:${tmdbId}:${region}`, () =>
    tmdbRequest(`/${type}/${tmdbId}/watch/providers`).then((data) => {
      const entry = (data.results || {})[region] || null
      const providers = (list) =>
        (Array.isArray(list) ? list : []).map((provider) => ({
          id: provider.provider_id,
          name: provider.provider_name || 'Provider',
          logo: buildImageUrl(provider.logo_path, 'w92'),
        }))
      if (!entry) {
        return { region, link: null, flatrate: [], free: [], ads: [], rent: [], buy: [] }
      }
      return {
        region,
        link: entry.link || null,
        flatrate: providers(entry.flatrate),
        free: providers(entry.free),
        ads: providers(entry.ads),
        rent: providers(entry.rent),
        buy: providers(entry.buy),
      }
    }),
  )
}

/* --------------------------------------------------------------------------
   Trending movies (homepage hero)
   --------------------------------------------------------------------------
   The homepage hero and its poster row are fed by TMDB `/trending/movie/week`
   so visitors see real, current movies as soon as the site opens. Uses the same
   API key, request helper, normalisation and cache as every other TMDB call.
   -------------------------------------------------------------------------- */

const trendingCache = new Map()

/** Movies trending for a time window ('day' or 'week') on TMDB, page 1. */
export function getTrendingMovies(page = 1, timeWindow = 'week') {
  ensureConfigured()
  return cacheRequest(trendingCache, `trending:${timeWindow}:${page}`, () =>
    tmdbRequest(`/trending/movie/${timeWindow}`, { page: String(page) }).then((data) => ({
      page: data.page,
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
      results: (data.results || []).map(mapTmdbMovie).filter(Boolean),
    })),
  )
}

/* --------------------------------------------------------------------------
   Discover (Explore page: popular / top rated / genre & mood filters)
   --------------------------------------------------------------------------
   These feed the Explore page sections. Every call uses the same single API
   configuration, request helper, normaliser and in-memory cache as the rest of
   the TMDB integration. Results are real - nothing is fabricated when the API
   (and a configured key) is available.
   -------------------------------------------------------------------------- */

const popularMoviesCache = new Map()
const topRatedMoviesCache = new Map()
const upcomingMoviesCache = new Map()
const discoverCache = new Map()

/** Popular movies from TMDB `/movie/popular`. */
export function getPopularMovies(page = 1) {
  ensureConfigured()
  return cacheRequest(popularMoviesCache, `popular:${page}`, () =>
    tmdbRequest('/movie/popular', { page: String(page) }).then((data) => ({
      page: data.page,
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
      results: (data.results || []).map(mapTmdbMovie).filter(Boolean),
    })),
  )
}

/** Top rated movies from TMDB `/movie/top_rated`. */
export function getTopRatedMovies(page = 1) {
  ensureConfigured()
  return cacheRequest(topRatedMoviesCache, `top-rated:${page}`, () =>
    tmdbRequest('/movie/top_rated', { page: String(page) }).then((data) => ({
      page: data.page,
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
      results: (data.results || []).map(mapTmdbMovie).filter(Boolean),
    })),
  )
}

/** Upcoming (not yet released) movies from TMDB `/movie/upcoming`. */
export function getUpcomingMovies(page = 1) {
  ensureConfigured()
  return cacheRequest(upcomingMoviesCache, `upcoming:${page}`, () =>
    tmdbRequest('/movie/upcoming', { page: String(page) }).then((data) => ({
      page: data.page,
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
      results: (data.results || []).map(mapTmdbMovie).filter(Boolean),
    })),
  )
}

/**
 * Discover movies from TMDB `/discover/movie` filtered by genre (`with_genres`),
 * release year (`primary_release_year`), original language
 * (`with_original_language`, ISO 639-1 code) and a minimum vote average
 * (`vote_average.gte`). All filters are optional; pass `genreId` alone to
 * browse a genre (mood chips map to genre ids).
 */
export function discoverMovies({
  genreId,
  year,
  language,
  minRating,
  page = 1,
  sortBy = 'popularity.desc',
} = {}) {
  ensureConfigured()
  const params = { page: String(page), sort_by: sortBy }
  if (genreId) params.with_genres = String(genreId)
  if (year) params.primary_release_year = String(year)
  if (language) params.with_original_language = String(language)
  if (minRating) params['vote_average.gte'] = String(minRating)

  const cacheKey = `discover:${genreId ?? ''}:${year ?? ''}:${language ?? ''}:${minRating ?? ''}:${sortBy}:${page}`
  return cacheRequest(discoverCache, cacheKey, () =>
    tmdbRequest('/discover/movie', params).then((data) => ({
      page: data.page,
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
      results: (data.results || []).map(mapTmdbMovie).filter(Boolean),
    })),
  )
}

/* --------------------------------------------------------------------------
   Details
   -------------------------------------------------------------------------- */

/** Full TMDB movie by its TMDB id, including cast and director. */
export function getTmdbMovieDetails(id) {
  ensureConfigured()
  return cacheRequest(movieDetailsCache, `movie:${id}`, () =>
    tmdbRequest(`/movie/${id}`, { append_to_response: 'credits' }).then(mapMovieDetails),
  )
}

/* --------------------------------------------------------------------------
   Movie credits (cast & crew)
   --------------------------------------------------------------------------
   Used by the local catalogue movie page, which has no TMDB id of its own:
   the title/year is resolved to a TMDB id first, then the official
   `/movie/{id}/credits` endpoint supplies real names, characters and profile
   photos. Nothing is guessed - a missing `profile_path` becomes a placeholder
   in the UI, never a random face.
   -------------------------------------------------------------------------- */

/** Normalise one TMDB cast member into the shape the cast cards render. */
function mapCastMember(member) {
  if (!member) return null
  return {
    id: member.id,
    name: member.name || 'Unknown',
    character: typeof member.character === 'string' ? member.character : '',
    // Actor headshot at TMDB's w185 size: https://image.tmdb.org/t/p/w185/<profile_path>
    profile: buildProfileUrl(member.profile_path, 'w185'),
    order: typeof member.order === 'number' ? member.order : 0,
  }
}

const movieCreditsCache = new Map()
const movieCastCache = new Map()

/** Full normalised TMDB credits `{ cast, crew }` for a TMDB movie id. */
export function getTmdbMovieCredits(tmdbId) {
  ensureConfigured()
  return cacheRequest(movieCreditsCache, `credits:${tmdbId}`, () =>
    tmdbRequest(`/movie/${tmdbId}/credits`).then((data) => ({
      cast: (data.cast || []).map(mapCastMember).filter(Boolean),
      crew: (data.crew || []).map((member) => ({
        id: member.id,
        name: member.name || 'Unknown',
        job: member.job || '',
        department: member.department || '',
        profile: buildProfileUrl(member.profile_path),
      })),
    })),
  )
}

const tvCreditsCache = new Map()

/** Full normalised TMDB credits `{ cast, crew }` for a TMDB TV id. */
export function getTmdbTvCredits(tmdbId) {
  ensureConfigured()
  return cacheRequest(tvCreditsCache, `tv-credits:${tmdbId}`, () =>
    tmdbRequest(`/tv/${tmdbId}/credits`).then((data) => ({
      cast: (data.cast || []).map(mapCastMember).filter(Boolean),
      crew: (data.crew || []).map((member) => ({
        id: member.id,
        name: member.name || 'Unknown',
        job: member.job || '',
        department: member.department || '',
        profile: buildProfileUrl(member.profile_path),
      })),
    })),
  )
}

/**
 * Resolve the cast for a title that may carry a TMDB id (explorer) or only a
 * title/year (local catalogue). Resolves with `null` when TMDB is not
 * configured so callers can fall back gracefully.
 */
export function fetchMovieCast({ tmdbId, title, year }) {
  if (!isTmdbConfigured()) return Promise.resolve(null)
  const cacheKey = tmdbId ? `id:${tmdbId}` : `title:${title ?? ''}|${year ?? ''}`
  return cacheRequest(movieCastCache, cacheKey, async () => {
    const id = tmdbId ?? (await resolveTmdbMovieId(title, year))
    if (!id) return null
    const { cast } = await getTmdbMovieCredits(id)
    return cast
  })
}

/* --------------------------------------------------------------------------
   Actor profile photo fallback (/search/person)
   --------------------------------------------------------------------------
   Cast cards show real headshots fetched from `/movie/{id}/credits`. When a
   member still has no `profile` (a local-cast title that could not be resolved
   to a TMDB movie, or a credit without a photo), this searches TMDB's person
   index by name and builds the w185 URL from the matched `profile_path`.
   Results are cached per normalised name so each actor is fetched at most once
   per session. When TMDB is not configured, no photo exists, or the search
   fails, it resolves `null` and the initials placeholder stays.
   -------------------------------------------------------------------------- */

const actorProfileCache = new Map()

/** Find the best w185 headshot URL for an actor by name, or null. */
export function fetchActorProfile(name) {
  const key = String(name ?? '').trim().toLowerCase()
  if (!key) return Promise.resolve(null)
  if (actorProfileCache.has(key)) return actorProfileCache.get(key)

  const request = isTmdbConfigured()
    ? tmdbRequest('/search/person', {
        query: String(name).trim(),
        page: '1',
        include_adult: 'false',
      })
        .then((data) => {
          const people = Array.isArray(data.results) ? data.results : []
          // Prefer an acting credit, fall back to whichever match is most
          // popular. Never a random face: only results with a real profile_path.
          const withPhoto = people.filter((person) => person && person.profile_path)
          const actor = withPhoto.find((person) => person.known_for_department === 'Acting')
          const best = actor ||
            [...withPhoto].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0]
          return best ? buildProfileUrl(best.profile_path, 'w185') : null
        })
        .catch((error) => {
          // Don't cache failures so a later attempt can retry.
          actorProfileCache.delete(key)
          throw error
        })
    : Promise.resolve(null)

  actorProfileCache.set(key, request)
  return actorProfileCache.get(key)
}

/** TMDB person profile (biography, birthday, birthplace, ...) by TMDB id. */
export function getTmdbPersonDetails(id) {
  ensureConfigured()
  return cacheRequest(personDetailsCache, `person:${id}`, () =>
    tmdbRequest(`/person/${id}`).then(mapPersonDetails),
  )
}

/** Combined movie credits (cast + crew) for a person, films only. */
export function getTmdbPersonCredits(id) {
  ensureConfigured()
  return cacheRequest(personCreditsCache, `credits:${id}`, () =>
    tmdbRequest(`/person/${id}/combined_credits`).then((data) => {
      const cast = (data.cast || []).filter((credit) => credit.media_type === 'movie').map(mapCredit('character'))
      const crew = (data.crew || []).filter((credit) => credit.media_type === 'movie').map(mapCredit('job'))
      return { cast, crew }
    }),
  )
}