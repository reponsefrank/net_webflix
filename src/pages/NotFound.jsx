import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page">
      <div className="empty empty--big">
        <span className="empty__code">404</span>
        <h2>We lost the signal</h2>
        <p>That page or film is not in the netwebfilx catalogue.</p>
        <div className="empty__actions">
          <Link to="/" className="btn btn--primary">
            Back home
          </Link>
          <Link to="/movies" className="btn btn--ghost">
            Browse movies
          </Link>
        </div>
      </div>
    </div>
  )
}
