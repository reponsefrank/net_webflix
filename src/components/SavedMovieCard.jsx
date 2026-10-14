import MovieCard from './MovieCard'
import ExplorerMovieCard from './ExplorerMovieCard'

/**
 * Renders a saved movie with the card that matches where it came from.
 *
 * Local catalogue titles (with a slug `id`) open the local `/movie/:id` route,
 * while TMDB titles (with a numeric `tmdbId`, e.g. saved from the home rows or
 * search) open the explorer route. Both cards carry the heart button, so a
 * saved movie can be removed from the Favorites page with one tap.
 */
export default function SavedMovieCard({ movie }) {
  return movie?.id ? <MovieCard movie={movie} /> : <ExplorerMovieCard movie={movie} />
}
