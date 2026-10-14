import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildPosterUrl } from '../lib/tmdb'
import { tvPath } from '../lib/paths'

/**
 * Compact TMDB result card.
 *
 * Poster visibility rules:
 *  - The image URL is always built by `buildPosterUrl`, which produces the real
 *    TMDB form `https://image.tmdb.org/t/p/w500/<poster_path>` from the movie's
 *    actual `poster_path` (an already-built `poster` URL is passed through
 *    unchanged). No URL is ever guessed from a title.
 *  - When the poster_path is missing or the image fails to load, a visible
 *    `.image-placeholder` is rendered instead of hiding the image (a hidden
 *    <img> would leave an empty gap in the layout).
 */
export default function TmdbMovieCard({ movie }) {
  const posterPath = movie.poster_path || movie.poster || null
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [posterPath])

  const imageUrl = !failed ? buildPosterUrl(posterPath) : null
  const dateText =
    movie.release_date || movie.releaseDate || (movie.year ? String(movie.year) : 'Release date unavailable')

  return (
    <Link className="movie-cardLink" to={tvPath(movie)}>
      <div className="movie-card">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={movie.title}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="image-placeholder">No poster available</div>
        )}

        <h3>{movie.title}</h3>
        <p>{dateText}</p>
      </div>
    </Link>
  )
}