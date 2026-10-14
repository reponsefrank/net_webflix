import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from './MovieCard'
import { ChevronIcon } from './icons'

export default function MovieRow({
  title,
  subtitle,
  movies,
  ranked = false,
  moreLink,
  cardComponent: Card = MovieCard,
}) {
  const scrollerRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 8)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [updateArrows, movies.length])

  function scrollBy(direction) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.85, 240), behavior: 'smooth' })
  }

  if (!movies.length) return null

  return (
    <section className="row">
      <div className="row__head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="row__subtitle">{subtitle}</p>}
        </div>
        <div className="row__actions">
          {moreLink && (
            <Link to={moreLink} className="row__more">
              Explore all
            </Link>
          )}
          <button
            type="button"
            className="row__arrow"
            onClick={() => scrollBy(-1)}
            disabled={atStart}
            aria-label={`Scroll ${title} left`}
          >
            <ChevronIcon direction="left" size={20} />
          </button>
          <button
            type="button"
            className="row__arrow"
            onClick={() => scrollBy(1)}
            disabled={atEnd}
            aria-label={`Scroll ${title} right`}
          >
            <ChevronIcon direction="right" size={20} />
          </button>
        </div>
      </div>

      <div className="row__scroller" ref={scrollerRef} onScroll={updateArrows}>
        {movies.map((movie, index) => (
          <Card
            key={movie.id ?? movie.tmdbId ?? index}
            movie={movie}
            rank={ranked ? index + 1 : undefined}
          />
        ))}
      </div>
    </section>
  )
}
