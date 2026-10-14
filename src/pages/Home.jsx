import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import HomeHero from '../components/HomeHero'
import HomeRow from '../components/HomeRow'
import HomeChips from '../components/HomeChips'
import HomeCard from '../components/HomeCard'
import MovieRow from '../components/MovieRow'
import PaginatedGrid from '../components/PaginatedGrid'
import TitleModal from '../components/TitleModal'
import VideoPlayerModal from '../components/VideoPlayerModal'
import { getPopularMovies, isTmdbConfigured } from '../lib/tmdb'
import { homeRows } from '../data/homeRows'
import { genres, movies, newestMovies, topRatedMovies, trendingMovies } from '../data/movies'

const genreRows = ['Sci-Fi', 'Action', 'Animation', 'Drama', 'Comedy', 'Horror']

/**
 * The TMDB-paginated "More movies" grid that sits at the bottom of the home
 * page. Page 1 loads on its own and the shared "Load More" button appends the
 * next `/movie/popular` page below the existing posters (never replacing them),
 * hiding itself once the last page is reached. Pagination, de-duplication,
 * loading and error states all live in `PaginatedGrid` / `useLoadMore`.
 */
function MoreMovies() {
  return (
    <section className="home-more">
      <h2 className="home-more__title">More movies</h2>
      <PaginatedGrid
        loadPage={(page) => getPopularMovies(page)}
        renderItem={(movie) => <HomeCard movie={movie} />}
        resetKey="home-more"
        buttonLabel="Load More"
        doneLabel="No more movies to load"
      />
    </section>
  )
}

/** Pick one featured movie - a random title that has a real backdrop. */
function pickHero(list) {
  const withBackdrop = list.filter((movie) => movie.backdrop)
  const pool = withBackdrop.length ? withBackdrop : list
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

/** The skeleton shown for the hero while the first rows are still loading. */
function HeroSkeleton() {
  return (
    <div className="home-hero home-hero--skeleton" aria-hidden="true">
      <div className="home-hero__scrim" />
      <div className="home-hero__content">
        <span className="skeleton" style={{ width: 190, height: 22, borderRadius: 999 }} />
        <div className="skeleton" style={{ width: '55%', height: 58, marginTop: 16 }} />
        <div className="skeleton" style={{ width: '38%', height: 16, marginTop: 16 }} />
        <div className="skeleton" style={{ width: '88%', height: 16, marginTop: 26 }} />
        <div className="skeleton" style={{ width: '64%', height: 16, marginTop: 10 }} />
      </div>
    </div>
  )
}

/**
 * The offline catalogue homepage. Used when no TMDB key is configured, and as a
 * graceful fallback when a live request fails, so the site is never empty.
 */
function LocalHome() {
  return (
    <>
      <Hero />
      <div className="page page--home">
        <MovieRow
          title="Trending now"
          subtitle="What everyone is watching this week"
          movies={trendingMovies}
          ranked
          moreLink="/movies"
        />
        <MovieRow
          title="Top rated"
          subtitle="The highest scoring films on netwebfilx"
          movies={topRatedMovies.slice(0, 14)}
        />
        <MovieRow
          title="New releases"
          subtitle="Fresh additions to the catalogue"
          movies={newestMovies.slice(0, 14)}
        />

        <section className="chips">
          <h2>Browse by genre</h2>
          <div className="chips__list">
            {genres.map((genre) => (
              <Link key={genre} to={`/movies?genre=${encodeURIComponent(genre)}`} className="chip">
                {genre}
              </Link>
            ))}
          </div>
        </section>

        {genreRows.map((genre) => {
          const list = movies.filter((movie) => movie.genres.includes(genre))
          return (
            <MovieRow
              key={genre}
              title={`${genre} picks`}
              movies={list}
              moreLink={`/movies?genre=${encodeURIComponent(genre)}`}
            />
          )
        })}
      </div>
    </>
  )
}

/**
 * Netflix-style homepage.
 *
 * With a TMDB API key configured it renders a big backdrop hero for a random
 * trending title, then a stack of scrollable poster rows. The rows come from the
 * `homeRows` config (see `src/data/homeRows.js`), so adding a row is one line.
 *
 * Every row loads independently: it shows poster skeletons while it fetches and,
 * if only that one request fails, a small inline message with its own Retry -
 * the rest of the page keeps going. If *everything* fails a friendly error with
 * a Retry button is shown above the local catalogue so the page still works.
 *
 * Clicking Play opens the full-movie player. Clicking More Info or any poster
 * opens a details modal with the trailer (and its own Play button) - the trailer
 * never auto-plays behind the visitor's back.
 */
export default function Home() {
  const configured = isTmdbConfigured()
  const [status, setStatus] = useState(configured ? 'loading' : 'unconfigured')
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)
  const [featured, setFeatured] = useState(null)
  const [rows, setRows] = useState(() =>
    homeRows.map((row) => ({ ...row, status: 'loading', movies: [] })),
  )
  const [selected, setSelected] = useState(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const [playing, setPlaying] = useState(null)

  useEffect(() => {
    if (!configured) return undefined
    let cancelled = false
    setError('')
    setFeatured(null)
    setStatus('loading')
    setRows(homeRows.map((row) => ({ ...row, status: 'loading', movies: [] })))

    let loadedCount = 0
    let trendingList = null
    let heroCandidate = null

    const settle = (key, patch) => {
      setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
    }

    const tasks = homeRows.map((row) =>
      row
        .load()
        .then((data) => {
          if (cancelled) return
          const list = (data && data.results) || []
          if (list.length) loadedCount += 1
          if (row.key === 'trending') trendingList = list
          if (!heroCandidate && list.some((movie) => movie.backdrop)) heroCandidate = list
          settle(row.key, { status: 'ready', movies: list })
        })
        .catch(() => {
          if (cancelled) return
          settle(row.key, { status: 'error', movies: [] })
        }),
    )

    Promise.allSettled(tasks).then(() => {
      if (cancelled) return
      if (loadedCount > 0) {
        const heroSource =
          trendingList && trendingList.some((movie) => movie.backdrop) ? trendingList : heroCandidate
        if (heroSource) setFeatured(pickHero(heroSource))
        setStatus('ready')
      } else {
        setError('Could not reach TMDB right now.')
        setStatus('error')
      }
    })

    return () => {
      cancelled = true
    }
  }, [configured, nonce])

  function openModal(movie, autoplay) {
    setSelected(movie)
    setAutoPlay(Boolean(autoplay))
  }

  /** Open the full-movie player (never the trailer). */
  function openPlayer(movie) {
    setSelected(null)
    setPlaying(movie)
  }

  function retry() {
    setNonce((value) => value + 1)
  }

  /** Re-fetch a single row after its inline error, without touching the others. */
  function retryRow(key) {
    const row = homeRows.find((entry) => entry.key === key)
    if (!row) return
    setRows((prev) => prev.map((entry) => (entry.key === key ? { ...entry, status: 'loading' } : entry)))
    row
      .load()
      .then((data) => {
        const list = (data && data.results) || []
        setRows((prev) =>
          prev.map((entry) => (entry.key === key ? { ...entry, status: 'ready', movies: list } : entry)),
        )
      })
      .catch(() => {
        setRows((prev) =>
          prev.map((entry) => (entry.key === key ? { ...entry, status: 'error' } : entry)),
        )
      })
  }

  // No key, or every live request failed: show the local catalogue (with an
  // error + Retry banner on top when a request actually failed).
  if (status === 'unconfigured' || status === 'error') {
    return (
      <>
        {status === 'error' && (
          <div className="page page--home">
            <div className="empty picker__error home-error" role="alert">
              <h2>Could not load movies from TMDB</h2>
              <p>{error}</p>
              <div className="empty__actions">
                <button type="button" className="btn btn--primary" onClick={retry}>
                  Try again
                </button>
              </div>
              <p className="home-error__note">Showing the local catalogue while we reconnect.</p>
            </div>
          </div>
        )}
        <LocalHome />
      </>
    )
  }

  return (
    <>
      {featured ? (
        <HomeHero
          movie={featured}
          onPlay={(movie) => openPlayer(movie)}
          onInfo={(movie) => openModal(movie, false)}
        />
      ) : (
        status === 'loading' && <HeroSkeleton />
      )}

      <div className="page page--home">
        <HomeChips rows={rows} />

        {rows.map((row) => (
          <HomeRow
            key={row.key}
            id={row.key}
            title={row.title}
            movies={row.movies}
            status={row.status}
            moreLink={row.moreLink}
            onRetry={() => retryRow(row.key)}
          />
        ))}

        <MoreMovies />
      </div>

      {selected && (
        <TitleModal
          movie={selected}
          autoPlay={autoPlay}
          onPlay={openPlayer}
          onClose={() => setSelected(null)}
        />
      )}

      {playing && (
        <VideoPlayerModal movie={playing} onClose={() => setPlaying(null)} />
      )}
    </>
  )
}
