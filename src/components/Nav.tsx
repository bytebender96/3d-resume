import { PROFILE } from '../data'

export function Nav() {
  return (
    <nav className="nav">
      <a href="#top" className="nav-name">{PROFILE.name}</a>
      <div className="nav-links">
        <a href="#resume">Resume</a>
        <a href="#works">Awards</a>
        <a href={`mailto:${PROFILE.email}`}>Contact</a>
      </div>
    </nav>
  )
}
