import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const savedDocxDirectory = path.join(projectRoot, 'saved-docx')

function sanitizeDocxName(fileName) {
  const baseName = path.basename(fileName || 'document.docx')
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document.docx'

  return safeBaseName.toLowerCase().endsWith('.docx') ? safeBaseName : `${safeBaseName}.docx`
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []

    request.on('data', (chunk) => {
      chunks.push(chunk)
    })
    request.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    request.on('error', (error) => {
      reject(error)
    })
  })
}

function saveDocxApiPlugin() {
  return {
    name: 'save-docx-api',
    configureServer(server) {
      server.middlewares.use('/api/save-docx', async (request, response, next) => {
        if (request.method !== 'POST') {
          next()
          return
        }

        try {
          const requestUrl = new URL(request.url || '/', 'http://localhost')
          const fileName = sanitizeDocxName(requestUrl.searchParams.get('fileName') || '')
          const fileBuffer = await readRequestBody(request)

          if (fileBuffer.byteLength === 0) {
            response.statusCode = 400
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ message: 'File payload is empty.' }))
            return
          }

          await fs.mkdir(savedDocxDirectory, { recursive: true })
          const outputPath = path.join(savedDocxDirectory, fileName)
          await fs.writeFile(outputPath, fileBuffer)

          response.statusCode = 200
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ fileName, folderName: 'saved-docx' }))
        } catch {
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ message: 'Failed to save DOCX to project folder.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveDocxApiPlugin()],
  server: {
    headers: {
      'Service-Worker-Allowed': '/',
    },
  },
})
