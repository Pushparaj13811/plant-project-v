import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    allowedHosts: [
      '192e-2a09-bac5-3c49-11c3-00-1c5-1a.ngrok-free.app',
      '*.ngrok-free.app',  // Allow all ngrok hosts for convenience
    ],
  },
})
