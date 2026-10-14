import { InfoIcon, PlayIcon, StarIcon } from './icons'

/**
 * Big Netflix-style hero banner.
 *
 * Shows one featured movie (chosen at random from the live trending list) with
 * its real backdrop image, title, short overview and the two actions:
 * "Play" (opens the full-movie player) and "More Info" (opens the details
 * modal, which offers the official trailer separately).
 */
export default function HomeHero({ movie, onPlay, onInfo }) {
  if (!movie) return null

  const rated = typeof movie.rating === 'number'
  const genres = (movie.genres || []).slice(0, 3).join(' / ')

  return (
    <section className="home-hero">
      {movie.backdrop && (
        <div className="home-hero__backdrop" style={{ backgroundImage: `url("${movie.backdrop}")` }} />
      )}
      <div className="home-hero__scrim" />

      <div className="home-hero__content">
        <span className="home-hero__eyebrow">Net Web Flix Spotlight</span>
        <h1 className="home-hero__title">{movie.title}</h1>

        <div className="home-hero__meta">
          <span className="home-hero__rating">
            <StarIcon size={13} />
            {rated ? movie.rating.toFixed(1) : 'NR'}
          </span>
          {movie.year && <span>{movie.year}</span>}
          {genres && <span>{genres}</span>}
        </div>

        <p className="home-hero__overview">
          {movie.overview || 'No description available for this title yet.'}
        </p>

        <div className="home-hero__buttons">
          <button type="button" className="btn btn--primary" onClick={() => onPlay && onPlay(movie)}>
            <PlayIcon />
            Play
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => onInfo && onInfo(movie)}>
            <InfoIcon />
            More Info
          </button>
        </div>
      </div>
    </section>
  )
}
