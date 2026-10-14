/**
 * Artwork generator.
 *
 * netwebfilx does not depend on remote images, so posters and backdrops are
 * generated locally as SVG data URIs. The colours are derived from the movie
 * title, which means every film always gets the same artwork and the site
 * works fully offline.
 */

function hash(text) {
  const value = String(text ?? '')
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Break a title into lines of at most `max` characters. */
function wrapTitle(title, max) {
  const words = title.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length > max && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 4)
}

/**
 * Media type for generated artwork.
 *
 * `data:image/svg+xml;charset=utf-8,` is the correct form; the older shorthand
 * `;utf8,` is not a real parameter, so browsers have to guess the encoding.
 */
const SVG_DATA_URI_PREFIX = 'data:image/svg+xml;charset=utf-8,'

/**
 * HTML entities that are not defined in XML.
 *
 * Browsers decode `data:image/svg+xml` with a strict XML parser, and XML only
 * predefines five named entities: `&amp; &lt; &gt; &quot; &apos;`. Any other
 * named entity is a fatal parse error - the image silently fails to load and
 * the poster renders as an empty box. HTML-only entities (which are easy to
 * paste into SVG text by accident) are therefore rewritten as numeric
 * character references, which are always valid in XML.
 */
const HTML_ENTITY_CODES = {
  nbsp: 160,
  iexcl: 161,
  cent: 162,
  pound: 163,
  yen: 165,
  sect: 167,
  copy: 169,
  laquo: 171,
  reg: 174,
  deg: 176,
  plusmn: 177,
  middot: 183,
  raquo: 187,
  frac12: 189,
  times: 215,
  divide: 247,
  ndash: 8211,
  mdash: 8212,
  lsquo: 8216,
  rsquo: 8217,
  ldquo: 8220,
  rdquo: 8221,
  bull: 8226,
  hellip: 8230,
  trade: 8482,
}

/** Rewrite HTML-only named entities as XML-safe numeric references. */
function toXmlSafe(svg) {
  return svg.replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, name) => {
    const code = HTML_ENTITY_CODES[name]
    return code ? `&#${code};` : match
  })
}

/**
 * Encode an SVG string as a data URI that browsers will actually parse.
 * Every generator in this file must go through here.
 */
function svgDataUri(svg) {
  return SVG_DATA_URI_PREFIX + encodeURIComponent(toXmlSafe(svg))
}

function palette(seed) {
  const base = hash(seed) % 360
  return {
    from: `hsl(${base} 62% 26%)`,
    to: `hsl(${(base + 42) % 360} 68% 12%)`,
    accent: `hsl(${(base + 18) % 360} 88% 62%)`,
  }
}

/** A tall 2:3 poster with the title set over a generated gradient. */
export function makePoster(movie, width = 400, height = 600) {
  const title = String(movie?.title ?? 'Untitled')
  const { from, to, accent } = palette(title)
  const lines = wrapTitle(title, 14)
  const fontSize = lines.length > 2 ? 34 : 42
  const startY = height * 0.6
  const text = lines
    .map(
      (line, i) =>
        `<tspan x="32" dy="${i === 0 ? 0 : fontSize * 1.12}">${escapeXml(line)}</tspan>`,
    )
    .join('')
  const seed = hash(movie?.id ?? title)
  const primaryGenre =
    Array.isArray(movie.genres) && movie.genres.length > 0 ? movie.genres[0] : 'Feature'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)} poster">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.7" cy="0.2" r="0.8">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0.35" x2="0" y2="1">
      <stop offset="0%" stop-color="#05050a" stop-opacity="0"/>
      <stop offset="100%" stop-color="#05050a" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${width * 0.72}" cy="${height * 0.22}" r="${90 + (seed % 70)}" fill="url(#glow)"/>
  <path d="M0 ${height * 0.42} L${width} ${height * 0.3} L${width} ${height * 0.52} L0 ${height * 0.64} Z" fill="#ffffff" opacity="0.05"/>
  <path d="M0 ${height * 0.5} L${width} ${height * 0.38} L${width} ${height * 0.45} L0 ${height * 0.57} Z" fill="#ffffff" opacity="0.04"/>
  <rect width="${width}" height="${height}" fill="url(#fade)"/>
  <text x="32" y="46" font-family="Verdana, Geneva, sans-serif" font-size="15" letter-spacing="3" fill="#ffffff" opacity="0.72">NETWEBFILX</text>
  <circle cx="${width - 44}" cy="${44}" r="13" fill="none" stroke="${accent}" stroke-width="2" opacity="0.85"/>
  <path d="M${width - 49} 37 L${width - 37} 44 L${width - 49} 51 Z" fill="${accent}"/>
  <text x="32" y="${startY}" font-family="Verdana, Geneva, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff">${text}</text>
  <text x="32" y="${startY + fontSize * (lines.length * 1.12 + 0.6)}" font-family="Verdana, Geneva, sans-serif" font-size="17" fill="#ffffff" opacity="0.7">${movie.year} &#183; ${escapeXml(primaryGenre)}</text>
</svg>`

  return svgDataUri(svg)
}

/** A wide 16:9 backdrop used behind the hero and detail headers. */
export function makeBackdrop(movie, width = 1600, height = 900) {
  const title = String(movie?.title ?? 'Untitled')
  const { from, to, accent } = palette(title)
  const seed = hash(movie?.id ?? title)
  const rings = [0, 1, 2]
    .map((i) => {
      const r = 150 + i * 90 + (seed % 50)
      return `<circle cx="${width * 0.24}" cy="${height * 0.46}" r="${r}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="${0.28 - i * 0.07}"/>`
    })
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.22" cy="0.44" r="0.6">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  ${rings}
  <path d="M0 ${height * 0.72} L${width * 0.55} ${height * 0.44} L${width} ${height * 0.66} L${width} ${height} L0 ${height} Z" fill="#05050a" opacity="0.45"/>
  <path d="M0 ${height * 0.86} L${width * 0.4} ${height * 0.62} L${width} ${height * 0.82} L${width} ${height} L0 ${height} Z" fill="#05050a" opacity="0.6"/>
</svg>`

  return svgDataUri(svg)
}

/**
 * Minimal, deliberately boring fallback poster.
 *
 * Used when a poster image fails to load - a remote `movie.poster` that 404s,
 * or a browser that refuses the generated artwork. It shares nothing with
 * `makePoster` except the data URI encoder, so a bug in the main generator can
 * never take the fallback down with it. Text is ASCII only and escaped.
 */
export function makeFallbackPoster(movie, width = 400, height = 600) {
  const title = String(movie?.title ?? 'Untitled')
  const lines = wrapTitle(title, 14)
  const fontSize = lines.length > 2 ? 32 : 40
  const startY = height * 0.52
  const text = lines
    .map(
      (line, i) =>
        `<tspan x="${width / 2}" dy="${i === 0 ? 0 : fontSize * 1.14}">${escapeXml(line)}</tspan>`,
    )
    .join('')

  // Film-strip perforations down both edges.
  const holes = []
  for (let y = 44; y < height - 60; y += 46) {
    holes.push(`<rect x="14" y="${y}" width="11" height="24" rx="4" fill="#000000" opacity="0.5"/>`)
    holes.push(
      `<rect x="${width - 25}" y="${y}" width="11" height="24" rx="4" fill="#000000" opacity="0.5"/>`,
    )
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)} poster">
  <defs>
    <linearGradient id="fallbackBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1d1d27"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </linearGradient>
    <radialGradient id="fallbackGlow" cx="0.5" cy="0.08" r="0.75">
      <stop offset="0%" stop-color="#e50914" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#e50914" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#fallbackBg)"/>
  <rect width="${width}" height="${height}" fill="url(#fallbackGlow)"/>
  ${holes.join('\n  ')}
  <rect x="0" y="0" width="${width}" height="4" fill="#e50914"/>
  <circle cx="${width / 2}" cy="${height * 0.28}" r="36" fill="#e50914" opacity="0.92"/>
  <path d="M${width / 2 - 11} ${height * 0.28 - 15} L${width / 2 + 16} ${height * 0.28} L${width / 2 - 11} ${height * 0.28 + 15} Z" fill="#ffffff"/>
  <text x="${width / 2}" y="${startY}" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff">${text}</text>
  <text x="${width / 2}" y="${startY + fontSize * (lines.length * 1.14 + 0.9)}" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="12" letter-spacing="2.5" fill="#8b8b9e">ARTWORK UNAVAILABLE</text>
</svg>`

  return svgDataUri(svg)
}
