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
    port: 5173,
    strictPort: true,
    hmr: {
      // Attempt to use the client's public address for HMR
      clientPort: 443,
      // Use WSS if using HTTPS for ngrok
      protocol: 'wss'
    },
    allowedHosts: [
      '192e-2a09-bac5-3c49-11c3-00-1c5-1a.ngrok-free.app',
      'adda-2a09-bac5-3c49-11c3-00-1c5-1a.ngrok-free.app',
      '*.ngrok-free.app',  // Allow all ngrok hosts for convenience
    ],
  },
})
