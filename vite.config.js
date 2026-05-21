import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const savedDocxDirectory = path.join(projectRoot, 'saved-docx')
const savedPdfDirectory = path.join(projectRoot, 'saved-pdf')

function sanitizeDocxName(fileName) {
  const baseName = path.basename(fileName || 'document.docx')
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document.docx'

  return safeBaseName.toLowerCase().endsWith('.docx') ? safeBaseName : `${safeBaseName}.docx`
}

function sanitizePdfName(fileName) {
  const baseName = path.basename(fileName || 'document.pdf')
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document.pdf'

  return safeBaseName.toLowerCase().endsWith('.pdf') ? safeBaseName : `${safeBaseName}.pdf`
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

function savePdfApiPlugin() {
  return {
    name: 'save-pdf-api',
    configureServer(server) {
      server.middlewares.use('/api/save-pdf', async (request, response, next) => {
        if (request.method !== 'POST') {
          next()
          return
        }

        try {
          const requestUrl = new URL(request.url || '/', 'http://localhost')
          const fileName = sanitizePdfName(requestUrl.searchParams.get('fileName') || '')
          const fileBuffer = await readRequestBody(request)

          if (fileBuffer.byteLength === 0) {
            response.statusCode = 400
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ message: 'File payload is empty.' }))
            return
          }

          await fs.mkdir(savedPdfDirectory, { recursive: true })
          const outputPath = path.join(savedPdfDirectory, fileName)
          await fs.writeFile(outputPath, fileBuffer)

          response.statusCode = 200
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ fileName, folderName: 'saved-pdf' }))
        } catch {
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ message: 'Failed to save PDF to project folder.' }))
        }
      })
    },
  }
}

function serveSamplePdfsPlugin() {
  const sampleFolders = ['sample-xfa', 'sample-acroform']

  return {
    name: 'serve-sample-pdfs',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = (request.url || '').split('?')[0]
        const match = pathname.match(/^\/(sample-xfa|sample-acroform)\/([^/]+)$/)

        if (!match || request.method !== 'GET') {
          next()
          return
        }

        const [, folderName, fileName] = match
        if (!sampleFolders.includes(folderName) || fileName.includes('..')) {
          response.statusCode = 400
          response.end()
          return
        }

        try {
          const filePath = path.join(projectRoot, folderName, fileName)
          const fileBuffer = await fs.readFile(filePath)

          response.statusCode = 200
          response.setHeader('Content-Type', 'application/pdf')
          response.end(fileBuffer)
        } catch {
          response.statusCode = 404
          response.end()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveDocxApiPlugin(), savePdfApiPlugin(), serveSamplePdfsPlugin()],
  server: {
    headers: {
      'Service-Worker-Allowed': '/',
    },
  },
})
