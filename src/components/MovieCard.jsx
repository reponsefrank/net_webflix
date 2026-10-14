import { Link } from 'react-router-dom'
import Poster from './Poster'
import FavoriteButton from './FavoriteButton'
import { StarIcon } from './icons'

export default function MovieCard({ movie, rank }) {
  return (
    <div className="card">
      <Link to={`/movie/${movie.id}`} className="card__link">
        <div className="card__art">
          <Poster movie={movie} alt={`${movie.title} poster`} />
          <span className="card__rating">
            <StarIcon />
            {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : 'NR'}
          </span>
          <div className="card__hover">
            <h3>{movie.title}</h3>
            <p className="card__meta">
              {movie.year} &middot; {movie.genres.join(' / ')}
            </p>
            <p className="card__overview">{movie.overview}</p>
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
