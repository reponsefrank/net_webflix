import { Link } from 'react-router-dom'
import Poster from './Poster'
import FavoriteButton from './FavoriteButton'
import { StarIcon } from './icons'
import { moviePath } from '../lib/paths'

/**
 * Movie card for live TMDB results (search, Load More grid, Favorites). Same
 * visual language as `MovieCard`; both link to the unified `/movie/:id` detail
 * route, which renders the TMDB page for ids that only exist on TMDB.
 */
export default function ExplorerMovieCard({ movie, rank }) {
  const rated = typeof movie.rating === 'number'
  const genres = (movie.genres || []).slice(0, 2).join(' / ')

  return (
    <div className="card">
      <Link to={moviePath(movie)} className="card__link">
        <div className="card__art">
          <Poster movie={movie} alt={`${movie.title} poster`} />
          <span className={`card__rating${rated ? '' : ' card__rating--muted'}`}>
            <StarIcon />
            {rated ? movie.rating.toFixed(1) : 'NR'}
          </span>
          <div className="card__hover">
            <h3>{movie.title}</h3>
            <p className="card__meta">
              {movie.year ?? 'Year unknown'}
              {genres ? ` · ${genres}` : ''}
            </p>
            <p className="card__overview">{movie.overview || 'No description available.'}</p>
          </div>
        </div>
        <div className="card__footer">
          {rank != null && <span className="card__rank">{rank}</span>}
          <span className="card__title">{movie.title}</span>
        </div>
      </Link>
      <FavoriteButton movie={movie} className="card__fav" />
    </div>
  )
}
