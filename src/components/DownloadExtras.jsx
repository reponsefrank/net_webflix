import { useCallback, useState } from 'react'
import { makePoster } from '../lib/artwork'
import { CheckIcon, DownloadIcon, InfoIcon } from './icons'

/**
 * A real, locally generated placeholder clip (public/videos/sample-clip.mp4).
 * It exists so the video download flow can be exercised end to end; it is NOT
 * a copy of any film and is always labelled as a sample.
 */
const SAMPLE_CLIP = {
  url: '/videos/sample-clip.mp4',
  fileName: 'netwebfilx sample clip.mp4',
}

const IDLE = { status: 'idle', message: null }

/** Trigger a browser save for a Blob, then release the object URL. */
function saveBlob(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
}

/** Best-effort file extension for a poster URL or data URI. */
function posterExtension(url) {
  if (!url) return 'jpg'
  if (url.startsWith('data:image/svg')) return 'svg'
  if (url.startsWith('data:image/png')) return 'png'
  if (url.startsWith('data:image/jpeg')) return 'jpg'
  const clean = url.split('?')[0].split('#')[0]
  const match = /\.([a-z0-9]+)$/i.exec(clean)
  return match ? match[1].toLowerCase() : 'jpg'
}

/** Strip characters Windows/macOS reject in file names. */
function safeName(title) {
  return String(title || 'movie').replace(/[\\/:*?"<>|]+/g, '').trim() || 'movie'
}

/** The portable "movie details" document saved by the Details button. */
function detailsFor(movie) {
  return {
    title: movie.title ?? null,
    year: movie.year ?? null,
    rating: movie.rating ?? null,
    runtimeMinutes: movie.runtime ?? null,
    genres: movie.genres ?? [],
    director: movie.director ?? null,
    cast: movie.cast ?? [],
    tagline: movie.tagline ?? null,
    overview: movie.overview ?? null,
    language: movie.language ?? null,
    country: movie.country ?? null,
    savedFrom: 'netwebfilx',
  }
}

/**
 * Always-available downloads for a title.
 *
 * These are real files built from data the app already has - the poster image
 * and a plain-text/JSON record of the film's details - so the Download area is
 * useful even when a title has no authorized video source. They never pretend
 * to be a copy of the film itself.
 */
export default function DownloadExtras({ movie }) {
  const [state, setState] = useState({ poster: IDLE, details: IDLE })
  const set = useCallback((key, patch) => {
    setState((current) => ({ ...current, [key]: { ...IDLE, ...current[key], ...patch } }))
  }, [])

  const downloadPoster = useCallback(async () => {
    const source = movie.poster || makePoster(movie)
    const fileName = `${safeName(movie.title)} (poster).${posterExtension(source)}`
    set('poster', { status: 'downloading', message: null })
    try {
      const response = await fetch(source)
      if (!response.ok) throw new Error(`The image responded with ${response.status}.`)
      saveBlob(await response.blob(), fileName)
      set('poster', { status: 'complete', message: null })
    } catch (error) {
      set('poster', { status: 'error', message: error?.message || 'Could not save the poster.' })
    }
  }, [movie, set])

  const downloadDetails = useCallback(() => {
    set('details', { status: 'downloading', message: null })
    try {
      const json = JSON.stringify(detailsFor(movie), null, 2)
      saveBlob(new Blob([json], { type: 'application/json' }), `${safeName(movie.title)} (details).json`)
      set('details', { status: 'complete', message: null })
    } catch (error) {
      set('details', { status: 'error', message: error?.message || 'Could not save the details.' })
    }
  }, [movie, set])

  const rows = [
    {
      key: 'poster',
      label: 'Poster image',
      tag: posterExtension(movie.poster || makePoster(movie)).toUpperCase(),
      size: 'Image',
      action: downloadPoster,
    },
    {
      key: 'details',
      label: 'Film details',
      tag: 'JSON',
      size: 'Text',
      action: downloadDetails,
    },
    {
      key: 'sample',
      label: 'Sample clip',
      tag: 'MP4',
      size: 'Placeholder',
      href: SAMPLE_CLIP.url,
      fileName: SAMPLE_CLIP.fileName,
    },
  ]

  return (
    <section className="download" aria-label={`Poster and details for ${movie.title}`}>
      <div className="download__head">
        <h3 className="download__title">Also available</h3>
        <span className="download__badge">Ready</span>
      </div>

      <ul className="download__files">
        {rows.map((row) => {
          const entry = state[row.key] ?? IDLE
          const busy = entry.status === 'downloading'
          return (
            <li className="download__file" key={row.key}>
              <div className="download__fileMeta">
                <span className="download__quality">{row.label}</span>
                <span className="download__tag">{row.tag}</span>
                <span className="download__size">{row.size}</span>
              </div>

              <div className="download__fileAction">
                {row.href ? (
                  <a className="btn btn--ghost" href={row.href} download={row.fileName}>
                    <DownloadIcon />
                    Download
                  </a>
                ) : (
                  <button type="button" className="btn btn--ghost" onClick={row.action} disabled={busy}>
                    <DownloadIcon />
                    {busy ? 'Saving\u2026' : entry.status === 'complete' ? 'Save again' : 'Download'}
                  </button>
                )}

                {!row.href && entry.status === 'complete' && (
                  <span className="download__status download__status--ok" role="status">
                    <CheckIcon size={15} />
                    Saved
                  </span>
                )}
                {!row.href && entry.status === 'error' && (
                  <span className="download__status download__status--error" role="alert">
                    Failed{entry.message ? ` - ${entry.message}` : ''}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="download__demo" role="note">
        <InfoIcon size={15} />
        <span>
          Saved straight to your device. The sample clip is a placeholder made for this demo &mdash;
          it is not the film.
        </span>
      </p>
    </section>
  )
}
