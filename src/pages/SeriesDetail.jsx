import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CastRow from '../components/CastRow'
import EpisodeRow from '../components/EpisodeRow'
import FavoriteButton from '../components/FavoriteButton'
import Player from '../components/Player'
import Poster from '../components/Poster'
import WhereToWatch from '../components/WhereToWatch'
import { ClockIcon, StarIcon } from '../components/icons'
import { getTmdbTvDetails, getTvSeason, isTmdbConfigured } from '../lib/tmdb'
import { getPlayableEpisode, toVideoSource } from '../data/playable'

/** The first sensible season to open: season 1 when present, else the first. */
function defaultSeason(seasons = []) {
  const withEpisodes = seasons.filter((season) => (season.episodeCount ?? 0) > 0)
  const standard = withEpisodes.find((season) => season.seasonNumber >= 1)
  return (standard || withEpisodes[0] || seasons[0])?.seasonNumber ?? 1
}

/** Index of the next episode (after `from`) that has a legal source, or null. */
function nextPlayableIndex(seriesId, seasonNumber, episodes, from) {
  for (let index = from + 1; index < episodes.length; index += 1) {
    const episode = episodes[index]
    if (getPlayableEpisode(seriesId, seasonNumber, episode.episodeNumber)) return index
  }
  return null
}

/**
 * TMDB series detail page (`/tv/:id`), reached from the TV shows grid.
 *
 * Shows the show's backdrop, title, year, rating, genres and overview, a heart
 * favorite button, a season dropdown, the episode list for the selected season
 * (`/tv/{id}/season/{n}`) and a Cast row with actor ages. Each episode row has
 * its own Download (left) / Watch (right) pair; Watch opens the full-screen
 * `Player` with a "Next episode" button. A season with no legal sources shows
 * the TMDB "Where to watch" panel instead.
 */
export default function SeriesDetail() {
  const { id } = useParams()
  const configured = isTmdbConfigured()

  const [status, setStatus] = useState(() => (configured ? 'loading' : 'unconfigured'))
  const [show, setShow] = useState(null)
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)

  const [seasonNumber, setSeasonNumber] = useState(null)
  const [season, setSeason] = useState(null)
  const [seasonStatus, setSeasonStatus] = useState('idle')
  const [seasonError, setSeasonError] = useState('')
  const [seasonNonce, setSeasonNonce] = useState(0)

  const [playing, setPlaying] = useState(null)

  const showRequestRef = useRef(0)
  const seasonRequestRef = useRef(0)

  // 1. Load the show, then open its default season.
  useEffect(() => {
    if (!configured) return undefined
    const requestId = showRequestRef.current + 1
    showRequestRef.current = requestId
    setStatus('loading')
    setError('')

    getTmdbTvDetails(id)
      .then((data) => {
        if (requestId !== showRequestRef.current) return
        setShow(data)
        setSeasonNumber(defaultSeason(data?.seasons))
        setStatus('success')
      })
      .catch((err) => {
        if (requestId !== showRequestRef.current) return
        setError(err?.message || 'Could not load this series from TMDB.')
        setStatus('error')
      })

    return undefined
  }, [configured, id, nonce])

  // 2. Load the selected season's episodes.
  useEffect(() => {
    if (!configured || seasonNumber == null) return undefined
    const requestId = seasonRequestRef.current + 1
    seasonRequestRef.current = requestId
    setSeasonStatus('loading')
    setSeasonError('')
    setSeason(null)
    setPlaying(null)

    getTvSeason(id, seasonNumber)
      .then((data) => {
        if (requestId !== seasonRequestRef.current) return
        setSeason(data)
        setSeasonStatus('success')
      })
      .catch((err) => {
        if (requestId !== seasonRequestRef.current) return
        setSeasonError(err?.message || 'Could not load these episodes.')
        setSeasonStatus('error')
      })

    return undefined
  }, [configured, id, seasonNumber, seasonNonce])

  if (!configured) {
    return (
      <div className="page">
        <div className="empty">
          <h2>Series details need a TMDB key</h2>
          <p>
            Add <code>VITE_TMDB_API_KEY</code> to your <code>.env</code> file and restart the
            dev server to load TMDB details.
          </p>
          <Link className="btn btn--primary" to="/tv-shows">
            Browse TV shows
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="page detail detail--loading">
        <div className="empty">
          <span className="whereToWatch__spinner" aria-hidden="true" />
          <p>Loading series details…</p>
        </div>
      </div>
    )
  }

  if (status === 'error' || !show) {
    return (
      <div className="page">
        <div className="empty">
          <h2>We could not load this series</h2>
          <p>{error || 'The series may have been removed, or TMDB is unavailable.'}</p>
          <div className="empty__actions">
            <button type="button" className="btn btn--primary" onClick={() => setNonce((n) => n + 1)}>
              Retry
            </button>
            <Link className="btn btn--ghost" to="/tv-shows">
              Browse TV shows
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const episodes = season?.episodes || []
  const anyPlayable = episodes.some((episode) =>
    getPlayableEpisode(id, seasonNumber, episode.episodeNumber),
  )

  const watchEpisode = (index) => {
    const episode = episodes[index]
    if (!episode) return
    const source = toVideoSource(getPlayableEpisode(id, seasonNumber, episode.episodeNumber))
    if (!source) return
    setPlaying({ episode, source, index })
  }

  const nextIndex = playing
    ? nextPlayableIndex(id, seasonNumber, episodes, playing.index)
    : null

  return (
    <article className="detail">
      <div
        className="detail__backdrop"
        style={show.backdrop ? { backgroundImage: `url("${show.backdrop}")` } : undefined}
      />
      <div className="detail__scrim" />

      <div className="detail__inner">
        <Link to="/tv-shows" className="detail__back">
          &larr; Back to TV shows
        </Link>

        <div className="detail__head">
          <Poster movie={show} className="detail__poster" alt={`${show.title} poster`} />

          <div className="detail__info">
            <div className="detail__titleRow">
              <h1>{show.title}</h1>
              <FavoriteButton movie={show} className="detail__fav" size={22} />
            </div>
            {show.tagline ? <p className="detail__tagline">{show.tagline}</p> : null}

            <div className="detail__meta">
              <span className="detail__rating">
                <StarIcon size={14} />
                {typeof show.rating === 'number' ? show.rating.toFixed(1) : 'Not rated'}
              </span>
              {show.year ? <span>{show.year}</span> : null}
              <span>
                {show.numberOfSeasons} {show.numberOfSeasons === 1 ? 'season' : 'seasons'}
              </span>
              {show.runtime ? (
                <span className="detail__runtime">
                  <ClockIcon size={14} />
                  {show.runtime} min episodes
                </span>
              ) : null}
              <span className="detail__hd">HD</span>
            </div>

            {show.genres?.length ? (
              <div className="detail__genres">
                {show.genres.map((genre) => (
                  <span key={genre} className="chip chip--static">
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="detail__overview">
              {show.overview || 'No description available for this series yet.'}
            </p>

            <div className="seasons">
              <label className="seasons__label" htmlFor="season-select">
                Season
              </label>
              <select
                id="season-select"
                className="seasons__select"
                value={seasonNumber ?? ''}
                onChange={(event) => setSeasonNumber(Number(event.target.value))}
              >
                {(show.seasons || []).map((option) => (
                  <option key={option.seasonNumber} value={option.seasonNumber}>
                    {option.name}
                    {option.episodeCount ? ` (${option.episodeCount} episodes)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <section className="episodes" aria-label="Episodes">
          <h2 className="episodes__title">
            {season?.name || 'Episodes'}
            {episodes.length ? (
              <span className="episodes__count"> · {episodes.length} episodes</span>
            ) : null}
          </h2>

          {seasonStatus === 'loading' ? (
            <div className="episodes__list" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="episodeRow episodeRow--loading" key={index}>
                  <div className="episodeRow__still" />
                  <div className="episodeRow__body">
                    <span className="skeleton__line" />
                    <span className="skeleton__line skeleton__line--short" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {seasonStatus === 'error' ? (
            <div className="episodes__state">
              <p>{seasonError}</p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setSeasonNonce((n) => n + 1)}
              >
                Retry
              </button>
            </div>
          ) : null}

          {seasonStatus === 'success' && !episodes.length ? (
            <div className="episodes__state">
              <p>No episodes are listed for this season.</p>
            </div>
          ) : null}

          {seasonStatus === 'success' && episodes.length ? (
            <div className="episodes__list">
              {episodes.map((episode) => (
                <EpisodeRow
                  key={episode.episodeNumber}
                  episode={episode}
                  source={toVideoSource(
                    getPlayableEpisode(id, seasonNumber, episode.episodeNumber),
                  )}
                  onWatch={() => {
                    const index = episodes.findIndex(
                      (item) => item.episodeNumber === episode.episodeNumber,
                    )
                    watchEpisode(index)
                  }}
                />
              ))}
            </div>
          ) : null}

          {seasonStatus === 'success' && episodes.length && !anyPlayable ? (
            <WhereToWatch mediaType="tv" tmdbId={id} title={show.title} />
          ) : null}
        </section>

        <CastRow mediaType="tv" tmdbId={id} />
      </div>

      {playing ? (
        <Player
          source={playing.source}
          title={show.title}
          subtitle={`S${seasonNumber} E${playing.episode.episodeNumber} · ${playing.episode.name}`}
          poster={show.backdrop || show.poster}
          onClose={() => setPlaying(null)}
          onNext={nextIndex != null ? () => watchEpisode(nextIndex) : undefined}
        />
      ) : null}
    </article>
  )
}
