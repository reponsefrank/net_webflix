import { useEffect, useRef, useState } from 'react'
import { getWatchProviders, isTmdbConfigured, resolveTmdbMovieId } from '../lib/tmdb'

/** Provider groups, in the order a viewer cares about them. */
const GROUPS = [
  ['flatrate', 'Stream'],
  ['free', 'Free'],
  ['ads', 'Free with ads'],
  ['rent', 'Rent'],
  ['buy', 'Buy'],
]

/**
 * "Where to watch" panel - the honest fallback when a title has no legal video
 * file in `src/data/playable.js`. It lists TMDB's `/watch/providers` results
 * (JustWatch), grouped into Stream / Free / Rent / Buy, each linking to the
 * official provider page.
 *
 * Accepts either a TMDB id (`mediaType` + `tmdbId`) or, for local catalogue
 * titles without one, a `title`/`year` that is resolved to a TMDB id first.
 * Handles loading, error and "not available in this region" states.
 */
export default function WhereToWatch({
  mediaType = 'movie',
  tmdbId = null,
  title = '',
  year = null,
  region = 'US',
}) {
  const configured = isTmdbConfigured()
  const [state, setState] = useState(() => ({
    status: configured ? 'loading' : 'unconfigured',
    data: null,
    error: '',
  }))
  const [nonce, setNonce] = useState(0)
  const requestRef = useRef(0)

  useEffect(() => {
    if (!configured) {
      setState({ status: 'unconfigured', data: null, error: '' })
      return undefined
    }
    if (tmdbId == null && !title) {
      setState({ status: 'empty', data: null, error: '' })
      return undefined
    }

    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setState({ status: 'loading', data: null, error: '' })

    const idPromise =
      tmdbId != null ? Promise.resolve(tmdbId) : resolveTmdbMovieId(title, year)

    idPromise
      .then((resolvedId) => {
        if (resolvedId == null) return null
        return getWatchProviders({ mediaType, tmdbId: resolvedId, region })
      })
      .then((data) => {
        if (requestId !== requestRef.current) return
        if (!data) {
          setState({ status: 'empty', data: null, error: '' })
          return
        }
        setState({ status: 'ready', data, error: '' })
      })
      .catch((error) => {
        if (requestId !== requestRef.current) return
        setState({ status: 'error', data: null, error: error?.message || '' })
      })

    return undefined
  }, [configured, mediaType, tmdbId, title, year, region, nonce])

  const hasProviders =
    state.data &&
    GROUPS.some(([key]) => (state.data[key] || []).length > 0)

  return (
    <section className="whereToWatch" aria-label="Where to watch">
      <div className="whereToWatch__head">
        <h2 className="whereToWatch__title">Where to watch</h2>
        <p className="whereToWatch__lead">
          No free full-length copy is available on Net Web Flix for this title yet. These are the
          official services that carry it.
        </p>
      </div>

      {state.status === 'loading' ? (
        <p className="whereToWatch__status">
          <span className="whereToWatch__spinner" aria-hidden="true" />
          Looking up streaming options…
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className="whereToWatch__status whereToWatch__status--error">
          <span>Could not load streaming options right now.</span>
          <button type="button" className="btn btn--ghost" onClick={() => setNonce((n) => n + 1)}>
            Retry
          </button>
        </div>
      ) : null}

      {state.status === 'unconfigured' ? (
        <p className="whereToWatch__status">
          Streaming options need a TMDB API key (add <code>VITE_TMDB_API_KEY</code> to{' '}
          <code>.env</code>).
        </p>
      ) : null}

      {state.status === 'ready' && !hasProviders ? (
        <p className="whereToWatch__status">
          No streaming, rental or purchase options are listed in {region} right now.
          {state.data?.link ? (
            <>
              {' '}
              <a href={state.data.link} target="_blank" rel="noreferrer">
                Check TMDB
              </a>
              .
            </>
          ) : null}
        </p>
      ) : null}

      {state.status === 'ready' && hasProviders ? (
        <div className="whereToWatch__groups">
          {GROUPS.map(([key, label]) => {
            const providers = state.data[key] || []
            if (!providers.length) return null
            return (
              <div className="whereToWatch__group" key={key}>
                <span className="whereToWatch__groupLabel">{label}</span>
                <ul className="whereToWatch__providers">
                  {providers.map((provider) => (
                    <li key={`${key}-${provider.id}`}>
                      <a
                        className="whereToWatch__provider"
                        href={state.data.link || '#'}
                        target="_blank"
                        rel="noreferrer"
                        title={`${provider.name} (${label})`}
                      >
                        {provider.logo ? (
                          <img src={provider.logo} alt="" loading="lazy" />
                        ) : (
                          <span className="whereToWatch__providerFallback" aria-hidden="true">
                            {provider.name.slice(0, 1)}
                          </span>
                        )}
                        <span>{provider.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          <p className="whereToWatch__credit">
            Data from TMDB / JustWatch{state.data?.link ? (
              <>
                {' · '}
                <a href={state.data.link} target="_blank" rel="noreferrer">
                  See all options
                </a>
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </section>
  )
}
