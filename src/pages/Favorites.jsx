import { Link } from 'react-router-dom'
import SavedMovieCard from '../components/SavedMovieCard'
import { favoriteKey, useFavorites } from '../context/FavoritesContext'

export default function Favorites() {
  const { favorites, clear } = useFavorites()

  return (
    <div className="page">
      <header className="page__head page__head--split">
        <div>
          <h1>Favorites</h1>
          <p className="page__lead">
            {favorites.length
              ? `${favorites.length} title${favorites.length === 1 ? '' : 's'} saved in this browser.`
              : 'Saved titles are kept in this browser.'}
          </p>
        </div>
        {favorites.length > 0 && (
          <button type="button" className="btn btn--ghost" onClick={clear}>
            Clear favorites
          </button>
        )}
      </header>

      {favorites.length ? (
        <div className="grid">
          {favorites.map((movie) => (
            <SavedMovieCard key={favoriteKey(movie)} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>No favorites yet</h2>
          <p>Tap the heart on any poster to keep it in your favorites.</p>
          <Link to="/movies" className="btn btn--primary">
            Find something to watch
          </Link>
        </div>
      )}
    </div>
  )
}
