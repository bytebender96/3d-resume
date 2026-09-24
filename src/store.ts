import { create } from 'zustand'

type State = {
  /** Camera position along SHOTS, as a float index (0 = hero, 1..N = resume entries, N+1 = works) */
  camT: number
  /** Index of the resume entry the camera is currently framing, or -1 */
  activeEntry: number
  /** Slug of the open work modal */
  openWork: string | null
  ready: boolean
  set: (p: Partial<State>) => void
}

export const useStore = create<State>((set) => ({
  camT: 0,
  activeEntry: -1,
  openWork: null,
  ready: false,
  set: (p) => set(p),
}))
