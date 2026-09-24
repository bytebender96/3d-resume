import { motion } from 'framer-motion'
import { CERTIFICATES, HOBBIES, PROFILE, SKILLS } from '../data'
import { useStore } from '../store'
import { WORKS } from '../works'

const reveal = (i = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, delay: (i % 2) * 0.1 },
})

export function Works() {
  const set = useStore((s) => s.set)
  return (
    <section id="works" className="works">
      <div className="works-inner">
        <p className="eyebrow">Recognition</p>
        <h2>Awards</h2>
        <div className="grid">
          {WORKS.map((w, i) => (
            <motion.button
              key={w.slug}
              className="work"
              style={{ '--c': w.color } as React.CSSProperties}
              onClick={() => set({ openWork: w.slug })}
              {...reveal(i)}
            >
              <div className="work-art"><span className="work-art-year">{w.year}</span></div>
              <div className="work-body">
                <span className="work-year">{w.role}</span>
                <h3>{w.title}</h3>
                <p>{w.excerpt}</p>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="two-col">
          <motion.div {...reveal()}>
            <p className="eyebrow">Certificates</p>
            <ul className="cert-list">
              {CERTIFICATES.map((c) => (
                <li key={c.name}>
                  <span>{c.name}</span>
                  <span className="cert-meta">{c.issuer} · {c.year}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...reveal(1)}>
            <p className="eyebrow">Skills</p>
            {SKILLS.map((g) => (
              <div key={g.group} className="skill-group">
                <h4>{g.group}</h4>
                <ul className="tags">{g.items.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            ))}
          </motion.div>
        </div>

        <footer className="footer">
          <h2>Let's work together.</h2>
          <a className="cta" href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
          <div className="links footer-links">
            {PROFILE.links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}
          </div>
          <p className="fine">{PROFILE.location} · Off the clock: {HOBBIES.join(', ').toLowerCase()} · © {new Date().getFullYear()} {PROFILE.name}</p>
        </footer>
      </div>
    </section>
  )
}
