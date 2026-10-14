import { Link } from 'react-router-dom'
import TmdbMovieCard from '../components/TmdbMovieCard'
import PaginatedGrid from '../components/PaginatedGrid'
import { getPopularTvShows, isTmdbConfigured } from '../lib/tmdb'

/**
 * TV Shows: a live preview of TMDB's popular TV shows, paged with the shared
 * `PaginatedGrid` (its Load More uses the TV endpoints). The demo catalogue is
 * movie-only, so these cards are informational until dedicated TV pages land.
 */
export default function TvShows() {
  const configured = isTmdbConfigured()

  return (
    <div className="page">
      <header className="page__head">
        <span className="picker__eyebrow">Series</span>
        <h1>TV Shows</h1>
        <p className="page__lead">
          Popular series on TMDB, with the same Load More as the rest of the site. Dedicated TV
          show pages are on the way - for now, dive into the film catalogue or browse the actors.
        </p>
      </header>

      {configured ? (
        <PaginatedGrid
          resetKey="series"
          loadPage={(page) => getPopularTvShows(page)}
          renderItem={(show) => <TmdbMovieCard movie={show} />}
          doneLabel="No more series"
          emptyState={
            <div className="empty">
              <h2>No series right now</h2>
              <p>TMDB did not return any popular series. Try again in a moment.</p>
            </div>
          }
        />
      ) : (
        <div className="empty">
          <h2>TV show previews need a TMDB key</h2>
          <p>
            This preview is powered by TMDB. Add <code>VITE_TMDB_API_KEY</code> to your{' '}
            <code>.env</code> file and restart the dev server to load it.
          </p>
          <div className="empty__actions">
            <Link to="/movies" className="btn btn--primary">
              Browse movies
            </Link>
            <Link to="/actors" className="btn btn--ghost">
              Browse Actors
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
