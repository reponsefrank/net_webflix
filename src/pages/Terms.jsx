import { site } from '../data/site'

export default function Terms() {
  return (
    <div className="page page--narrow">
      <header className="page__head">
        <span className="picker__eyebrow">Legal</span>
        <h1>Terms of Use</h1>
        <p className="page__lead">The ground rules for using {site.name}.</p>
      </header>

      <section className="prose">
        <p className="prose__note">
          Template wording for a demo project - review it with legal counsel before publishing.
        </p>

        <h2>Acceptance</h2>
        <p>
          By using {site.name} you agree to these terms. If you do not agree, please do not use the
          site.
        </p>

        <h2>Use of the service</h2>
        <p>
          {site.name} is provided for personal, non-commercial discovery of films. You agree not to
          misuse the site, attempt to disrupt it, or access it in a way that breaks applicable law.
        </p>

        <h2>Content and attribution</h2>
        <p>
          Movie metadata, cast information and artwork are supplied by{' '}
          <a href={site.tmdb.url} target="_blank" rel="noreferrer noopener">
            {site.tmdb.label}
          </a>
          . {site.tmdb.notice} Poster and image licensing notes for the bundled demo catalogue live
          in <code>public/posters/SOURCES.md</code>.
        </p>

        <h2>No warranty</h2>
        <p>
          The site is provided &ldquo;as is&rdquo; without warranties of any kind. Availability of
          third-party data may change or be interrupted.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the extent permitted by law, {site.name} is not liable for any indirect or incidental
          damages arising from your use of the site.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may be updated from time to time. Continued use of the site after a change
          means you accept the updated terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Email{' '}
          <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
        </p>
      </section>
    </div>
  )
}
