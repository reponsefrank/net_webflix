import { Link } from 'react-router-dom'
import PersonPhoto from './PersonPhoto'
import Poster from './Poster'

/**
 * Person result card for the Explorer: photo, name, department, and a strip of
 * their known-for titles. Links to the TMDB-driven person page.
 */
export default function PersonCard({ person }) {
  return (
    <article className="personCard">
      <Link
        to={`/person/${person.tmdbId}`}
        className="personCard__photo"
        aria-label={`View ${person.name}'s profile`}
      >
        <PersonPhoto src={person.profile} name={person.name} />
      </Link>

      <div className="personCard__body">
        <h3 className="personCard__name">
          <Link to={`/person/${person.tmdbId}`}>{person.name}</Link>
        </h3>
        {person.department && <p className="personCard__dept">{person.department}</p>}

        {person.knownFor.length > 0 && (
          <>
            <div className="personCard__known">
              {person.knownFor.slice(0, 3).map((movie) => (
                <Link
                  key={movie.tmdbId}
                  to={`/movie/${movie.tmdbId}`}
                  className="personCard__mini"
                  title={movie.title}
                  aria-label={`${movie.title} (${movie.year ?? 'year unknown'})`}
                >
                  <Poster movie={movie} alt="" />
                </Link>
              ))}
            </div>

            <ul className="personCard__films">
              {person.knownFor.slice(0, 3).map((movie) => (
                <li key={movie.tmdbId}>
                  <Link to={`/movie/${movie.tmdbId}`}>{movie.title}</Link>
                  {movie.year ? <span className="personCard__filmYear">{movie.year}</span> : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </article>
  )
}