import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MovieCard from '../components/MovieCard'
import ExplorerMovieCard from '../components/ExplorerMovieCard'
import PaginatedGrid from '../components/PaginatedGrid'
import { genres, movies } from '../data/movies'
import { tmdbGenreId } from '../data/tmdbGenres'
import { discoverMovies, isTmdbConfigured } from '../lib/tmdb'

const sorts = {
  trending: {
    label: 'Trending',
    compare: (a, b) =>
      Number(b.trending ?? false) - Number(a.trending ?? false) ||
      (b.rating ?? 0) - (a.rating ?? 0),
  },
  rating: { label: 'Top rated', compare: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) },
  newest: { label: 'Newest', compare: (a, b) => b.year - a.year },
  oldest: { label: 'Oldest', compare: (a, b) => a.year - b.year },
  title: { label: 'A - Z', compare: (a, b) => a.title.localeCompare(b.title) },
}

// Local sort keys -> TMDB `/discover/movie` sort values, so the Load More grid
// honours whatever the visitor picked in the "Sort by" select.
const TMDB_SORTS = {
  trending: 'popularity.desc',
  rating: 'vote_average.desc',
  newest: 'primary_release_date.desc',
  oldest: 'primary_release_date.asc',
  title: 'original_title.asc',
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeGenre = searchParams.get('genre') ?? 'All'
  const sortKey = searchParams.get('sort') ?? 'trending'
  const sort = sorts[sortKey] ?? sorts.trending

  const results = useMemo(() => {
    const filtered =
      activeGenre === 'All' ? movies : movies.filter((movie) => movie.genres.includes(activeGenre))
    return [...filtered].sort(sort.compare)
  }, [activeGenre, sort])

  function setParam(key, value, fallback) {
    const next = new URLSearchParams(searchParams)
    if (value === fallback) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const configured = isTmdbConfigured()
  const tmdbSort = TMDB_SORTS[sortKey] ?? TMDB_SORTS.trending

  return (
    <div className="page">
      <header className="page__head">
        <h1>All movies</h1>
        <p className="page__lead">
          {results.length} title{results.length === 1 ? '' : 's'}
          {activeGenre !== 'All' ? ` in ${activeGenre}` : ''} in the netwebfilx catalogue.
        </p>
      </header>

      <div className="filters">
        <div className="filters__genres">
          <button
            type="button"
            className={`chip${activeGenre === 'All' ? ' chip--active' : ''}`}
            onClick={() => setParam('genre', 'All', 'All')}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              className={`chip${activeGenre === genre ? ' chip--active' : ''}`}
              onClick={() => setParam('genre', genre, 'All')}
            >
              {genre}
            </button>
          ))}
        </div>

        <label className="filters__sort">
          <span>Sort by</span>
          <select
            value={sortKey}
            onChange={(event) => setParam('sort', event.target.value, 'trending')}
          >
            {Object.entries(sorts).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {results.length ? (
        <div className="grid">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Nothing here yet</h2>
          <p>Try another genre, or browse the whole catalogue.</p>
          <Link to="/movies" className="btn btn--primary">
            Show all movies
          </Link>
        </div>
      )}

      {configured && (
        <section className="explorer__section">
          <h2 className="explorer__sectionTitle">
            More movies{activeGenre !== 'All' ? ` in ${activeGenre}` : ''} from TMDB
          </h2>
          <PaginatedGrid
            resetKey={`${activeGenre}|${sortKey}`}
            loadPage={(page) =>
              discoverMovies({
                genreId: tmdbGenreId(activeGenre) ?? undefined,
                sortBy: tmdbSort,
                page,
              })
            }
            renderItem={(movie) => <ExplorerMovieCard movie={movie} />}
          />
        </section>
      )}
    </div>
  )
}
