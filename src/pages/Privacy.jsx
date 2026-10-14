import { site } from '../data/site'

export default function Privacy() {
  return (
    <div className="page page--narrow">
      <header className="page__head">
        <span className="picker__eyebrow">Legal</span>
        <h1>Privacy Policy</h1>
        <p className="page__lead">How {site.name} handles your information.</p>
      </header>

      <section className="prose">
        <p className="prose__note">
          Template wording for a demo project - review it with legal counsel before publishing.
        </p>

        <h2>Information we store</h2>
        <p>
          {site.name} does not require an account. Your watchlist and favorites are saved only in
          your own browser using <code>localStorage</code>, under the keys{' '}
          <code>netwebfilx:watchlist</code> and <code>netwebfilx:favorites</code>. This data never
          leaves your device and is cleared when you use the &ldquo;Clear&rdquo; action or clear
          your browser storage.
        </p>

        <h2>Third-party services</h2>
        <p>
          Film metadata, cast information and artwork are provided by{' '}
          <a href={site.tmdb.url} target="_blank" rel="noreferrer noopener">
            {site.tmdb.label}
          </a>{' '}
          when an API key is configured. Requests to TMDB are subject to TMDB&rsquo;s own privacy
          policy and terms. We do not sell your data, and we do not build advertising profiles.
        </p>

        <h2>Cookies and analytics</h2>
        <p>
          The site does not set advertising cookies or run third-party analytics by default. If you
          add analytics to your deployment, update this policy to describe what is collected.
        </p>

        <h2>Your choices</h2>
        <p>
          You can remove saved titles at any time from the <strong>My List</strong> page, or by
          clearing your browser&rsquo;s local storage for this site.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions, email{' '}
          <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>. See the{' '}
          <a href="/about#contact">About Us</a> page for more ways to get in touch.
        </p>
      </section>
    </div>
  )
}
