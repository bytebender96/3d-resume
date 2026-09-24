import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { useStore } from '../store'
import { PROFILE } from '../data'

export function Loader() {
  const ready = useStore((s) => s.ready)
  const { progress } = useProgress()
  return (
    <AnimatePresence>
      {!ready && (
        <motion.div className="loader" exit={{ opacity: 0 }} transition={{ duration: 0.9, delay: 0.3 }}>
          <span>{PROFILE.name}</span>
          <div className="loader-bar"><div style={{ width: `${Math.max(progress, 15)}%` }} /></div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
