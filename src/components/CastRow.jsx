import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PersonPhoto from './PersonPhoto'
import { ChevronIcon } from './icons'
import {
  fetchMovieCast,
  getTmdbMovieCredits,
  getTmdbPersonDetails,
  getTmdbTvCredits,
  isTmdbConfigured,
} from '../lib/tmdb'

const CAST_LIMIT = 10
const SKELETON_COUNT = 6

/** Whole years between `birthday` and `deathday` (or today), or null. */
function yearsBetween(birthday, deathday) {
  if (!birthday) return null
  const birth = new Date(birthday)
  if (Number.isNaN(birth.getTime())) return null
  const end = deathday ? new Date(deathday) : new Date()
  if (Number.isNaN(end.getTime())) return null

  let age = end.getFullYear() - birth.getFullYear()
  const monthDiff = end.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) age -= 1
  return age >= 0 ? age : null
}

/** "Age 42" for living actors, "Died at 67" otherwise, "Age unknown" last. */
export function ageLabel(member) {
  if (!member?.birthday) return 'Age unknown'
  const age = yearsBetween(member.birthday, member.deathday)
  if (age == null) return 'Age unknown'
  return member.deathday ? `Died at ${age}` : `Age ${age}`
}

function CastCard({ member }) {
  const age = ageLabel(member)
  const inner = (
    <>
      <div className="castCard__photo">
        <PersonPhoto src={member.profile} name={member.name} alt={`Photo of ${member.name}`} />
      </div>
      <p className="castCard__name" title={member.name}>
        {member.name}
      </p>
      {member.character ? (
        <p className="castCard__role" title={member.character}>
          {member.character}
        </p>
      ) : null}
      <p className={`castCard__age${member.deathday ? ' castCard__age--died' : ''}`}>{age}</p>
    </>
  )

  if (member.id == null) {
    return <div className="castCard castCard--row castCard--static">{inner}</div>
  }
  return (
    <Link className="castCard castCard--row" to={`/person/${member.id}`}>
      {inner}
    </Link>
  )
}

/**
 * Horizontally scrollable "Cast" row with each actor's current age.
 *
 * Pulls the top 10 billed cast from TMDB credits (`/movie/{id}/credits` or
 * `/tv/{id}/credits`), then fetches every actor's `/person/{id}` profile **in
 * parallel** to read their birthday. Age is computed against today; a `deathday`
 * switches the label to "Died at X" and a missing birthday shows "Age unknown".
 * Missing photos fall back to the branded initials placeholder. Handles loading
 * (skeleton cards), error (with Retry) and empty states.
 */
export default function CastRow({ mediaType = 'movie', tmdbId = null, title = '', year = null }) {
  const configured = isTmdbConfigured()
  const [status, setStatus] = useState(() => (configured ? 'loading' : 'unconfigured'))
  const [members, setMembers] = useState([])
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)
  const requestRef = useRef(0)
  const scrollerRef = useRef(null)

  useEffect(() => {
    if (!configured) {
      setStatus('unconfigured')
      return undefined
    }
    if (tmdbId == null && !title) {
      setStatus('empty')
      return undefined
    }

    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setStatus('loading')
    setError('')

    let creditsPromise
    if (mediaType === 'tv') {
      creditsPromise = getTmdbTvCredits(tmdbId)
    } else if (tmdbId != null) {
      creditsPromise = getTmdbMovieCredits(tmdbId)
    } else {
      // Local catalogue title without a TMDB id: resolve it, then read credits.
      creditsPromise = fetchMovieCast({ title, year }).then((cast) => ({ cast: cast || [] }))
    }

    creditsPromise
      .then(async ({ cast }) => {
        const top = (cast || []).slice(0, CAST_LIMIT)
        if (!top.length) {
          if (requestId === requestRef.current) {
            setMembers([])
            setStatus('empty')
          }
          return
        }

        // Fetch every actor's birthday profile in parallel; one bad lookup
        // must not sink the whole row.
        const hydrated = await Promise.all(
          top.map(async (member) => {
            if (member.id == null) return { ...member, birthday: '', deathday: '' }
            try {
              const person = await getTmdbPersonDetails(member.id)
              return {
                ...member,
                birthday: person?.birthday || '',
                deathday: person?.deathday || '',
              }
            } catch {
              return { ...member, birthday: '', deathday: '' }
            }
          }),
        )

        if (requestId !== requestRef.current) return
        setMembers(hydrated)
        setStatus('ready')
      })
      .catch((err) => {
        if (requestId !== requestRef.current) return
        setError(err?.message || 'Could not load the cast right now.')
        setStatus('error')
      })

    return undefined
  }, [configured, mediaType, tmdbId, title, year, nonce])

  const scrollBy = useCallback((direction) => {
    const node = scrollerRef.current
    if (!node) return
    node.scrollBy({ left: direction * Math.max(node.clientWidth * 0.8, 220), behavior: 'smooth' })
  }, [])

  return (
    <section className="castSection" aria-label="Cast">
      <div className="castSection__head">
        <div>
          <h2 className="castSection__title">Cast</h2>
          {status === 'ready' && members.length ? (
            <p className="castSection__subtitle">
              Top {members.length} billed cast, with current age
            </p>
          ) : null}
        </div>
        {status === 'ready' && members.length > 1 ? (
          <div className="castSection__actions">
            <button
              type="button"
              className="row__arrow"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll cast left"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              className="row__arrow"
              onClick={() => scrollBy(1)}
              aria-label="Scroll cast right"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        ) : null}
      </div>

      {status === 'loading' ? (
        <div className="castSection__scroller" aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div className="castCard castCard--row castCard--loading" key={index}>
              <div className="castCard__photo" />
              <span className="skeleton__line" />
              <span className="skeleton__line skeleton__line--short" />
              <span className="skeleton__line skeleton__line--short" />
            </div>
          ))}
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="castSection__state">
          <p>{error}</p>
          <button type="button" className="btn btn--ghost" onClick={() => setNonce((n) => n + 1)}>
            Retry
          </button>
        </div>
      ) : null}

      {status === 'unconfigured' ? (
        <div className="castSection__state">
          <p>Cast and ages need a TMDB API key (add VITE_TMDB_API_KEY to .env).</p>
        </div>
      ) : null}

      {status === 'empty' ? (
        <div className="castSection__state">
          <p>No cast information is available for this title yet.</p>
        </div>
      ) : null}

      {status === 'ready' && members.length ? (
        <div className="castSection__scroller" ref={scrollerRef}>
          {members.map((member) => (
            <CastCard key={`${member.id ?? member.name}-${member.character}`} member={member} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
