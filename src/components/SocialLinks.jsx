import { site } from '../data/site'
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from './icons'

const icons = {
  x: XIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
}

/** Social media links, driven by `site.social` so they stay configurable. */
export default function SocialLinks({ className = '' }) {
  return (
    <ul className={`socialLinks ${className}`.trim()} aria-label="netwebfilx on social media">
      {site.social.map((item) => {
        const Icon = icons[item.id]
        return (
          <li key={item.id}>
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={item.label}
              title={item.label}
            >
              {Icon ? <Icon /> : item.label}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
