import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MovieCard from '../components/MovieCard'
import ExplorerMovieCard from '../components/ExplorerMovieCard'
import PersonCard from '../components/PersonCard'
import CataloguePersonCard from '../components/CataloguePersonCard'
import LoadMore from '../components/LoadMore'
import { genres } from '../data/movies'
import { useLoadMore } from '../hooks/useLoadMore'
import { normalize, searchCatalog, titleRelevance } from '../lib/search'
import { isTmdbConfigured, searchMulti } from '../lib/tmdb'

const MIN_QUERY = 2
const TMDB_DEBOUNCE_MS = 350
const RESULT_LIMIT = 24
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1970 + 1 }, (_, index) => CURRENT_YEAR - index)

/**
 * Search page.
 *
 * Runs the local relevance engine (`searchCatalog`) on every keystroke so
 * results - and "did you mean" suggestions for misspelled or unknown titles -
 * appear instantly with no API key. When a TMDB key is configured it also
 * supplements the local hits with a *debounced* `/search/multi` request, which
 * can surface movies the demo catalogue does not contain *and* the actors or
 * directors who match the query (with their known-for titles).
 *
 * Local and TMDB results are merged, de-duplicated by title (movies) and name
 * (people), and ranked by `titleRelevance` so an exact title always comes
 * first, followed by "starts with", "contains" and finally fuzzy matches -
 * popularity breaks ties. An optional release-year filter narrows the list.
 */
export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const urlYear = searchParams.get('year') ?? ''
  const [draft, setDraft] = useState(urlQuery)
  const [year, setYear] = useState(urlYear)
  const inputRef = useRef(null)
  const requestSeq = useRef(0)
  const configured = isTmdbConfigured()

  const query = draft.trim()
  const active = query.length >= MIN_QUERY
  const yearFilter = /^\d{4}$/.test(year) ? Number(year) : null

  const local = useMemo(() => searchCatalog(query), [query])
  const [tmdb, setTmdb] = useState({
    status: 'idle',
    movies: [],
    people: [],
    totalPages: 1,
    error: '',
  })
  const [retryNonce, setRetryNonce] = useState(0)

  // Keep the input in sync when the query arrives from the navbar or a link.
  useEffect(() => {
    setDraft(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    setYear(urlYear)
  }, [urlYear])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Debounced TMDB supplement (movies + people) when a key is configured.
  // A request sequence number guards against out-of-order responses: a slower,
  // older request can never overwrite the results of a newer query.
  useEffect(() => {
    if (!configured || !active) {
      setTmdb({ status: 'idle', movies: [], people: [], totalPages: 1, error: '' })
      return undefined
    }

    const requestId = requestSeq.current + 1
    requestSeq.current = requestId
    let cancelled = false
    setTmdb((current) => ({ ...current, status: 'loading', error: '' }))

    const timer = window.setTimeout(() => {
      searchMulti(query)
        .then((data) => {
          if (cancelled || requestId !== requestSeq.current) return
          setTmdb({
            status: 'ready',
            movies: data.movies,
            people: data.people,
            totalPages: data.totalPages ?? 1,
            error: '',
          })
        })
        .catch((error) => {
          if (cancelled || requestId !== requestSeq.current) return
          setTmdb({
            status: 'error',
            movies: [],
            people: [],
            totalPages: 1,
            error: error?.message || 'Could not reach TMDB right now.',
          })
        })
    }, TMDB_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [configured, active, query, retryNonce])

  const { movies, people, movieCount, peopleCount } = useMemo(() => {
    const seenTitles = new Set(local.movies.map(({ movie }) => normalize(movie.title)))
    const extraMovies = tmdb.movies.filter((movie) => !seenTitles.has(normalize(movie.title)))

    const seenPeople = new Set(local.people.map((person) => normalize(person.name)))
    const extraPeople = tmdb.people.filter((person) => !seenPeople.has(normalize(person.name)))

    // Merge local and TMDB movies, then rank so the exact title is always
    // first: exact > starts-with > whole-word > contains > fuzzy. Popularity
    // (TMDB) or the local relevance score breaks ties.
    const rankedMovies = [
      ...local.movies.map(({ movie, score }) => ({ source: 'local', movie, weight: score })),
      ...extraMovies.map((movie) => ({
        source: 'tmdb',
        movie,
        weight: movie.popularity || movie.voteCount || movie.rating || 0,
      })),
    ]
      .filter((entry) => !yearFilter || entry.movie.year === yearFilter)
      .map((entry) => ({ ...entry, relevance: titleRelevance(entry.movie.title, query) }))
      .sort((a, b) => b.relevance - a.relevance || b.weight - a.weight)
      .slice(0, RESULT_LIMIT)

    return {
      movies: rankedMovies,
      people: [
        ...local.people.map((person) => ({ source: 'local', person })),
        ...extraPeople.slice(0, 12).map((person) => ({ source: 'tmdb', person })),
      ],
      movieCount: rankedMovies.length,
      peopleCount: local.people.length + extraPeople.length,
    }
  }, [local, tmdb, query, yearFilter])

  // "Load More" for the TMDB supplement: fetches the next `/search/multi` page
  // and appends its movies and people below the existing results - never
  // replacing page 1 - de-duplicated by id and against what is already shown.
  // A new search text resets it back to page 2 (via `resetKey`).
  const searchMore = useLoadMore(
    (page) =>
      searchMulti(query, page).then((data) => ({
        totalPages: data.totalPages,
        results: [
          ...data.movies.map((movie) => ({
            key: `movie:${movie.tmdbId}`,
            kind: 'movie',
            value: movie,
          })),
          ...data.people.map((person) => ({
            key: `person:${person.tmdbId}`,
            kind: 'person',
            value: person,
          })),
        ],
      })),
    { resetKey: query },
  )

  // Drop any extra page item that page 1 (or the local catalogue) already shows.
  const { extraMovies, extraPeople } = useMemo(() => {
    const shownMovieKeys = new Set(
      movies
        .filter((entry) => entry.source === 'tmdb')
        .map((entry) => `movie:${entry.movie.tmdbId}`),
    )
    const seenTitles = new Set(movies.map((entry) => normalize(entry.movie.title)))
    const shownPeopleKeys = new Set(
      people
        .filter((entry) => entry.source === 'tmdb')
        .map((entry) => `person:${entry.person.tmdbId}`),
    )
    const seenNames = new Set(people.map((entry) => normalize(entry.person.name)))

    const nextMovies = []
    const nextPeople = []
    for (const entry of searchMore.items) {
      if (entry.kind === 'movie') {
        if (yearFilter && entry.value.year !== yearFilter) continue
        const title = normalize(entry.value.title)
        if (shownMovieKeys.has(entry.key) || seenTitles.has(title)) continue
        shownMovieKeys.add(entry.key)
        seenTitles.add(title)
        nextMovies.push(entry.value)
      } else {
        const name = normalize(entry.value.name)
        if (shownPeopleKeys.has(entry.key) || seenNames.has(name)) continue
        shownPeopleKeys.add(entry.key)
        seenNames.add(name)
        nextPeople.push(entry.value)
      }
    }
    return { extraMovies: nextMovies, extraPeople: nextPeople }
  }, [searchMore.items, movies, people, yearFilter])

  const movieTotal = movieCount + extraMovies.length
  const peopleTotal = peopleCount + extraPeople.length
  const total = movieTotal + peopleTotal

  function submit(event) {
    event.preventDefault()
    if (query.length < MIN_QUERY) return
    const next = { q: query }
    if (yearFilter) next.year = String(yearFilter)
    setSearchParams(next)
  }

  return (
    <div className="page">
      <header className="page__head">
        <h1>Search</h1>
        <p className="page__lead">
          Find films by title, genre, director or cast. Typos are fine - the closest match comes
          first - and searching an actor shows the films they worked on.
        </p>
      </header>

      <form className="searchForm" onSubmit={submit} role="search">
        <input
          ref={inputRef}
          type="search"
          value={draft}
          placeholder="e.g. Inception, Nolan, Leonardo DiCaprio"
          aria-label="Search the catalogue"
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
        />
        <label className="searchForm__year">
          <span className="sr-only">Release year</span>
          <select
            value={year}
            aria-label="Filter by release year"
            onChange={(event) => setYear(event.target.value)}
          >
            <option value="">Any year</option>
            {YEARS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn--primary">
          Search
        </button>
      </form>

      {!active && (
        <div className="empty">
          <h2>What do you feel like watching?</h2>
          <p>Start typing a title, genre, actor or director. You can also pick a release year.</p>
          <Link to="/movies" className="btn btn--primary">
            Browse all movies
          </Link>
        </div>
      )}

      {active && (
        <>
          <p className="searchForm__summary" aria-live="polite">
            {total > 0 ? (
              <>
                Found {total} match{total === 1 ? '' : 'es'} for <strong>{query}</strong>
                {yearFilter ? <> in {yearFilter}</> : null}
              </>
            ) : (
              <>
                No matches for <strong>{query}</strong>
                {yearFilter ? <> in {yearFilter}</> : null}
              </>
            )}
          </p>

          {total === 0 && local.suggestions.length > 0 && (
            <div className="didYouMean">
              <p>We couldn&rsquo;t find that exact title. Did you mean:</p>
              <div className="chips__list">
                {local.suggestions.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    className="chip"
                    onClick={() => setDraft(movie.title)}
                  >
                    {movie.title}
                    {movie.year ? <span className="chip__meta">{movie.year}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          {movieTotal > 0 && (
            <section className="searchSection">
              <h2 className="searchSection__title">Movies</h2>
              <div className="grid">
                {movies.map((entry) =>
                  entry.source === 'local' ? (
                    <MovieCard key={`local-${entry.movie.id}`} movie={entry.movie} />
                  ) : (
                    <ExplorerMovieCard key={`tmdb-${entry.movie.tmdbId}`} movie={entry.movie} />
                  ),
                )}
                {extraMovies.map((movie) => (
                  <ExplorerMovieCard key={`tmdb-more-${movie.tmdbId}`} movie={movie} />
                ))}
              </div>
            </section>
          )}

          {peopleTotal > 0 && (
            <section className="searchSection">
              <h2 className="searchSection__title">Cast &amp; crew</h2>
              <p className="searchSection__hint">
                People matching your search, with the titles they worked on.
              </p>
              <div className="grid grid--people">
                {people.map((entry) =>
                  entry.source === 'local' ? (
                    <CataloguePersonCard key={`local-${entry.person.id}`} person={entry.person} />
                  ) : (
                    <PersonCard key={`tmdb-${entry.person.tmdbId}`} person={entry.person} />
                  ),
                )}
                {extraPeople.map((person) => (
                  <PersonCard key={`tmdb-more-${person.tmdbId}`} person={person} />
                ))}
              </div>
            </section>
          )}

          {configured && active && tmdb.status === 'ready' && (tmdb.totalPages ?? 1) > 1 && (
            <LoadMore
              status={searchMore.status}
              onLoad={searchMore.loadMore}
              onRetry={searchMore.retry}
            />
          )}

          {configured && tmdb.status === 'loading' && (
            <p className="picker__status searchSection__status" role="status">
              <span className="spinner" aria-hidden="true" />
              Searching TMDB for more matches&hellip;
            </p>
          )}

          {configured && tmdb.status === 'error' && (
            <div className="searchSection__note" role="alert">
              <p>{tmdb.error}</p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setRetryNonce((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {total === 0 && tmdb.status !== 'loading' && (
            <div className="empty">
              <h2>
                No matches for &ldquo;{query}&rdquo;{yearFilter ? ` in ${yearFilter}` : ''}
              </h2>
              <p>
                Try a different spelling{yearFilter ? ', a different year' : ''}, or start from one
                of these genres.
              </p>
              <div className="chips__list">
                {genres.slice(0, 8).map((genre) => (
                  <Link
                    key={genre}
                    to={`/movies?genre=${encodeURIComponent(genre)}`}
                    className="chip"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
