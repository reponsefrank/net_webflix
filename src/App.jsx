import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Browse from './pages/Browse'
import SearchResults from './pages/SearchResults'
import MovieDetail from './pages/MovieDetail'
import TmdbMovieDetail from './pages/TmdbMovieDetail'
import ExplorerPerson from './pages/ExplorerPerson'
import Actors from './pages/Actors'
import MyList from './pages/MyList'
import Favorites from './pages/Favorites'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import TvShows from './pages/TvShows'
import SeriesDetail from './pages/SeriesDetail'
import NotFound from './pages/NotFound'
import { getMovieById } from './data/movies'

/** Keep old `/explorer/person/:id` links working by forwarding to the actor page. */
function PersonRedirect() {
  const { id } = useParams()
  return <Navigate to={`/person/${id}`} replace />
}

/**
 * `/movie/:id` serves both worlds: a local catalogue slug renders the offline
 * `MovieDetail`, while a TMDB numeric id renders the TMDB `TmdbMovieDetail`.
 * Every poster on the site links here.
 */
function MovieRoute() {
  const { id } = useParams()
  return getMovieById(id) ? <MovieDetail /> : <TmdbMovieDetail />
}

/** Forward legacy `/explorer/movie/:id` links to the unified movie page. */
function MovieRedirect() {
  const { id } = useParams()
  return <Navigate to={`/movie/${id}`} replace />
}

export default function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Navbar />
      <main className="app__main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Browse />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/movie/:id" element={<MovieRoute />} />
          {/* The Movie Night page no longer exists: send old links to Series. */}
          <Route path="/movie-night" element={<Navigate to="/tv-shows" replace />} />
          <Route path="/actors" element={<Actors />} />
          <Route path="/person/:id" element={<ExplorerPerson />} />
          {/* The Explorer landing page no longer exists: send old links home. */}
          <Route path="/explorer" element={<Navigate to="/" replace />} />
          <Route path="/explorer/person/:id" element={<PersonRedirect />} />
          <Route path="/explorer/movie/:id" element={<MovieRedirect />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/favorites" element={<Favorites />} />
          {/* The My Playlist page no longer exists: send old links home. */}
          <Route path="/playlist" element={<Navigate to="/" replace />} />
          <Route path="/people" element={<Navigate to="/actors" replace />} />
          <Route path="/tv-shows" element={<TvShows />} />
          <Route path="/tv/:id" element={<SeriesDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
