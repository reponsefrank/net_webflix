import { useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard'
import SavedMovieCard from '../components/SavedMovieCard'
import { movies } from '../data/movies'
import { favoriteKey, useFavorites } from '../context/FavoritesContext'
import { useWatchlist } from '../context/WatchlistContext'

export default function MyList() {
  const [tab, setTab] = useState('watchlist')
  const watchlist = useWatchlist()
  const { favorites, clear: clearFavorites } = useFavorites()

  // The watchlist still stores ids (local catalogue slugs); favorites store the
  // full movie objects, so the Favorites tab renders whatever was saved.
  const watchlistMovies = watchlist.ids
    .map((id) => movies.find((movie) => movie.id === id))
    .filter(Boolean)
  const isWatchlist = tab === 'watchlist'
  const saved = isWatchlist ? watchlistMovies : favorites

  const tabs = [
    { id: 'watchlist', label: 'My list', count: watchlist.ids.length },
    { id: 'favorites', label: 'Favorites', count: favorites.length },
  ]

  return (
    <div className="page">
      <header className="page__head page__head--split">
        <div>
          <h1>{isWatchlist ? 'My list' : 'Favorites'}</h1>
          <p className="page__lead">
            {saved.length
              ? `${saved.length} title${saved.length === 1 ? '' : 's'} saved in this browser.`
              : 'Saved titles are kept in this browser.'}
          </p>
        </div>
        {saved.length > 0 && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={isWatchlist ? watchlist.clear : clearFavorites}
          >
            Clear {isWatchlist ? 'list' : 'favorites'}
          </button>
        )}
      </header>

      <div className="tabs" role="tablist" aria-label="Saved collections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls="saved-panel"
            tabIndex={tab === item.id ? 0 : -1}
            className={`tab${tab === item.id ? ' tab--active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.count > 0 && <span className="tab__count">{item.count}</span>}
          </button>
        ))}
      </div>

      <div id="saved-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {saved.length ? (
          <div className="grid">
            {isWatchlist
              ? saved.map((movie) => <MovieCard key={movie.id} movie={movie} />)
              : saved.map((movie) => <SavedMovieCard key={favoriteKey(movie)} movie={movie} />)}
          </div>
        ) : (
          <div className="empty">
            <h2>{isWatchlist ? 'Your list is empty' : 'No favorites yet'}</h2>
            <p>
              {isWatchlist
                ? 'Use the plus button on any poster to save it here for later.'
                : 'Tap the heart on any poster to keep it in your favorites.'}
            </p>
            <Link to="/movies" className="btn btn--primary">
              Find something to watch
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
