import { HeartIcon } from './icons'
import { useFavorites } from '../context/FavoritesContext'

/**
 * The shared heart toggle that appears on every movie card.
 *
 * It reads/writes the shared `FavoritesContext`, so the same movie shows a
 * filled red heart everywhere at once. It is deliberately rendered as a
 * sibling of the card's link/button (never nested inside it) to keep the
 * markup valid; the event handlers still stop propagation just in case.
 */
export default function FavoriteButton({ movie, className = '', size = 18 }) {
  const { has, toggle } = useFavorites()
  const active = has(movie)
  const title = movie?.title || movie?.name || 'this title'

  return (
    <button
      type="button"
      className={`favBtn${active ? ' favBtn--active' : ''}${className ? ` ${className}` : ''}`}
      aria-pressed={active}
      aria-label={active ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggle(movie)
      }}
    >
      <HeartIcon size={size} filled={active} />
    </button>
  )
}
