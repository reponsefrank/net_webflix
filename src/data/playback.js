/**
 * Playback sources manifest.
 *
 * This is the ONLY place a playable video source is declared, keyed by the
 * local catalogue movie id (src/data/movies.js). It exists so an operator can
 * play a video they own or are licensed to use (their own CDN file, an
 * approved distributor stream, etc.) directly in the in-page player:
 *
 *   'inception': {
 *     label: 'Licensed stream',              // shown in the player footer
 *     // Optional poster override; falls back to the film backdrop/poster.
 *     poster: 'https://.../inception.jpg',
 *     // One or more files. The first is used; the rest are alternates that
 *     // the browser can pick from by <source> type.
 *     sources: [
 *       { url: 'https://.../inception-1080p.mp4', type: 'video/mp4', quality: '1080p' },
 *       { url: 'https://.../inception-720p.webm', type: 'video/webm', quality: '720p' },
 *     ],
 *   },
 *
 * The manifest ships empty on purpose: the demo catalogue ships no licensed
 * video files, so "Play" falls back to the official TMDB trailer and, when
 * there is neither, an honest "no video available" message. Nothing is ever
 * guessed from a title, a poster, a movie id or trailer metadata.
 */

export const PLAY_SOURCES = {}

/**
 * Resolve the licensed play source for a movie, or null when the film has no
 * declared playable file of its own.
 */
export function getPlaySource(movie) {
  if (!movie) return null
  const entry = PLAY_SOURCES[movie.id]
  if (!entry) return null

  const raw = Array.isArray(entry.sources) ? entry.sources : [entry]
  const sources = raw
    .filter((source) => source && source.url)
    .map((source) => ({
      url: source.url,
      type: source.type || 'video/mp4',
      quality: source.quality || '',
      label: source.label || '',
    }))

  if (!sources.length) return null

  return {
    sources,
    url: sources[0].url,
    type: sources[0].type,
    quality: sources[0].quality,
    label: entry.label || 'Licensed source',
    poster: entry.poster || movie.backdrop || movie.poster || null,
    demo: false,
  }
}

/**
 * Demo-only hook so the HTML5 `<video>` player path can be exercised without a
 * real licensed file: open /movie/inception?demo=play. It uses the repo's own
 * generated sample clip (public/videos/sample-clip.mp4) and is always labelled
 * as a demo sample - it is NOT the film.
 */
export function isPlayDemoEnabled() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('demo') === 'play'
}

export function getDemoPlaySource(movie) {
  return {
    sources: [{ url: '/videos/sample-clip.mp4', type: 'video/mp4', quality: 'Sample', label: '' }],
    url: '/videos/sample-clip.mp4',
    type: 'video/mp4',
    quality: 'Sample',
    label: 'Demo sample clip',
    poster: movie?.backdrop || movie?.poster || null,
    demo: true,
  }
}
