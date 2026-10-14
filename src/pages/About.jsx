import { Link } from 'react-router-dom'
import { site, telHref } from '../data/site'
import SocialLinks from '../components/SocialLinks'

export default function About() {
  const { email, phone, location } = site.contact

  return (
    <div className="page page--narrow">
      <header className="page__head">
        <span className="picker__eyebrow">About</span>
        <h1>About {site.name}</h1>
        <p className="page__lead">{site.about}</p>
      </header>

      <section className="prose" aria-labelledby="about-do">
        <h2 id="about-do">What you can do here</h2>
        <ul>
          <li>Browse a curated film catalogue with posters, ratings and genres.</li>
          <li>Open any title for its synopsis, cast &amp; crew and similar films.</li>
          <li>Save films to <strong>My List</strong> and keep favorites for later.</li>
          <li>Explore trending, top-rated and on-the-air <strong>TV series</strong>.</li>
          <li>Search the wider TMDB catalogue through the Explorer.</li>
        </ul>

        <h2>How it is built</h2>
        <p>
          {site.name} is a React single-page app built with Vite and React Router. Browse titles,
          cast, and artwork are enriched with data from {site.tmdb.label} whenever an API key is
          configured, and fall back to a bundled demo catalogue when it is not, so the site works
          offline.
        </p>
      </section>

      <section className="prose" id="contact" aria-labelledby="about-contact">
        <h2 id="about-contact">Contact Us</h2>
        <p>
          Questions, feedback, or a licensing request? Reach the team through any of the details
          below and we will get back to you.
        </p>

        <ul className="contactList">
          <li>
            <span className="contactList__label">Email</span>
            <a href={`mailto:${email}`}>{email}</a>
          </li>
          <li>
            <span className="contactList__label">Phone</span>
            <a href={telHref(phone)}>{phone}</a>
          </li>
          <li>
            <span className="contactList__label">Location</span>
            <span>{location}</span>
          </li>
        </ul>

        <h3>Follow along</h3>
        <SocialLinks />
      </section>

      <p className="prose__actions">
        <Link to="/movies" className="btn btn--primary">
          Browse movies
        </Link>
        <Link to="/actors" className="btn btn--ghost">
          Browse Actors
        </Link>
      </p>
    </div>
  )
}
