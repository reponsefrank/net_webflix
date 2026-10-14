/**
 * Genre chips shown near the top of the homepage.
 *
 * Each chip is an anchor to the matching row's `id`, so clicking one scrolls
 * straight to that row (the rows carry `scroll-margin-top` so the fixed navbar
 * never covers the heading). Only rows that opted in with `chip: true` appear.
 */
export default function HomeChips({ rows = [] }) {
  const chips = rows.filter((row) => row.chip)
  if (!chips.length) return null

  return (
    <nav className="home-chips" aria-label="Jump to a category">
      {chips.map((row) => (
        <a key={row.key} href={`#${row.key}`} className="chip">
          {row.chipLabel}
        </a>
      ))}
    </nav>
  )
}
