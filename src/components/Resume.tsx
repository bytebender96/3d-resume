import { RESUME } from '../data'
import { useStore } from '../store'

export function Resume() {
  const active = useStore((s) => s.activeEntry)
  return (
    <section id="resume" className="resume">
      <div className="col">
        {/* <p className="eyebrow">Resume</p> */}
        <h2>My journey</h2>
      </div>
      {RESUME.map((e, i) => (
        <div key={i} data-entry className={`entry ${active === i ? 'is-active' : ''}`}>
          <article className="card col">
            <div className="entry-meta">
              <span className="entry-index">{e.chapter}</span>
              <span>{e.period}</span>
            </div>
            <h3>{e.title}</h3>
            <p className="org">{e.org}</p>
            <p>{e.summary}</p>
            {e.stats && (
              <dl className="stats">
                {e.stats.map((s) => (
                  <div key={s.label}><dt>{s.value}</dt><dd>{s.label}</dd></div>
                ))}
              </dl>
            )}
            <ul className="tags">{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>
          </article>
        </div>
      ))}
    </section>
  )
}
