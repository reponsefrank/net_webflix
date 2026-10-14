import { Link } from 'react-router-dom'
import { genres } from '../data/movies'
import { site, telHref } from '../data/site'
import SocialLinks from './SocialLinks'

/** Site footer: about, contact, navigation, legal links and TMDB attribution. */
export default function Footer() {
  const { email, phone, location } = site.contact

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Link to="/" className="footer__logo" aria-label="netwebfilx home">
            netweb<span>filx</span>
          </Link>
          <p>{site.about}</p>

          <SocialLinks />
        </div>

        <nav className="footer__col" aria-label="Browse">
          <h4>Browse</h4>
          <ul>
            <li>
              <Link to="/movies">Movies</Link>
            </li>
            <li>
              <Link to="/tv-shows">Series</Link>
            </li>
            <li>
              <Link to="/actors">Actors</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>
          </ul>
        </nav>

        <nav className="footer__col" aria-label="Company">
          <h4>Company</h4>
          <ul>
            <li>
              <Link to="/about#contact">Contact Us</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms">Terms of Use</Link>
            </li>
            <li>
              <Link to="/my-list">My List</Link>
            </li>
          </ul>
        </nav>

        <div className="footer__col footer__contact">
          <h4>Contact Us</h4>
          <ul>
            <li>
              <a href={`mailto:${email}`}>{email}</a>
            </li>
            <li>
              <a href={telHref(phone)}>{phone}</a>
            </li>
            <li>
              <span>{location}</span>
            </li>
          </ul>
        </div>

        <nav className="footer__col" aria-label="Genres">
          <h4>Genres</h4>
          <ul>
            {genres.slice(0, 6).map((genre) => (
              <li key={genre}>
                <Link to={`/movies?genre=${encodeURIComponent(genre)}`}>{genre}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="footer__bottom">
        <div className="footer__legal">
          <span>
            &copy; {new Date().getFullYear()} {site.name}
          </span>
          <span className="footer__sep" aria-hidden="true">
            &middot;
          </span>
          <Link to="/privacy">Privacy</Link>
          <span className="footer__sep" aria-hidden="true">
            &middot;
          </span>
          <Link to="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
