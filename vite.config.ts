import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Keep asset URLs portable between the local preview and GitHub Pages.
  base: './',
})
