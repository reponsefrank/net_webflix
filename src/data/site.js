/**
 * Site-wide configuration for netwebfilx.
 *
 * Contact details default to the values below and stay configurable: set the
 * matching `VITE_*` variables in a `.env` file (next to `package.json`) to
 * override them (e.g. when publishing to production).
 *
 *   VITE_CONTACT_EMAIL=reponsefrank88@gmail.com
 *   VITE_CONTACT_PHONE=0792183063
 *   VITE_CONTACT_LOCATION=London, United Kingdom
 */

/** Return the configured value, or a fallback when it is missing/blank. */
function configured(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export const site = {
  name: 'Net Web Flix',
  shortName: 'netwebfilx',
  tagline: 'Movies, everywhere.',
  about:
    'Net Web Flix is a cinematic home for movie lovers. Browse a curated film catalogue, explore trending and top-rated TV series, and meet the real cast and crew behind every title.',
  contact: {
    email: configured(import.meta.env.VITE_CONTACT_EMAIL, 'reponsefrank88@gmail.com'),
    phone: configured(import.meta.env.VITE_CONTACT_PHONE, '0792183063'),
    location: configured(import.meta.env.VITE_CONTACT_LOCATION, 'Your City, Country'),
  },
  social: [
    { id: 'x', label: 'X (Twitter)', href: 'https://x.com/' },
    { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/' },
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/' },
    { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/' },
  ],
  tmdb: {
    label: 'The Movie Database (TMDB)',
    url: 'https://www.themoviedb.org/',
    // TMDB's required attribution wording for API consumers.
    notice: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
  },
}

/** Build a safe `tel:` href from a human-formatted phone number. */
export function telHref(phone) {
  return `tel:${String(phone).replace(/[^+\d]/g, '')}`
}
