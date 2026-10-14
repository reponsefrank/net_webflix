import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scroll to the top whenever the route changes. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const id = hash.replace('#', '')

    // A hash target (e.g. the footer's /about#contact link) should be scrolled
    // into view instead. The section may render a frame or two after mount, so
    // give it a short grace period before giving up.
    if (id) {
      let frames = 0
      let raf = requestAnimationFrame(function tick() {
        const target = document.getElementById(id)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        if (frames > 30) return
        frames += 1
        raf = requestAnimationFrame(tick)
      })
      return () => cancelAnimationFrame(raf)
    }

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname, hash])

  return null
}
