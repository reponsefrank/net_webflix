import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { InfoIcon, PlayIcon, StarIcon } from './icons'

const ROTATE_MS = 9000
const MAX_SLIDES = 5

/**
 * Homepage hero fed by real TMDB trending movies (`/trending/movie/week`).
 *
 * Same cinematic layout, classes and rotation behaviour as the existing local
 * `Hero`, but every slide is a live TMDB result: the backdrop is the movie's
 * real `backdrop_path`, and the buttons open the official trailer modal or the
 * existing TMDB details page (`/explorer/movie/:id`). Slides without a backdrop
 * are skipped so the large image is always a real cinematic backdrop; when no
 * slide has one, the hero falls back to the dark scrim gradient.
 */
export default function TrendingHero({ movies = [], onPlayTrailer }) {
  const slides = useMemo(() => {
    const withBackdrop = movies.filter((movie) => movie.backdrop && movie.tmdbId)
    const pool = withBackdrop.length ? withBackdrop : movies.filter((movie) => movie.tmdbId)
    return pool.slice(0, MAX_SLIDES)
  }, [movies])

  const [index, setIndex] = useState(0)
  const slide = slides[Math.min(index, slides.length - 1)]

  useEffect(() => {
    setIndex(0)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2) return undefined
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [slides.length])

  if (!slide) return null

  return (
    <section className="hero">
      {slide.backdrop && (
        <div className="hero__backdrop" style={{ backgroundImage: `url("${slide.backdrop}")` }} />
      )}
      <div className="hero__scrim" />

      <div className="hero__content">
        <span className="hero__eyebrow">trending this week · TMDB</span>
        <h1 className="hero__title">{slide.title}</h1>
        {slide.tagline && <p className="hero__tagline">{slide.tagline}</p>}
        <div className="hero__meta">
          <span className="hero__rating">
            <StarIcon size={13} />
            {typeof slide.rating === 'number' ? slide.rating.toFixed(1) : 'NR'}
          </span>
          {slide.year && <span>{slide.year}</span>}
        </div>
        <p className="hero__overview">{slide.overview || 'No description available for this title.'}</p>

        <div className="hero__buttons">
          <button
            type="button"
            className="btn btn--primary"
            aria-haspopup="dialog"
            onClick={() => onPlayTrailer && onPlayTrailer(slide)}
          >
            <PlayIcon />
            Play Trailer
          </button>
          <Link to={`/movie/${slide.tmdbId}`} className="btn btn--ghost">
            <InfoIcon />
            View Details
          </Link>
        </div>

        {slides.length > 1 && (
          <div className="hero__dots" role="tablist" aria-label="Trending movies">
            {slides.map((movie, dotIndex) => (
              <button
                key={movie.tmdbId}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={movie.title}
                className={`hero__dot${dotIndex === index ? ' hero__dot--active' : ''}`}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}