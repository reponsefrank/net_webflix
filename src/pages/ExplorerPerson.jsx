import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ExplorerMovieCard from '../components/ExplorerMovieCard'
import PersonPhoto from '../components/PersonPhoto'
import LoadMore from '../components/LoadMore'
import { GlobeIcon } from '../components/icons'
import { useReveal } from '../hooks/useLoadMore'
import { getTmdbPersonCredits, getTmdbPersonDetails, isTmdbConfigured } from '../lib/tmdb'

const BIO_CLAMP_LENGTH = 480
const FILMOGRAPHY_PAGE_SIZE = 20

function byPopularity(a, b) {
  return b.voteCount - a.voteCount || b.popularity - a.popularity
}

function uniqueByTmdbId(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item.tmdbId)) return false
    seen.add(item.tmdbId)
    return true
  })
}

/** Full years between two dates, or between a birthday and today when alive. */
function calculateAge(birthday, deathday) {
  if (!birthday) return null
  const birth = new Date(birthday)
  if (Number.isNaN(birth.getTime())) return null
  const end = deathday ? new Date(deathday) : new Date()
  if (Number.isNaN(end.getTime())) return null
  let age = end.getFullYear() - birth.getFullYear()
  const monthDiff = end.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) age -= 1
  return age < 0 ? null : age
}

/** Format an ISO `YYYY-MM-DD` date without timezone drift. */
function formatDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Actor profile page (`/person/:id`): photo, name, computed age, birthday,
 * place of birth, "also known as", a biography with a Read more toggle and a
 * "Known for" row whose posters open the matching movie page.
 *
 * Every field is optional: anything TMDB does not provide is simply hidden,
 * never rendered as "undefined".
 */
export default function ExplorerPerson() {
  const { id } = useParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [person, setPerson] = useState(null)
  const [credits, setCredits] = useState({ cast: [], crew: [] })
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)
  const [bioExpanded, setBioExpanded] = useState(false)
  const requestRef = useRef(0)

  const configured = isTmdbConfigured()

  useEffect(() => {
    if (!configured) return undefined
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setStatus('loading')
    setError('')
    setBioExpanded(false)

    Promise.all([getTmdbPersonDetails(id), getTmdbPersonCredits(id)])
      .then(([personData, creditsData]) => {
        if (requestId !== requestRef.current) return
        setPerson(personData)
        setCredits(creditsData)
        setStatus('success')
      })
      .catch((err) => {
        if (requestId !== requestRef.current) return
        setError(err?.message || 'Could not load this person from TMDB.')
        setStatus('error')
      })
  }, [id, configured, nonce])

  // Derived lists ------------------------------------------------------------------
  const derived = useMemo(() => {
    if (!person || !credits) return null
    const cast = credits.cast
    const crew = credits.crew
    const directed = uniqueByTmdbId(crew.filter((entry) => entry.role === 'Director'))
    const isDirector = directed.length > 0 && person.department === 'Directing'
    const knownFor = uniqueByTmdbId([...(isDirector ? directed : cast)].sort(byPopularity)).slice(0, 10)
    const filmography = [...cast, ...crew].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    return { directed, knownFor, filmography }
  }, [person, credits])

  // The full filmography can be long, so reveal it 20 rows at a time behind the
  // shared "Load More" button (no API needed - the credits are already loaded).
  const filmographyLength = derived ? derived.filmography.length : 0
  const filmReveal = useReveal(filmographyLength, {
    pageSize: FILMOGRAPHY_PAGE_SIZE,
    resetKey: id,
  })

  if (!configured) {
    return (
      <div className="page">
        <div className="empty">
          <h2>Nothing to show here right now</h2>
          <p>This profile is not available at the moment. Head back to the actors page to keep browsing.</p>
          <div className="empty__actions">
            <Link to="/actors" className="btn btn--primary">
              Back to Actors
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status !== 'success' || !person || !derived) {
    return (
      <div className="page">
        {status === 'loading' && (
          <>
            <div className="picker__status" role="status">
              <span className="spinner" aria-hidden="true" />
              <p>Loading profile from TMDB…</p>
            </div>
            <div className="explorerDetail__skeleton" aria-hidden="true">
              <div className="skeleton" />
              <div>
                <div className="skeleton" style={{ height: '2rem' }} />
                <div className="skeleton" style={{ height: '1rem', width: '60%' }} />
                <div className="skeleton" style={{ height: '1rem' }} />
                <div className="skeleton" style={{ height: '1rem', width: '80%' }} />
              </div>
            </div>
          </>
        )}
        {status === 'error' && (
          <div className="empty picker__error" role="alert">
            <h2>Couldn't load this profile</h2>
            <p>{error}</p>
            <div className="empty__actions">
              <button type="button" className="btn btn--primary" onClick={() => setNonce((n) => n + 1)}>
                Retry
              </button>
              <Link to="/actors" className="btn btn--ghost">
                Back to Actors
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  const { directed, knownFor, filmography } = derived
  const age = calculateAge(person.birthday, person.deathday)
  const ageLabel =
    age == null ? '' : person.deathday ? `Died at age ${age}` : `Age ${age}`
  const birthdayLabel = person.birthday ? `Born ${formatDate(person.birthday)}` : ''
  const deathdayLabel = person.deathday ? `Died ${formatDate(person.deathday)}` : ''
  const alsoKnownAs = person.alsoKnownAs || []
  const biography = person.biography || ''
  const isLongBio = biography.length > BIO_CLAMP_LENGTH

  return (
    <article className="detail">
      <div className="detail__backdrop" />
      <div className="detail__scrim" />

      <div className="detail__inner">
        <Link to="/actors" className="detail__back">
          &larr; Back to Actors
        </Link>

        <div className="detail__head">
          <div className="detail__poster detail__poster--person">
            <PersonPhoto src={person.profile} name={person.name} />
          </div>

          <div className="detail__info">
            <h1>{person.name}</h1>
            {person.department && <p className="detail__tagline">{person.department}</p>}

            <div className="detail__meta">
              {ageLabel && <span className="detail__rating">{ageLabel}</span>}
              {birthdayLabel && <span>{birthdayLabel}</span>}
              {deathdayLabel && <span>{deathdayLabel}</span>}
              {person.placeOfBirth && (
                <span className="detail__runtime">
                  <GlobeIcon size={14} />
                  {person.placeOfBirth}
                </span>
              )}
              {directed.length > 0 && (
                <span className="detail__hd">
                  {directed.length} film{directed.length === 1 ? '' : 's'} directed
                </span>
              )}
            </div>

            {alsoKnownAs.length > 0 && (
              <p className="actor__aka">
                <span className="actor__akaLabel">Also known as</span>
                <span>{alsoKnownAs.slice(0, 6).join(', ')}</span>
              </p>
            )}

            {biography && (
              <>
                <p className={`detail__overview${!bioExpanded && isLongBio ? ' detail__overview--clamp' : ''}`}>
                  {biography}
                </p>
                {isLongBio && (
                  <button
                    type="button"
                    className="btn btn--ghost actor__readMore"
                    aria-expanded={bioExpanded}
                    onClick={() => setBioExpanded((value) => !value)}
                  >
                    {bioExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="page">
        {knownFor.length > 0 && (
          <section className="explorer__section">
            <h2 className="explorer__sectionTitle">Known for</h2>
            <div className="grid">
              {knownFor.map((movie, index) => (
                <ExplorerMovieCard key={`kf-${movie.tmdbId}`} movie={movie} rank={index + 1} />
              ))}
            </div>
          </section>
        )}

        {directed.length > 0 && (
          <section className="explorer__section">
            <h2 className="explorer__sectionTitle">Directed</h2>
            <div className="grid">
              {directed.map((movie, index) => (
                <ExplorerMovieCard key={`dir-${movie.tmdbId}`} movie={movie} rank={index + 1} />
              ))}
            </div>
          </section>
        )}

        {filmography.length > 0 && (
          <section className="explorer__section">
            <h2 className="explorer__sectionTitle">Filmography</h2>
            <div className="filmography">
              <ul className="filmography__list">
                {filmography.slice(0, filmReveal.visible).map((entry) => (
                  <li key={`${entry.tmdbId}-${entry.role || 'role'}`} className="filmography__row">
                    <span className="filmography__year">{entry.year ?? '—'}</span>
                    <Link to={`/movie/${entry.tmdbId}`} className="filmography__title">
                      {entry.title}
                    </Link>
                    {entry.role && <span className="filmography__role">{entry.role}</span>}
                  </li>
                ))}
              </ul>
            </div>
            {filmography.length > FILMOGRAPHY_PAGE_SIZE && (
              <LoadMore
                status={filmReveal.hasMore ? 'idle' : 'done'}
                onLoad={filmReveal.showMore}
                doneLabel="That's the whole filmography"
              />
            )}
          </section>
        )}
      </div>
    </article>
  )
}
