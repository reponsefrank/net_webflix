import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { makeBackdrop } from '../lib/artwork'
import { featuredMovies, movies } from '../data/movies'
import { useWatchlist } from '../context/WatchlistContext'
import { CheckIcon, InfoIcon, PlayIcon, PlusIcon, StarIcon } from './icons'

const ROTATE_MS = 9000

export default function Hero() {
  const slides = useMemo(
    () => (featuredMovies.length ? featuredMovies : movies.slice(0, 3)),
    [],
  )
  const [index, setIndex] = useState(0)
  const { has, toggle } = useWatchlist()
  const movie = slides[index]
  const inList = has(movie.id)

  useEffect(() => {
    if (slides.length < 2) return undefined
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [slides.length])

  return (
    <section className="hero">
      <div className="hero__backdrop" style={{ backgroundImage: `url("${makeBackdrop(movie)}")` }} />
      <div className="hero__scrim" />

      <div className="hero__content">
        <span className="hero__eyebrow">netwebfilx spotlight</span>
        <h1 className="hero__title">{movie.title}</h1>
        <p className="hero__tagline">{movie.tagline}</p>
        <div className="hero__meta">
          <span className="hero__rating">
            <StarIcon size={13} />
            {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : 'NR'}
          </span>
          <span>{movie.year}</span>
          <span>{movie.runtime} min</span>
          <span>{movie.genres.join(' / ')}</span>
        </div>
        <p className="hero__overview">{movie.overview}</p>

        <div className="hero__buttons">
          <Link
            to={`/movie/${movie.id}`}
            state={{ autoplayTrailer: true }}
            className="btn btn--primary"
          >
            <PlayIcon />
            Play
          </Link>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => toggle(movie.id)}
          >
            {inList ? <CheckIcon /> : <PlusIcon />}
            {inList ? 'In my list' : 'My list'}
          </button>
          <Link to={`/movie/${movie.id}`} className="btn btn--ghost">
            <InfoIcon />
            More info
          </Link>
        </div>

        {slides.length > 1 && (
          <div className="hero__dots" role="tablist" aria-label="Spotlight movies">
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={slide.title}
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
