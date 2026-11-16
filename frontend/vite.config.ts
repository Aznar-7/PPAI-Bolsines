/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // En desarrollo, Vite (5173) le pasa /api a Spring (8080): mismo origen, la cookie de sesion viaja sola.
  server: { proxy: { '/api': 'http://localhost:8080' } },
  // El build queda dentro del jar de Spring como recurso estatico.
  build: { outDir: '../target/classes/static', emptyOutDir: true },
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', css: false },
})
