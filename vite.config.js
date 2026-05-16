import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'

const SLICE_ROOTS = {
  ldct: path.resolve(__dirname, '1_Low_Dose_Input'),
  pred: path.resolve(__dirname, '2_Model_Prediction'),
  fdct: path.resolve(__dirname, '3_Full_Dose_Target'),
}

function sliceServer() {
  return {
    name: 'docapp-slice-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url && req.url.match(/^\/(?:DOCAPP\/)?slices\/(ldct|pred|fdct)\/([A-Za-z0-9_\-]+\.png)(?:\?.*)?$/)
        if (!m) return next()
        const root = SLICE_ROOTS[m[1]]
        const file = path.join(root, m[2])
        if (!file.startsWith(root) || !fs.existsSync(file)) {
          res.statusCode = 404
          return res.end('not found')
        }
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  base: '/DOCAPP/',
  plugins: [
    tailwindcss(),
    react(),
    sliceServer(),
  ],
})
