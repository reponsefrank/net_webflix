/**
 * Local catalogue search.
 *
 * A small, dependency-free relevance engine over the bundled catalogue. It is
 * deliberately forgiving:
 *
 *  - Exact and prefix title matches rank highest, but token, whole-phrase,
 *    cast, director, genre and year matches all contribute to the score.
 *  - Typos and near-misses - including swapped letters and partial names - are
 *    caught with a Damerau-Levenshtein (edit distance) fallback, which also
 *    powers "did you mean" suggestions for titles that are not in the catalogue
 *    at all.
 *  - Cast and directors are indexed as *people* so searching an actor returns
 *    the person and the films they worked on, not just the films.
 *
 * Nothing here touches the network, so it works with no API key.
 */

import { movies } from '../data/movies'

const COMBINING_MARKS = /[\u0300-\u036f]/g

/** Lowercase, strip accents/punctuation and collapse whitespace. */
export function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Damerau-Levenshtein (optimal string alignment) edit distance.
 *
 * A plain Levenshtein distance counts a swapped pair ("inceptoin") as two
 * edits, which is enough to drop a title below a sensible similarity
 * threshold. Counting an adjacent transposition as a single edit keeps common
 * finger-slips findable. The strings here are short (a title or a name), so a
 * full matrix is cheap.
 */
export function editDistance(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const rows = a.length + 1
  const cols = b.length + 1
  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0))

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      )
      // Adjacent transposition ("inceptoin" -> "inception") counts as one edit.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1)
      }
    }
  }

  return matrix[a.length][b.length]
}

/** 0..1 similarity based on edit distance relative to the longest string. */
export function similarity(a, b) {
  if (!a || !b) return 0
  const longest = Math.max(a.length, b.length)
  if (!longest) return 1
  return 1 - editDistance(a, b) / longest
}

/** Shortest query token that may match a word by prefix ("leo" -> "leonardo"). */
const PREFIX_MIN = 3

/**
 * Best match between one query token and any token of a title/name.
 * Exact and prefix hits rank above fuzzy spellings, so "nolan" beats a
 * near-miss and "leo" still finds "leonardo".
 */
function bestTokenMatch(queryToken, tokens) {
  let best = 0
  for (const token of tokens) {
    let score
    if (token === queryToken) score = 1
    else if (queryToken.length >= PREFIX_MIN && token.startsWith(queryToken)) score = 0.9
    else if (token.length >= PREFIX_MIN && queryToken.startsWith(token)) score = 0.9
    else score = similarity(queryToken, token)
    if (score > best) best = score
    if (best === 1) break
  }
  return best
}

const MIN_QUERY = 2

/* --------------------------------------------------------------------------
   Scoring
   -------------------------------------------------------------------------- */

/**
 * Score a human name (cast/director) against a normalised query.
 * Handles "nolan" -> "Christopher Nolan", "jk simmons" -> "J.K. Simmons" and
 * fuzzy spellings.
 */
function scoreName(rawName, q) {
  const name = normalize(rawName)
  if (!name || !q) return 0

  if (name === q) return 1000

  const tokens = name.split(' ').filter(Boolean)
  const queryTokens = q.split(' ').filter(Boolean)

  if (tokens.includes(q)) return 720
  if (name.startsWith(q)) return 680
  if (q.length >= 2 && tokens.some((token) => token.startsWith(q))) return 560
  if (q.length >= 3 && name.includes(q)) return 420

  // Ignore punctuation gaps: "jk simmons" should still find "J.K. Simmons".
  const compactName = name.replace(/ /g, '')
  const compactQuery = q.replace(/ /g, '')
  if (compactQuery.length >= 3 && compactName.includes(compactQuery)) return 400

  // Token-by-token matching so a partial or slightly misspelled multi-word
  // name still finds the person: "chris nolan" -> "Christopher Nolan",
  // "leo dicaprio" -> "Leonardo DiCaprio", "tom hardi" -> "Tom Hardy".
  if (queryTokens.length) {
    const perToken = queryTokens.map((queryToken) => bestTokenMatch(queryToken, tokens))
    const average = perToken.reduce((sum, value) => sum + value, 0) / perToken.length
    // Every token must be a close match, otherwise "the matrix" would match
    // any name that happens to contain "the".
    const weakest = Math.min(...perToken)
    if (weakest >= 0.78 && average >= 0.82) {
      const multiWordBonus = queryTokens.length > 1 ? 120 : 0
      return Math.round(400 * average) + multiWordBonus
    }
  }

  const whole = similarity(name, q)
  if (whole >= 0.8) return Math.round(320 * whole)

  return 0
}

/** Score a movie title against a normalised query. */
function scoreTitle(rawTitle, q) {
  const title = normalize(rawTitle)
  if (!title || !q) return 0

  if (title === q) return 1000

  const tokens = title.split(' ').filter(Boolean)
  const queryTokens = q.split(' ').filter(Boolean)

  if (title.startsWith(q)) return 700
  if (tokens.includes(q)) return 640
  if (q.length >= 3 && title.includes(q)) return 480
  if (queryTokens.length > 1 && queryTokens.every((token) => title.includes(token))) return 430

  // Ignore punctuation gaps ("spiderverse" -> "spider man into the spider verse").
  const compactTitle = title.replace(/ /g, '')
  const compactQuery = q.replace(/ /g, '')
  if (compactQuery.length >= 4 && compactTitle.includes(compactQuery)) return 430

  const whole = similarity(title, q)
  if (whole >= 0.8) return Math.round(300 * whole)

  // Word-by-word fuzzy match ("dark night" -> "the dark knight",
  // "intersteller" -> "interstellar"). For phrases, require one near-exact
  // token so a common word cannot drag in unrelated titles; a single-word
  // query is already gated by the average.
  if (queryTokens.length) {
    const perToken = queryTokens.map((queryToken) => bestTokenMatch(queryToken, tokens))
    const average = perToken.reduce((sum, value) => sum + value, 0) / perToken.length
    const hasStrongToken = perToken.some((value) => value >= 0.9)
    if (average >= 0.8 && (queryTokens.length === 1 || hasStrongToken)) {
      return Math.round(230 * average)
    }
  }

  return 0
}

/**
 * Ranking tier for a title against a query, shared by the local engine and the
 * TMDB supplement so mixed result sets put the exact title first:
 *
 *   1.00 exact match
 *   0.90 title starts with the query
 *   0.80 the query is a whole word in the title
 *   0.70 the title contains the query
 *   0.60 every query word appears in the title
 *   0.30+ fuzzy spelling match (typos), scaled by similarity
 *   0     no match
 *
 * Callers sort by this value first and use popularity (or rating) as the
 * tie-breaker.
 */
export function titleRelevance(rawTitle, rawQuery) {
  const title = normalize(rawTitle)
  const q = normalize(rawQuery)
  if (!title || !q) return 0

  if (title === q) return 1
  if (title.startsWith(q)) return 0.9

  const tokens = title.split(' ').filter(Boolean)
  const queryTokens = q.split(' ').filter(Boolean)

  if (tokens.includes(q)) return 0.8
  if (title.includes(q)) return 0.7
  if (queryTokens.length > 1 && queryTokens.every((token) => title.includes(token))) return 0.6

  // Typo tolerance: a near-miss still outranks an unrelated film.
  const tokensBest = queryTokens.reduce(
    (sum, queryToken) => sum + bestTokenMatch(queryToken, tokens),
    0,
  )
  const tokenAverage = tokensBest / Math.max(queryTokens.length, 1)
  const whole = similarity(title, q)
  const fuzzy = Math.max(whole, tokenAverage)
  if (fuzzy >= 0.72) return 0.3 + fuzzy * 0.2

  return 0
}

/** Total relevance of a single movie to the query. */
function scoreMovie(movie, q) {
  const titleScore = scoreTitle(movie.title, q)

  let score = titleScore

  let castScore = 0
  for (const name of movie.cast || []) {
    const value = scoreName(name, q)
    if (value > castScore) castScore = value
  }
  if (castScore) score += Math.round(castScore * 0.45)

  const directorScore = scoreName(movie.director, q)
  if (directorScore) score += Math.round(directorScore * 0.5)

  const genres = movie.genres || []
  if (genres.some((genre) => normalize(genre) === q)) score += 140
  else if (genres.some((genre) => normalize(genre).startsWith(q) && q.length >= 3)) score += 90

  if (q.length >= 4 && String(movie.year).includes(q)) score += 60

  return { movie, score, titleMatched: titleScore > 0 }
}

/* --------------------------------------------------------------------------
   People index (cast + directors across the whole catalogue)
   -------------------------------------------------------------------------- */

function buildPeopleIndex() {
  const index = new Map()

  const add = (rawName, role, movie) => {
    const key = normalize(rawName)
    if (!key) return
    let entry = index.get(key)
    if (!entry) {
      entry = { id: key, name: String(rawName).trim(), roles: new Set(), movies: [] }
      index.set(key, entry)
    }
    entry.roles.add(role)
    if (!entry.movies.includes(movie)) entry.movies.push(movie)
  }

  for (const movie of movies) {
    for (const name of movie.cast || []) add(name, 'actor', movie)
    if (movie.director) add(movie.director, 'director', movie)
  }

  return Array.from(index.values()).map((entry) => {
    const roles = Array.from(entry.roles)
    entry.movies.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    return {
      id: entry.id,
      name: entry.name,
      roles,
      // "Director" only when they never acted in the catalogue; mixed people
      // are labelled by their acting work.
      role: roles.includes('actor') ? 'actor' : 'director',
      movies: entry.movies,
    }
  })
}

const PEOPLE = buildPeopleIndex()

function searchPeople(q, limit = 12) {
  return PEOPLE.map((person) => ({ person, score: scoreName(person.name, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.person.movies.length - a.person.movies.length)
    .slice(0, limit)
    .map((entry) => ({ ...entry.person, score: entry.score }))
}

/* --------------------------------------------------------------------------
   Suggestions ("did you mean")
   -------------------------------------------------------------------------- */

function buildSuggestions(q, excludeIds, limit = 3) {
  const queryTokens = q.split(' ').filter(Boolean)

  return movies
    .filter((movie) => !excludeIds.has(movie.id))
    .map((movie) => {
      const title = normalize(movie.title)
      const tokens = title.split(' ').filter(Boolean)
      const whole = similarity(title, q)

      let score = whole
      if (queryTokens.length === 1) {
        // A one-word query only needs to resemble the title as a whole or one
        // of its words ("inceptoin" -> "Inception").
        score = Math.max(whole, bestTokenMatch(queryTokens[0], tokens))
      } else {
        // For phrases, require the meaningful words to line up so a name like
        // "leo dicaprio" never "suggests" an unrelated title such as "Sicario".
        const meaningful = queryTokens.filter((token) => token.length >= 3)
        if (meaningful.length) {
          const perToken = meaningful.map((token) => bestTokenMatch(token, tokens))
          const average = perToken.reduce((sum, value) => sum + value, 0) / perToken.length
          const hasStrongToken = perToken.some((value) => value >= 0.9)
          if (hasStrongToken && average >= 0.72) score = Math.max(score, average)
        }
      }
      return { movie, score }
    })
    .filter((entry) => entry.score >= 0.62)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.movie)
}

/* --------------------------------------------------------------------------
   Public API
   -------------------------------------------------------------------------- */

/**
 * Search the local catalogue.
 *
 * Returns `{ query, movies, people, suggestions, hasTitleMatch }` where
 * `movies` is `[{ movie, score, titleMatched }]` ranked by relevance. A person
 * result carries the `movies` they appear in, so the UI can show the actor and
 * their filmography together.
 */
export function searchCatalog(rawQuery, { limit = 24 } = {}) {
  const q = normalize(rawQuery)

  if (q.length < MIN_QUERY) {
    return { query: String(rawQuery ?? '').trim(), movies: [], people: [], suggestions: [], hasTitleMatch: false }
  }

  const scored = movies
    .map((movie) => scoreMovie(movie, q))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (b.movie.rating ?? 0) - (a.movie.rating ?? 0))

  const results = scored.slice(0, limit)
  const people = searchPeople(q)
  const hasTitleMatch = scored.some((entry) => entry.titleMatched)

  const usedIds = new Set(results.map((entry) => entry.movie.id))
  // Only offer "did you mean" when the query matched nothing at all - if we
  // already have results (even genre/cast hits) a fuzzy guess would be noise.
  const suggestions =
    scored.length === 0 && people.length === 0 ? buildSuggestions(q, usedIds) : []

  return {
    query: String(rawQuery ?? '').trim(),
    movies: results,
    people,
    suggestions,
    hasTitleMatch,
  }
}
