import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import MovieRow from '../components/MovieRow'
import Poster from '../components/Poster'
import VideoPlayerModal from '../components/VideoPlayerModal'
import Player from '../components/Player'
import ActionButtons from '../components/ActionButtons'
import WhereToWatch from '../components/WhereToWatch'
import FavoriteButton from '../components/FavoriteButton'
import CastRow from '../components/CastRow'
import { getMovieById, getSimilarMovies } from '../data/movies'
import { getPlayableMovieById, toVideoSource } from '../data/playable'
import { makeBackdrop } from '../lib/artwork'
import { useWatchlist } from '../context/WatchlistContext'
import { CheckIcon, ClockIcon, PlayIcon, PlusIcon, StarIcon } from '../components/icons'
import NotFound from './NotFound'

/**
 * Local catalogue movie page (`/movie/:slug` for offline titles). TMDB ids are
 * handled by `TmdbMovieDetail`; `App`'s `MovieRoute` picks between them.
 *
 * It keeps the offline cast/director data, adds a heart favorite button, and ends
 * with the same Download (left) / Watch (right) row as the TMDB page - Watch
 * plays a legal source from `src/data/playable.js`, or the TMDB "Where to watch"
 * panel is shown when there is none.
 */
export default function MovieDetail() {
  const { id } = useParams()
  const location = useLocation()
  const movie = getMovieById(id)
  const { has, toggle } = useWatchlist()
  const [trailerOpen, setTrailerOpen] = useState(() => Boolean(location.state?.autoplayTrailer))
  const [playing, setPlaying] = useState(null)

  if (!movie) return <NotFound />

  const inList = has(movie.id)
  const similar = getSimilarMovies(movie)
  const hours = Math.floor(movie.runtime / 60)
  const minutes = movie.runtime % 60
  const video = toVideoSource(getPlayableMovieById(movie.id))

  return (
    <article className="detail">
      <div
        className="detail__backdrop"
        style={{ backgroundImage: `url("${makeBackdrop(movie)}")` }}
      />
      <div className="detail__scrim" />

      <div className="detail__inner">
        <Link to="/movies" className="detail__back">
          &larr; Back to movies
        </Link>

        <div className="detail__head">
          <Poster movie={movie} className="detail__poster" alt={`${movie.title} poster`} />

          <div className="detail__info">
            <div className="detail__titleRow">
              <h1>{movie.title}</h1>
              <FavoriteButton movie={movie} className="detail__fav" size={22} />
            </div>
            {movie.tagline && <p className="detail__tagline">{movie.tagline}</p>}

            <div className="detail__meta">
              <span className="detail__rating">
                <StarIcon size={14} />
                {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : 'Not rated'}
              </span>
              <span>{movie.year}</span>
              <span className="detail__runtime">
                <ClockIcon size={14} />
                {hours}h {minutes}m
              </span>
              <span className="detail__hd">HD</span>
            </div>

            <div className="detail__genres">
              {movie.genres.map((genre) => (
                <Link key={genre} to={`/movies?genre=${encodeURIComponent(genre)}`} className="chip">
                  {genre}
                </Link>
              ))}
            </div>

            <p className="detail__overview">{movie.overview}</p>

            <dl className="detail__credits">
              <div>
                <dt>Director</dt>
                <dd>{movie.director}</dd>
              </div>
              <div>
                <dt>Cast</dt>
                <dd>{movie.cast.join(', ')}</dd>
              </div>
            </dl>

            <div className="detail__buttons">
              <button
                type="button"
                className="btn btn--primary"
                aria-haspopup="dialog"
                title="Open the official trailer from TMDB / YouTube"
                onClick={() => setTrailerOpen(true)}
              >
                <PlayIcon size={16} />
                Watch Trailer
              </button>
              <button
                type="button"
                className="btn btn--primary btn--toggle"
                aria-pressed={inList}
                onClick={() => toggle(movie.id)}
              >
                {inList ? <CheckIcon /> : <PlusIcon />}
                {inList ? 'In my list' : 'Add to my list'}
              </button>
            </div>

            {/* Bottom action row: Download (left) / Watch (right), or the
                Where-to-watch panel when there is no legal source. */}
            <div className="detail__actionsBar">
              {video ? (
                <ActionButtons downloadUrl={video.url} onWatch={() => setPlaying(video)} />
              ) : (
                <WhereToWatch mediaType="movie" title={movie.title} year={movie.year} />
              )}
            </div>
          </div>
        </div>

        <CastRow mediaType="movie" title={movie.title} year={movie.year} />
      </div>

      <div className="page">
        <MovieRow title="More like this" movies={similar} />
      </div>

      {trailerOpen && (
        <VideoPlayerModal
          movie={movie}
          trailerOnly
          onClose={() => setTrailerOpen(false)}
        />
      )}

      {playing ? (
        <Player
          source={playing}
          title={movie.title}
          subtitle="Full movie"
          poster={movie.poster}
          onClose={() => setPlaying(null)}
        />
      ) : null}
    </article>
  )
}
