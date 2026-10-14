import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PersonPhoto from './PersonPhoto'
import { ChevronIcon } from './icons'
import { fetchActorProfile, fetchMovieCast, isTmdbConfigured } from '../lib/tmdb'

const INITIAL_VISIBLE = 10
const SKELETON_COUNT = 6

/** Local catalogue cast (an array of names) mapped into cast-card shape. */
function localCast(movie) {
  const names = Array.isArray(movie?.cast) ? movie.cast : []
  return names
    .filter((name) => typeof name === 'string' && name.trim())
    .map((name) => ({ id: null, name: name.trim(), character: '', profile: null }))
}

/**
 * "Cast & Crew" section for a movie page.
 *
 * Cast comes from the official TMDB credits endpoint (`fetchMovieCast`), which
 * resolves a title/year (local catalogue) or a TMDB id (explorer) to real names,
 * characters and profile photos. When TMDB is not configured, has no credits, or
 * errors, the section falls back to the local cast names (with photo
 * placeholders) so the page stays useful offline; if there is no cast at all a
 * friendly empty message is shown. Up to 10 billing-order cast members are shown
 * first, with a toggle to reveal the rest in the same horizontal scroller.
 */
export default function CastCrewSection({ movie }) {
  const identity = `${movie?.tmdbId ?? ''}|${movie?.title ?? ''}|${movie?.year ?? ''}`
  const configured = isTmdbConfigured()
  const local = useMemo(() => localCast(movie), [identity]) // eslint-disable-line react-hooks/exhaustive-deps

  const [status, setStatus] = useState(() =>
    configured ? 'loading' : local.length ? 'ready' : 'empty',
  )
  const [cast, setCast] = useState(() => (configured ? [] : local))
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [nonce, setNonce] = useState(0)

  const requestRef = useRef(0)
  const scrollerRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  useEffect(() => {
    setShowAll(false)

    if (!configured) {
      setCast(local)
      setStatus(local.length ? 'ready' : 'empty')
      setError('')
      return undefined
    }

    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setStatus('loading')
    setError('')

    fetchMovieCast({ tmdbId: movie?.tmdbId, title: movie?.title, year: movie?.year })
      .then((result) => {
        if (requestId !== requestRef.current) return
        const real = Array.isArray(result) ? result.filter((member) => member && member.name) : []
        if (real.length) {
          setCast(hydrateProfiles(real, requestId))
          setStatus('ready')
        } else if (local.length) {
          setCast(hydrateProfiles(local, requestId))
          setStatus('ready')
        } else {
          setCast([])
          setStatus('empty')
        }
      })
      .catch((err) => {
        if (requestId !== requestRef.current) return
        setError(err?.message || '')
        if (local.length) {
          setCast(hydrateProfiles(local, requestId))
          setStatus('ready')
        } else {
          setCast([])
          setStatus('error')
        }
      })

    return undefined
    // `identity` covers id/title/year; `nonce` powers Retry.
  }, [identity, configured, nonce]) // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [updateArrows, cast.length, showAll, status])

  function scrollBy(direction) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.85, 240), behavior: 'smooth' })
  }

  /**
   * Fill in headshots for cast members who don't have one yet by searching TMDB
   * per actor name (`/search/person`). Cached in tmdb.js, so each actor is only
   * fetched once per session. Resolved photos are merged back in place; members
   * still without a photo keep the initials fallback. Skipped entirely when
   * TMDB is not configured (fetchActorProfile resolves null anyway).
   */
  function hydrateProfiles(list, requestId) {
    if (!configured || !list.length) return list
    const updates = []
    list.forEach((member, index) => {
      if (!member.profile && member.name) updates.push({ member, index })
    })
    if (!updates.length) return list

    Promise.all(
      updates.map(({ member, index }) =>
        fetchActorProfile(member.name)
          .then((url) => ({ index, url }))
          .catch(() => ({ index, url: null })),
      ),
    ).then((results) => {
      // The user may have navigated to another movie while these were in
      // flight - only merge when this request is still the latest one.
      if (requestRef.current !== requestId) return
      const byIndex = new Map(results.map((result) => [result.index, result]))
      setCast((current) =>
        current.map((member, index) => {
          const found = byIndex.get(index)
          return found && found.url ? { ...member, profile: found.url } : member
        }),
      )
    })

    return list
  }

  if (!movie) return null

  const loading = status === 'loading'
  const hasCast = status === 'ready' && cast.length > 0
  const visible = showAll ? cast : cast.slice(0, INITIAL_VISIBLE)
  const hiddenCount = Math.max(cast.length - INITIAL_VISIBLE, 0)

  return (
    <section className="castSection" aria-label="Cast and crew">
      <div className="castSection__head">
        <div>
          <h2 className="castSection__title">Cast &amp; Crew</h2>
          {hasCast && (
            <p className="castSection__subtitle">
              {cast.length} {cast.length === 1 ? 'person' : 'people'}
              {hiddenCount > 0 && !showAll ? ` \u00b7 showing top ${INITIAL_VISIBLE}` : ''}
            </p>
          )}
        </div>

        <div className="castSection__actions">
          {hasCast && hiddenCount > 0 && (
            <button
              type="button"
              className="castSection__toggle"
              aria-expanded={showAll}
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? 'Show less' : `Show all ${cast.length}`}
            </button>
          )}

          {hasCast && (
            <>
              <button
                type="button"
                className="row__arrow"
                onClick={() => scrollBy(-1)}
                disabled={atStart}
                aria-label="Scroll cast left"
              >
                <ChevronIcon direction="left" size={20} />
              </button>
              <button
                type="button"
                className="row__arrow"
                onClick={() => scrollBy(1)}
                disabled={atEnd}
                aria-label="Scroll cast right"
              >
                <ChevronIcon direction="right" size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <>
          <p className="castSection__status" role="status">
            <span className="spinner" aria-hidden="true" />
            Loading cast&hellip;
          </p>
          <div className="castSection__scroller" aria-hidden="true">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <div className="castCard castCard--row castCard--loading" key={index}>
                <div className="castCard__photo skeleton" />
                <span className="castSkeleton__line skeleton" />
                <span className="castSkeleton__line castSkeleton__line--short skeleton" />
              </div>
            ))}
          </div>
        </>
      )}

      {status === 'empty' && (
        <div className="castSection__empty" role="status">
          <p>Cast information isn&rsquo;t available for this title yet.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="castSection__empty castSection__empty--error" role="alert">
          <p>We couldn&rsquo;t load the cast for this title right now.</p>
          {error && <p className="castSection__errorDetail">{error}</p>}
          <button type="button" className="btn btn--ghost" onClick={() => setNonce((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      {hasCast && (
        <>
          <div className="castSection__scroller" ref={scrollerRef} onScroll={updateArrows}>
            {visible.map((member, index) => (
              <CastCard
                key={`${member.id ?? member.name}-${index}`}
                member={member}
                linkable={configured && member.id != null}
              />
            ))}
          </div>

          {!configured && (
            <p className="castSection__note castSection__note--info" role="status">
              Actor photos come from TMDB. Add your key as <code>VITE_TMDB_API_KEY=...</code> in
              <code>.env</code>, then restart <code>npm run dev</code> to load real w185 headshots.{' '}
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">
                Get a free TMDB API key
              </a>
              .
            </p>
          )}

          {configured && error && (
            <p className="castSection__note castSection__note--error" role="status">
              TMDB credits could not be loaded just now, so the local cast list is shown.
            </p>
          )}
        </>
      )}
    </section>
  )
}

function CastCard({ member, linkable }) {
  const inner = (
    <>
      <div className="castCard__photo">
        <PersonPhoto
          src={member.profile}
          name={member.name}
          alt={member.character ? `${member.name} as ${member.character}` : member.name}
        />
      </div>
      <p className="castCard__name" title={member.name}>
        {member.name}
      </p>
      {member.character && (
        <p className="castCard__role" title={member.character}>
          {member.character}
        </p>
      )}
    </>
  )

  const className = 'castCard castCard--row'

  if (linkable) {
    return (
      <Link to={`/person/${member.id}`} className={className}>
        {inner}
      </Link>
    )
  }

  return (
    <div className={`${className} castCard--static`}>
      {inner}
    </div>
  )
}
