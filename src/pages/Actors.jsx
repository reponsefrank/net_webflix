import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PaginatedGrid from '../components/PaginatedGrid'
import PersonCard from '../components/PersonCard'
import { SearchIcon } from '../components/icons'
import { getPopularPeople, isTmdbConfigured, searchPeopleByName } from '../lib/tmdb'

const SKELETON_COUNT = 10
const DEBOUNCE_MS = 400

/** A grid of `personCard` placeholders while the first page loads. */
function PeopleSkeleton(count = SKELETON_COUNT) {
  return (
    <div className="grid grid--people" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="personCard personCard--skeleton" key={index}>
          <div className="skeleton personCard--skeleton__photo" />
          <div className="personCard__body">
            <span className="skeleton castSkeleton__line" />
            <span className="skeleton castSkeleton__line castSkeleton__line--short" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Actors page.
 *
 * With no query it shows TMDB's popular people (`/person/popular`). Typing runs
 * a debounced name search (`/search/person`, 400ms after the last keystroke) so
 * we only hit the API once the user pauses.
 *
 * Both modes are handed to the shared `PaginatedGrid`, so the same centered red
 * "Load More" button appends the next page of actors below the current ones,
 * de-duplicated by id, and resets to page 1 whenever the search text changes.
 * Each card links to `/person/:id`.
 */
export default function Actors() {
  const configured = isTmdbConfigured()
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [count, setCount] = useState(0)

  // Debounce typing: wait for a pause, then commit the query (which resets the
  // results grid back to page 1 through `resetKey`).
  useEffect(() => {
    const handle = setTimeout(() => setActiveQuery(query.trim()), DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [query])

  const searching = Boolean(activeQuery)

  if (!configured) {
    return (
      <div className="page">
        <header className="page__head">
          <span className="picker__eyebrow">People</span>
          <h1>Actors</h1>
        </header>
        <div className="empty">
          <h2>Actors need a TMDB key</h2>
          <p>
            This list is powered by TMDB. Add <code>VITE_TMDB_API_KEY</code> to your{' '}
            <code>.env</code> file and restart the dev server to load it.
          </p>
          <div className="empty__actions">
            <Link to="/movies" className="btn btn--primary">
              Browse movies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page__head">
        <span className="picker__eyebrow">People</span>
        <h1>Actors</h1>
        <p className="page__lead">
          Search for an actor by name, or browse who is popular on TMDB right now. Open a profile
          for their biography and best-known films.
        </p>
      </header>

      <form className="actors__search" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="actors__searchRow">
          <SearchIcon size={17} />
          <label className="sr-only" htmlFor="actors-query">
            Search actors by name
          </label>
          <input
            id="actors-query"
            type="search"
            value={query}
            placeholder="Search actors by name…"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button
              type="button"
              className="actors__clear"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              &times;
            </button>
          )}
        </div>
      </form>

      <div className="actors__resultsHead">
        <h2>{searching ? `Results for “${activeQuery}”` : 'Popular actors'}</h2>
        {count > 0 && <span className="actors__count">{count} shown</span>}
      </div>

      <PaginatedGrid
        resetKey={activeQuery}
        loadPage={(page) =>
          activeQuery ? searchPeopleByName(activeQuery, page) : getPopularPeople(page)
        }
        renderItem={(person) => <PersonCard person={person} />}
        gridClassName="grid grid--people"
        renderSkeleton={PeopleSkeleton}
        doneLabel="No more actors"
        emptyState={
          <div className="empty">
            <h2>No actors found</h2>
            <p>Nothing matched “{activeQuery}”. Try a different name.</p>
          </div>
        }
        onLoaded={(items) => setCount(items.length)}
      />
    </div>
  )
}
