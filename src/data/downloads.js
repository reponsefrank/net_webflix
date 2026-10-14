/**
 * Download sources manifest.
 *
 * This is the ONLY place download capabilities are declared, keyed by the
 * local catalogue movie id (src/data/movies.js) - never derived from a title
 * hash or guessed from the file name. A film is downloadable only when an
 * operator has added a real, authorized source here:
 *
 *   'inception': {
 *     // Optional official provider (store / rental / streaming) - opened in a
 *     // new tab. This is not a direct file, just the official page.
 *     provider: { name: 'iTunes Store', url: 'https://...' },
 *     // Optional direct, authorized files. Everything is displayed as given.
 *     files: [
 *       {
 *         quality: '1080p',
 *         size: '5.2 GB',
 *         format: 'MP4',
 *         url: 'https://.../inception-1080p.mp4',   // real authorized file URL
 *         streamable: true, // true => progress via fetch; false => native <a download>
 *       },
 *     ],
 *   },
 *
 * The manifest ships empty on purpose: this demo catalogue has no licensed
 * video files, so every title shows the graceful "not available" state and NO
 * fake download link is ever rendered. Add real sources above to activate the
 * feature per title.
 */

export const DOWNLOAD_SOURCES = {}

/**
 * Resolve the declared download source for a movie, or null when the film has
 * no authorized source of any kind.
 */
export function getDownloadSource(movie) {
  if (!movie) return null
  const source = DOWNLOAD_SOURCES[movie.id]
  if (!source) return null
  const files = Array.isArray(source.files) ? source.files : []
  return {
    provider: source.provider || null,
    files: files.filter((file) => file && file.url),
    demo: false,
  }
}

/**
 * Demo-only hook so the download UI states can be previewed without a real
 * licensed file: open /movie/oppenheimer?demo=download (or any detail/card).
 * The demo source has no URL and always ends in an honest "no file attached"
 * error state - it never fakes a completed download.
 */
export function isDownloadDemoEnabled() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('demo') === 'download'
}

export function getDemoDownloadSource(movie) {
  return {
    provider: null,
    demo: true,
    files: [
      {
        quality: '1080p',
        size: '—',
        format: 'Demo',
        url: null, // deliberately no file
      },
    ],
  }
}

/** A safe file name like "Inception (1080p).mp4". */
export function buildDownloadFileName(movie, file) {
  const base = String(movie.title || 'download')
    .replace(/[\\/:*?"<>|]+/g, '')
    .trim()
  const ext = String(file.format || 'mp4').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'mp4'
  return `${base} (${file.quality || 'video'}).${ext}`
}

/** Human-readable label for a download status. */
export const DOWNLOAD_STATUS_LABELS = {
  unavailable: 'Not available',
  downloading: 'Downloading',
  complete: 'Complete',
  error: 'Failed',
  provider: 'Opened provider',
}