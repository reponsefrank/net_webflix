/**
 * Movie-card loading placeholder.
 *
 * Reserves the same footprint as a real card - a 2:3 poster plus a footer line
 * (or two, for the taller TMDB card that shows a title and release date) - so
 * horizontal rows and grids never reflow when the real cards arrive.
 *
 * It reuses the shared `.card`, `.card__art` and `.card__footer` classes, which
 * means it lines up with real cards in both carousels and grids.
 */
export default function MovieCardSkeleton({ variant = 'card' }) {
  const tmdb = variant === 'tmdb'

  return (
    <div
      className={`card card--skeleton${tmdb ? ' card--skeleton--tmdb' : ''}`}
      aria-hidden="true"
    >
      <div className="card__art skeleton" />
      <div className="card__footer card__footer--skeleton">
        <span className="skeleton skeleton__line" />
        {tmdb && <span className="skeleton skeleton__line skeleton__line--short" />}
      </div>
    </div>
  )
}
