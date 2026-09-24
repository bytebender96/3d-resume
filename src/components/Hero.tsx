import { motion } from 'framer-motion'
import { PROFILE } from '../data'
import { useStore } from '../store'

export function Hero() {
  const ready = useStore((s) => s.ready)
  const show = (d: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: ready ? { opacity: 1, y: 0 } : {},
    transition: { duration: 1, delay: 0.6 + d, ease: [0.2, 0.7, 0.2, 1] },
  })
  return (
    <section id="top" className="hero">
      <div className="col">
        <motion.p className="eyebrow" {...show(0)}>{PROFILE.role} · {PROFILE.location}</motion.p>
        <motion.h1 {...show(0.1)}>Hi, I'm <em>{PROFILE.name.split(' ')[0]}</em>.</motion.h1>
        <motion.p className="lead" {...show(0.2)}>{PROFILE.tagline}</motion.p>
        <motion.div className="links" {...show(0.3)}>
          {PROFILE.links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}
        </motion.div>
      </div>
      <motion.div className="scroll-hint" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: 1.6 }}>
        Scroll <span>↓</span>
      </motion.div>
    </section>
  )
}
