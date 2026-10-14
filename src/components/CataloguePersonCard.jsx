import { Link } from 'react-router-dom'
import PersonPhoto from './PersonPhoto'
import Poster from './Poster'

/**
 * Person result card for the local catalogue search.
 *
 * Unlike the TMDB `PersonCard` (which links to a `/explorer/person/:id`
 * profile), catalogue people have no profile page - so this card shows the
 * person and the films they worked on directly, each poster linking to the
 * matching `/movie/:id` page. It reuses the shared `.personCard` styles so it
 * lines up with TMDB person cards in the same grid.
 */
export default function CataloguePersonCard({ person }) {
  const list = person.movies || []
  const preview = list.slice(0, 3)
  const remaining = list.length - preview.length
  const label = person.role === 'director' ? 'Director' : 'Actor'

  return (
    <article className="personCard">
      <div className="personCard__photo">
        <PersonPhoto name={person.name} alt={person.name} />
      </div>

      <div className="personCard__body">
        <h3 className="personCard__name">{person.name}</h3>
        <p className="personCard__dept">
          {label}
          {list.length > 0 ? ` · ${list.length} title${list.length === 1 ? '' : 's'}` : ''}
        </p>

        {preview.length > 0 && (
          <>
            <div className="personCard__known">
              {preview.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  className="personCard__mini"
                  title={`${movie.title} (${movie.year ?? 'year unknown'})`}
                  aria-label={`${movie.title} (${movie.year ?? 'year unknown'})`}
                >
                  <Poster movie={movie} alt="" />
                </Link>
              ))}
            </div>

            <ul className="personCard__films">
              {preview.map((movie) => (
                <li key={movie.id}>
                  <Link to={`/movie/${movie.id}`}>{movie.title}</Link>
                  {movie.year ? <span className="personCard__filmYear">{movie.year}</span> : null}
                </li>
              ))}
            </ul>
          </>
        )}

        {remaining > 0 && (
          <p className="personCard__more">
            +{remaining} more title{remaining === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </article>
  )
}
