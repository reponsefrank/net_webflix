import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DOWNLOAD_STATUS_LABELS,
  buildDownloadFileName,
  getDemoDownloadSource,
  getDownloadSource,
  isDownloadDemoEnabled,
} from '../data/downloads'
import { CheckIcon, DownloadIcon, GlobeIcon, InfoIcon } from './icons'

const IDLE = { status: 'idle', progress: null, message: null }

const STATUS_LABEL = (status) => DOWNLOAD_STATUS_LABELS[status] ?? status

/**
 * Download section for a single movie.
 *
 * The list of files (and any official provider link) comes exclusively from
 * `src/data/downloads.js`, keyed by the movie's catalogue id - it is never
 * derived from a title or guessed. When there is no authorized source the panel
 * renders an honest "Not available" state and no link, and a demo query param
 * (`?demo=download`) exposes the UI states without ever faking a file.
 */
export default function DownloadPanel({ movie, id }) {
  const demoEnabled = isDownloadDemoEnabled()

  const source = useMemo(() => {
    const real = getDownloadSource(movie)
    if (real) return real
    return demoEnabled ? getDemoDownloadSource(movie) : null
  }, [movie, demoEnabled])

  const [files, setFiles] = useState({})
  const [providerOpened, setProviderOpened] = useState(false)

  // A different film starts from a clean slate: no stale progress or errors.
  useEffect(() => {
    setFiles({})
    setProviderOpened(false)
  }, [movie.id])

  const updateFile = useCallback((index, patch) => {
    setFiles((current) => ({
      ...current,
      [index]: { ...IDLE, ...current[index], ...patch },
    }))
  }, [])

  const downloadFile = useCallback(
    async (index, file) => {
      const fileName = buildDownloadFileName(movie, file)

      // A declared-but-empty file (the demo source) must fail honestly rather
      // than pretend a download happened.
      if (!file.url) {
        updateFile(index, {
          status: 'error',
          message: 'No file is attached to this download source.',
        })
        return
      }

      updateFile(index, { status: 'downloading', progress: 0, message: null })

      try {
        const response = await fetch(file.url)
        if (!response.ok) {
          throw new Error(`The server responded with ${response.status}.`)
        }

        const total = Number(response.headers.get('content-length')) || 0
        let blob

        if (response.body && typeof response.body.getReader === 'function') {
          const reader = response.body.getReader()
          const chunks = []
          let received = 0
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            if (!value) continue
            chunks.push(value)
            received += value.byteLength
            updateFile(index, {
              status: 'downloading',
              progress: total ? received / total : null,
              message: null,
            })
          }
          blob = new Blob(chunks, {
            type: response.headers.get('content-type') || 'application/octet-stream',
          })
        } else {
          blob = await response.blob()
        }

        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = fileName
        anchor.rel = 'noopener'
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)

        updateFile(index, { status: 'complete', progress: 1, message: null })
      } catch (error) {
        updateFile(index, {
          status: 'error',
          message:
            error?.message ||
            'The download could not be completed. It may need to be opened directly.',
        })
      }
    },
    [movie, updateFile],
  )

  if (!source) {
    return (
      <section className="download" id={id} aria-label="Download">
        <div className="download__head">
          <h3 className="download__title">Download</h3>
          <span className="download__badge download__badge--muted">
            {STATUS_LABEL('unavailable')}
          </span>
        </div>
        <p className="download__empty">
          This title has no authorized download yet. When a licensed source is added it will
          appear here - this build never invents a download link.
        </p>
      </section>
    )
  }

  const list = Array.isArray(source.files) ? source.files : []
  const provider = source.provider?.url ? source.provider : null

  return (
    <section className="download" id={id} aria-label={`Download ${movie.title}`}>
      <div className="download__head">
        <h3 className="download__title">Download</h3>
        {source.demo && <span className="download__badge">Demo preview</span>}
      </div>

      {source.demo && (
        <p className="download__demo" role="note">
          <InfoIcon size={15} />
          <span>
            Demo preview: no real file is attached, so the download ends in an honest
            &ldquo;Failed&rdquo; state instead of a fake success.
          </span>
        </p>
      )}

      {provider && (
        <div className="download__provider">
          <a
            className="btn btn--ghost"
            href={provider.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => setProviderOpened(true)}
          >
            <GlobeIcon />
            Open in {provider.name}
          </a>
          {providerOpened && (
            <span className="download__status" role="status">
              {STATUS_LABEL('provider')}
            </span>
          )}
        </div>
      )}

      {list.length > 0 && (
        <ul className="download__files">
          {list.map((file, index) => {
            const entry = files[index] ?? IDLE
            const busy = entry.status === 'downloading'
            const native = Boolean(file.url) && !file.streamable
            const fileName = buildDownloadFileName(movie, file)
            const buttonLabel = downloadButtonLabel(entry, busy)

            return (
              <li className="download__file" key={`${file.quality || 'file'}-${index}`}>
                <div className="download__fileMeta">
                  <span className="download__quality">{file.quality || 'Video'}</span>
                  {file.format && <span className="download__tag">{file.format}</span>}
                  {file.size && <span className="download__size">{file.size}</span>}
                </div>

                <div className="download__fileAction">
                  {native ? (
                    <a className="btn btn--ghost" href={file.url} download={fileName}>
                      <DownloadIcon />
                      Download
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => downloadFile(index, file)}
                      disabled={busy}
                    >
                      <DownloadIcon />
                      {buttonLabel}
                    </button>
                  )}
                  <FileStatus entry={entry} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {list.length === 0 && !provider && (
        <p className="download__empty">
          No files are attached to this title&rsquo;s download source yet.
        </p>
      )}
    </section>
  )
}

function downloadButtonLabel(entry, busy) {
  if (busy) return 'Downloading\u2026'
  return entry.status === 'complete' ? 'Download again' : 'Download'
}

function FileStatus({ entry }) {
  if (!entry || entry.status === 'idle') return null

  if (entry.status === 'downloading') {
    const percent = entry.progress == null ? null : Math.round(entry.progress * 100)
    return (
      <span className="download__status" role="status">
        <span className="download__bar" aria-hidden="true">
          <span
            className="download__barFill"
            style={{ width: percent == null ? '35%' : `${percent}%` }}
          />
        </span>
        {STATUS_LABEL('downloading')}
        {percent == null ? '\u2026' : ` ${percent}%`}
      </span>
    )
  }

  if (entry.status === 'complete') {
    return (
      <span className="download__status download__status--ok" role="status">
        <CheckIcon size={15} />
        {STATUS_LABEL('complete')}
      </span>
    )
  }

  return (
    <span className="download__status download__status--error" role="alert">
      {STATUS_LABEL('error')}
      {entry.message ? ` - ${entry.message}` : ''}
    </span>
  )
}
