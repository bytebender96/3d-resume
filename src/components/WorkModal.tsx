import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useStore } from '../store'
import { WORKS } from '../works'

export function WorkModal() {
  const slug = useStore((s) => s.openWork)
  const set = useStore((s) => s.set)
  const work = WORKS.find((w) => w.slug === slug)

  useEffect(() => {
    if (!work) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && set({ openWork: null })
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [work, set])

  return (
    <AnimatePresence>
      {work && (
        <motion.div
          className="modal-backdrop"
          onClick={() => set({ openWork: null })}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.article
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={work.title}
            style={{ '--c': work.color } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          >
            <button className="modal-close" onClick={() => set({ openWork: null })} aria-label="Close">×</button>
            <div className="work-art modal-art" />
            <p className="eyebrow">{work.year} · {work.role}</p>
            <h2>{work.title}</h2>
            <ul className="tags">{work.tags.map((t) => <li key={t}>{t}</li>)}</ul>
            <div className="prose" dangerouslySetInnerHTML={{ __html: work.html }} />
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
