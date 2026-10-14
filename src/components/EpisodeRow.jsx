import ActionButtons from './ActionButtons'
import { ClockIcon } from './icons'

/**
 * One episode in a season's list: still image, number, title, air date,
 * runtime, overview and - when a legal source exists - its own Download (left) /
 * Watch (right) pair. Kept presentational so `SeriesDetail` owns playback and
 * "next episode" logic.
 */
export default function EpisodeRow({ episode, source, onWatch }) {
  if (!episode) return null

  return (
    <article className="episodeRow">
      <div className="episodeRow__still">
        {episode.still ? (
          <img src={episode.still} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="episodeRow__stillFallback" aria-hidden="true">
            No image
          </span>
        )}
      </div>

      <div className="episodeRow__body">
        <h3 className="episodeRow__title">
          <span className="episodeRow__num">{episode.episodeNumber}</span>
          <span className="episodeRow__name">{episode.name}</span>
        </h3>

        <div className="episodeRow__meta">
          {episode.airDate ? <span>{episode.airDate}</span> : null}
          {typeof episode.runtime === 'number' ? (
            <span className="episodeRow__runtime">
              <ClockIcon size={13} />
              {episode.runtime} min
            </span>
          ) : null}
        </div>

        <p className="episodeRow__overview">
          {episode.overview || 'No description available for this episode.'}
        </p>

        {source ? (
          <ActionButtons
            className="episodeRow__actions"
            downloadUrl={source.url}
            downloadLabel="Download"
            watchLabel="Watch"
            onWatch={() => onWatch?.(episode)}
          />
        ) : null}
      </div>
    </article>
  )
}
