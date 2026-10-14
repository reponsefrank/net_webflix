import { Download, Play } from 'lucide-react'

/**
 * The paired "Download" / "Watch" controls used on movie and episode rows.
 *
 * Download sits on the LEFT and Watch on the RIGHT, pushed apart by CSS
 * (`justify-content: space-between`). Both accept the same legal file URL:
 * Download is a plain `<a download>` (the browser saves the file) while Watch
 * calls `onWatch` so the parent can open the full-screen `Player`.
 *
 * Rendered only when a legal source exists - callers show the TMDB
 * `WhereToWatch` panel otherwise.
 */
export default function ActionButtons({
  downloadUrl,
  onWatch,
  downloadLabel = 'Download',
  watchLabel = 'Watch',
  className = '',
}) {
  if (!downloadUrl) return null

  return (
    <div className={`actionButtons${className ? ` ${className}` : ''}`}>
      <a
        className="btn btn--primary actionButtons__btn"
        href={downloadUrl}
        download
        rel="noreferrer"
      >
        <Download size={18} aria-hidden="true" />
        {downloadLabel}
      </a>
      <button
        type="button"
        className="btn btn--primary actionButtons__btn"
        onClick={onWatch}
      >
        <Play size={18} aria-hidden="true" />
        {watchLabel}
      </button>
    </div>
  )
}
