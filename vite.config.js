import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/visiosteam-web/', // Cambia según el nombre de tu repositorio
})
