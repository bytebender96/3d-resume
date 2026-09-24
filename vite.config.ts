import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so `dist/` can be hosted from any subdirectory (GitHub Pages etc.)
export default defineConfig({ base: './', plugins: [react()] })
