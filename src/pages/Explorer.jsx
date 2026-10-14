import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieRow from '../components/MovieRow'
import MovieCardSkeleton from '../components/MovieCardSkeleton'
import ExplorerMovieCard from '../components/ExplorerMovieCard'
import PersonCard from '../components/PersonCard'
import { SearchIcon } from '../components/icons'
import {
  discoverMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  isTmdbConfigured,
  searchMoviesByTitle,
  searchPeopleByName,
} from '../lib/tmdb'

/* --------------------------------------------------------------------------
   Catalogue data (stable, so row fetchers keep a constant identity)
   -------------------------------------------------------------------------- */

const TYPE_OPTIONS = [
  { id: 'movie', label: 'Movies' },
  { id: 'person', label: 'Actors & directors' },
]

/** TMDB genre ids for the "Browse by genre" chips. */
const GENRES = [
  { id: 28, label: 'Action' },
  { id: 35, label: 'Comedy' },
  { id: 27, label: 'Horror' },
  { id: 10749, label: 'Romance' },
  { id: 18, label: 'Drama' },
  { id: 53, label: 'Thriller' },
  { id: 878, label: 'Sci-Fi' },
  { id: 16, label: 'Animation' },
  { id: 12, label: 'Adventure' },
]

/** "Discover by mood" options. Each mood maps to a real TMDB genre. */
const MOODS = [
  { id: 'happy', label: 'Happy', genreId: 35, emoji: '😄' },
  { id: 'sad', label: 'Sad', genreId: 18, emoji: '😢' },
  { id: 'relaxed', label: 'Relaxed', genreId: 10751, emoji: '😌' },
  { id: 'excited', label: 'Excited', genreId: 28, emoji: '🤩' },
  { id: 'romantic', label: 'Romantic', genreId: 10749, emoji: '💕' },
  { id: 'scared', label: 'Scared', genreId: 27, emoji: '😱' },
  { id: 'adventurous', label: 'Adventurous', genreId: 12, emoji: '🧭' },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'tr', label: 'Turkish' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, index) => CURRENT_YEAR - index)
const RATINGS = [5, 6, 7, 8]

const LOADING_CARDS = 8

const fetchTrending = () => getTrendingMovies()
const fetchPopular = () => getPopularMovies()
const fetchTopRated = () => getTopRatedMovies()

/* --------------------------------------------------------------------------
   Row section: fetch once, render a scrollable MovieRow of TMDB cards
   -------------------------------------------------------------------------- */

function TmdbRowSection({ title, subtitle, fetcher, ranked = false }) {
  const [state, setState] = useState({ status: 'loading', movies: [], error: '' })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', movies: [], error: '' })
    fetcher()
      .then((data) => {
        if (cancelled) return
        setState({ status: 'ready', movies: data.results, error: '' })
      })
      .catch((err) => {
        if (cancelled) return
        setState({
          status: 'error',
          movies: [],
          error: err?.message || 'Could not reach TMDB right now.',
        })
      })
    return () => {
      cancelled = true
    }
  }, [fetcher, nonce])

  if (state.status === 'loading') {
    return (
      <section className="row" aria-busy="true" aria-label={title}>
        <div className="row__head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="row__subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="row__scroller" aria-hidden="true">
          {Array.from({ length: LOADING_CARDS }).map((_, index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </div>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="row" aria-label={title}>
        <div className="row__head">
          <h2>{title}</h2>
        </div>
        <div className="empty picker__error" role="alert">
          <p>{state.error}</p>
          <button type="button" className="btn btn--primary" onClick={() => setNonce((n) => n + 1)}>
            Try again
          </button>
        </div>
      </section>
    )
  }

  if (!state.movies.length) return null

  return (
    <MovieRow
      title={title}
      subtitle={subtitle}
      movies={state.movies}
      cardComponent={ExplorerMovieCard}
      ranked={ranked}
    />
  )
}

/* --------------------------------------------------------------------------
   Explore page
   -------------------------------------------------------------------------- */

export default function Explorer() {
  const configured = isTmdbConfigured()

  // --- search -------------------------------------------------------------
  const [query, setQuery] = useState('')
  const [type, setType] = useState('movie')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [results, setResults] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const requestRef = useRef(0)

  // --- discover (genre / mood / filters) ----------------------------------
  const [discover, setDiscover] = useState({
    genreId: null,
    moodId: null,
    year: '',
    language: '',
    minRating: '',
  })
  const [discoverState, setDiscoverState] = useState({ status: 'idle', movies: [], error: '' })
  const [discoverNonce, setDiscoverNonce] = useState(0)

  const activeMood = MOODS.find((mood) => mood.id === discover.moodId) || null
  const activeGenre = GENRES.find((genre) => genre.id === discover.genreId) || null

  useEffect(() => {
    if (!configured) return undefined
    const genreId = activeMood ? activeMood.genreId : discover.genreId
    const hasCriteria = Boolean(genreId || discover.year || discover.language || discover.minRating)
    if (!hasCriteria) {
      setDiscoverState({ status: 'idle', movies: [], error: '' })
      return undefined
    }

    let cancelled = false
    setDiscoverState({ status: 'loading', movies: [], error: '' })
    discoverMovies({
      genreId: genreId || undefined,
      year: discover.year || undefined,
      language: discover.language || undefined,
      minRating: discover.minRating || undefined,
    })
      .then((data) => {
        if (cancelled) return
        setDiscoverState({ status: 'ready', movies: data.results, error: '' })
      })
      .catch((err) => {
        if (cancelled) return
        setDiscoverState({
          status: 'error',
          movies: [],
          error: err?.message || 'Could not reach TMDB right now.',
        })
      })
    return () => {
      cancelled = true
    }
    // `discover` covers every filter value; `discoverNonce` powers Retry.
  }, [configured, discover, discoverNonce]) // eslint-disable-line react-hooks/exhaustive-deps

  async function runSearch(nextType, nextQuery) {
    const trimmed = nextQuery.trim()
    if (!trimmed) return
    const requestId = requestRef.current + 1
    requestRef.current = requestId

    setStatus('loading')
    setError('')

    try {
      const data =
        nextType === 'person'
          ? await searchPeopleByName(trimmed)
          : await searchMoviesByTitle(trimmed)
      if (requestId !== requestRef.current) return
      setResults(data.results)
      setSummary({ type: nextType, query: trimmed, total: data.totalResults })
      setStatus('success')
    } catch (err) {
      if (requestId !== requestRef.current) return
      setError(err?.message || 'Could not reach TMDB right now.')
      setStatus('error')
    }
  }

  function submit(event) {
    event.preventDefault()
    runSearch(type, query)
  }

  function chooseType(nextType) {
    setType(nextType)
    if (query.trim()) runSearch(nextType, query)
  }

  function resetDiscover() {
    setDiscover({ genreId: null, moodId: null, year: '', language: '', minRating: '' })
  }

  const isPerson = type === 'person'
  const discoverLabel = activeMood
    ? `${activeMood.label} mood`
    : activeGenre
      ? activeGenre.label
      : 'these filters'

  if (!configured) {
    return (
      <div className="page">
        <header className="page__head">
          <span className="picker__eyebrow">Explorer</span>
          <h1>Discover movies, actors and directors.</h1>
          <p className="page__lead">
            Search the real TMDB catalogue, browse trending, popular and top rated films, or filter
            by genre, mood, year, language and rating.
          </p>
        </header>
        <div className="empty">
          <h2>The Explore page needs a TMDB API key</h2>
          <p>
            Search and discovery are powered by TMDB. Add <code>VITE_TMDB_API_KEY</code> to your{' '}
            <code>.env</code> file and restart the dev server to unlock it.
          </p>
          <div className="empty__actions">
            <Link to="/" className="btn btn--primary">
              Back to Home
            </Link>
            <Link to="/movies" className="btn btn--ghost">
              Browse movies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page__head">
        <span className="picker__eyebrow">Explorer</span>
        <h1>Discover movies, actors and directors.</h1>
        <p className="page__lead">
          Search the real TMDB catalogue by name or keyword, browse trending, popular and top rated
          films, or dial in the perfect movie by genre, mood, year, language and rating.
        </p>
      </header>

      {/* Search */}
      <form className="explorer__search" onSubmit={submit} role="search">
        <div className="segmented" role="group" aria-label="Search for">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`segmented__option${type === option.id ? ' segmented__option--active' : ''}`}
              aria-pressed={type === option.id}
              onClick={() => chooseType(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="explorer__searchRow">
          <label className="sr-only" htmlFor="explorer-query">
            {isPerson ? 'Search for an actor or director by name' : 'Search for a movie by name or keyword'}
          </label>
          <input
            id="explorer-query"
            type="search"
            value={query}
            placeholder={isPerson ? 'e.g. Denis Villeneuve, Viola Davis' : 'e.g. Dune, time travel, heist'}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn--primary">
            <SearchIcon size={17} />
            Search
          </button>
        </div>
      </form>

      <section className="explorer__results" aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'loading' && (
          <>
            <div className="picker__status" role="status">
              <span className="spinner" aria-hidden="true" />
              <p>Searching TMDB…</p>
            </div>
            <div className="grid" aria-hidden="true">
              {Array.from({ length: LOADING_CARDS }).map((_, index) => (
                <MovieCardSkeleton key={index} />
              ))}
            </div>
          </>
        )}

        {status === 'error' && (
          <div className="empty picker__error" role="alert">
            <h2>Search failed</h2>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => runSearch(type, query)}
            >
              Retry
            </button>
          </div>
        )}

        {status === 'success' && (
          <>
            <p className="searchForm__summary">
              {results.length} result{results.length === 1 ? '' : 's'} for{' '}
              <strong>{summary?.query}</strong>
              {summary?.total > results.length ? ' · showing the most relevant first' : ''}
            </p>

            {results.length > 0 ? (
              <div className={`grid${isPerson ? ' grid--people' : ''}`}>
                {results.map((item) =>
                  isPerson ? (
                    <PersonCard key={`p-${item.tmdbId}`} person={item} />
                  ) : (
                    <ExplorerMovieCard key={`m-${item.tmdbId}`} movie={item} />
                  ),
                )}
              </div>
            ) : (
              <div className="empty">
                <h2>No {isPerson ? 'people' : 'movies'} match “{summary?.query}”</h2>
                <p>Try another name or keyword, or broaden the search.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Curated TMDB rows */}
      <div className="explorer__rows">
        <TmdbRowSection
          title="Trending this week"
          subtitle="What people are watching on TMDB right now"
          fetcher={fetchTrending}
          ranked
        />
        <TmdbRowSection
          title="Popular movies"
          subtitle="The most popular films on TMDB"
          fetcher={fetchPopular}
        />
        <TmdbRowSection
          title="Top rated"
          subtitle="The highest rated films on TMDB"
          fetcher={fetchTopRated}
        />
      </div>

      {/* Discover: genre + mood + filters */}
      <section className="explorer__discover" id="explore-discover" aria-label="Discover movies">
        <div className="chips chips--explorer">
          <h2>Browse by genre</h2>
          <div className="chips__list">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={`chip${discover.genreId === genre.id && !discover.moodId ? ' chip--active' : ''}`}
                aria-pressed={discover.genreId === genre.id && !discover.moodId}
                onClick={() =>
                  setDiscover((current) => ({ ...current, genreId: genre.id, moodId: null }))
                }
              >
                {genre.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chips chips--explorer">
          <h2>Discover by mood</h2>
          <div className="chips__list">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                type="button"
                className={`chip${discover.moodId === mood.id ? ' chip--active' : ''}`}
                aria-pressed={discover.moodId === mood.id}
                onClick={() =>
                  setDiscover((current) => ({ ...current, moodId: mood.id, genreId: null }))
                }
              >
                <span aria-hidden="true">{mood.emoji}</span>
                {mood.label}
              </button>
            ))}
          </div>
        </div>

        <div className="explorer__filters">
          <label>
            <span>Year</span>
            <select
              value={discover.year}
              onChange={(event) => setDiscover((c) => ({ ...c, year: event.target.value }))}
            >
              <option value="">Any year</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Language</span>
            <select
              value={discover.language}
              onChange={(event) => setDiscover((c) => ({ ...c, language: event.target.value }))}
            >
              <option value="">Any language</option>
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Rating</span>
            <select
              value={discover.minRating}
              onChange={(event) => setDiscover((c) => ({ ...c, minRating: event.target.value }))}
            >
              <option value="">Any rating</option>
              {RATINGS.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}.0 and up
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="btn btn--ghost" onClick={resetDiscover}>
            Reset
          </button>
        </div>

        <div className="explorer__discoverResults" aria-live="polite" aria-busy={discoverState.status === 'loading'}>
          {discoverState.status === 'idle' && (
            <p className="explorer__discoverHint" role="status">
              Pick a genre or mood, or set a filter above to start discovering.
            </p>
          )}

          {discoverState.status === 'loading' && (
            <div className="grid" aria-hidden="true">
              {Array.from({ length: LOADING_CARDS }).map((_, index) => (
                <MovieCardSkeleton key={index} />
              ))}
            </div>
          )}

          {discoverState.status === 'error' && (
            <div className="empty picker__error" role="alert">
              <h2>Discover failed</h2>
              <p>{discoverState.error}</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setDiscoverNonce((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {discoverState.status === 'ready' && (
            <>
              <p className="searchForm__summary">
                {discoverState.movies.length} result
                {discoverState.movies.length === 1 ? '' : 's'} for{' '}
                <strong>{discoverLabel}</strong>
              </p>

              {discoverState.movies.length > 0 ? (
                <div className="grid">
                  {discoverState.movies.map((movie) => (
                    <ExplorerMovieCard key={`d-${movie.tmdbId}`} movie={movie} />
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <h2>No movies match “{discoverLabel}”</h2>
                  <p>Try clearing a filter or picking a different genre or mood.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}