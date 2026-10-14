import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { CloseIcon, MenuIcon, SearchIcon } from './icons'
import { useWatchlist } from '../context/WatchlistContext'
import { useFavorites } from '../context/FavoritesContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { ids } = useWatchlist()
  const { favorites } = useFavorites()

  const activeQuery = searchParams.get('q') ?? ''

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setQuery(activeQuery)
  }, [activeQuery])

  function submitSearch(event) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    setMobileOpen(false)
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const linkClass = ({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`

  return (
    <header className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <button
          type="button"
          className="nav__burger"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <Link to="/" className="nav__brand" onClick={() => setMobileOpen(false)}>
          netweb<span>filx</span>
        </Link>

        <nav className={`nav__links${mobileOpen ? ' nav__links--open' : ''}`}>
          <NavLink to="/" end className={linkClass} onClick={() => setMobileOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/movies" className={linkClass} onClick={() => setMobileOpen(false)}>
            Movies
          </NavLink>
          <NavLink to="/tv-shows" className={linkClass} onClick={() => setMobileOpen(false)}>
            Series
          </NavLink>
          <NavLink to="/actors" className={linkClass} onClick={() => setMobileOpen(false)}>
            Actors
          </NavLink>
          <NavLink to="/my-list" className={linkClass} onClick={() => setMobileOpen(false)}>
            My List
            {ids.length > 0 && <span className="nav__badge">{ids.length}</span>}
          </NavLink>
          <NavLink to="/favorites" className={linkClass} onClick={() => setMobileOpen(false)}>
            Favorites
            {favorites.length > 0 && <span className="nav__badge">{favorites.length}</span>}
          </NavLink>
        </nav>

        <form className="nav__search" role="search" onSubmit={submitSearch}>
          <SearchIcon size={17} />
          <input
            type="search"
            value={query}
            placeholder="Search movies, genres, actors"
            aria-label="Search movies"
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>

        <Link to="/movie/oppenheimer" className="nav__avatar" title="Profile">
          NF
        </Link>
      </div>
    </header>
  )
}
