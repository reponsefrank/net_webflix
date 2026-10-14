import { Link } from 'react-router-dom'
import Poster from './Poster'
import FavoriteButton from './FavoriteButton'
import { StarIcon } from './icons'
import { moviePath } from '../lib/paths'

/**
 * Netflix-style poster card for the homepage rows and the "More movies" grid.
 *
 * The whole tile is a `Link` to the title's detail page (`/movie/:id`) so a
 * click navigates straight there, exactly like `MovieCard`. It reuses the shared
 * `Poster` resolver, so TMDB artwork (or the bundled/generated fallback) is shown
 * exactly as elsewhere. The poster scales up slightly on hover via CSS. The
 * heart sits on top as a sibling of the link so the two controls never nest.
 */
export default function HomeCard({ movie }) {
  const rated = typeof movie.rating === 'number'
  const genres = (movie.genres || []).slice(0, 2).join(' / ')
  const meta = [movie.year, genres].filter(Boolean).join(' · ')

  return (
    <article className="hcard">
      <Link
        to={moviePath(movie)}
        className="hcard__posterBtn"
        aria-label={`View details for ${movie.title}`}
      >
        <div className="hcard__art">
          <Poster movie={movie} alt={`${movie.title} poster`} />
          <span className={`hcard__rating${rated ? '' : ' hcard__rating--muted'}`}>
            <StarIcon size={12} />
            {rated ? movie.rating.toFixed(1) : 'NR'}
          </span>
          <div className="hcard__overlay">
            <h3>{movie.title}</h3>
            {meta && <p className="hcard__meta">{meta}</p>}
            <p className="hcard__overview">{movie.overview || 'No description available.'}</p>
          </div>
        </div>
      </Link>
      <FavoriteButton movie={movie} className="hcard__fav" />
    </article>
  )
}
