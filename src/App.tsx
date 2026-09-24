import { useEffect } from 'react'
import { Hero } from './components/Hero'
import { Loader } from './components/Loader'
import { Nav } from './components/Nav'
import { Resume } from './components/Resume'
import { Works } from './components/Works'
import { WorkModal } from './components/WorkModal'
import { Scene } from './scene/Scene'
import { useStore } from './store'

/**
 * Maps page scroll → camera keyframe index. Each keyframe is tied to a DOM
 * element, so a resume card centred on screen = camera framing its 3D object.
 */
function useScrollCamera() {
  useEffect(() => {
    let stops: number[] = []
    let worksTop = 0

    const measure = () => {
      const vh = window.innerHeight
      const entries = [...document.querySelectorAll<HTMLElement>('[data-entry]')]
      const works = document.getElementById('works')!
      worksTop = works.offsetTop
      stops = [
        0,
        ...entries.map((el) => el.offsetTop + el.offsetHeight / 2 - vh / 2),
        worksTop - vh * 0.15,
      ]
      update()
    }

    const update = () => {
      const y = window.scrollY
      let t = stops.length - 1
      for (let k = 0; k < stops.length - 1; k++) {
        if (y < stops[k + 1]) {
          t = k + Math.max(0, (y - stops[k]) / (stops[k + 1] - stops[k]))
          break
        }
      }
      const nearest = Math.round(t)
      const active = Math.abs(t - nearest) < 0.3 && nearest >= 1 && nearest <= stops.length - 2 ? nearest - 1 : -1
      const { activeEntry, set } = useStore.getState()
      set({ camT: t, ...(active !== activeEntry && { activeEntry: active }) })

      // Darken the 3D backdrop as the works grid scrolls in
      const vh = window.innerHeight
      const d = Math.min(1, Math.max(0, (y - worksTop + vh * 0.6) / vh))
      document.documentElement.style.setProperty('--darken', String(d * 0.6))
    }

    measure()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', measure)
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', measure)
      ro.disconnect()
    }
  }, [])
}

export function App() {
  useScrollCamera()
  return (
    <>
      <Scene />
      <div className="darken" />
      <div className="grain" />
      <Nav />
      <main>
        <Hero />
        <Resume />
        <Works />
      </main>
      <WorkModal />
      <Loader />
    </>
  )
}
