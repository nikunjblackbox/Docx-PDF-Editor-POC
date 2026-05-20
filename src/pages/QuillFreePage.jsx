import { useState } from 'react'
import mammoth from 'mammoth'
import { asBlob } from 'html-docx-js-typescript'
import { saveAs } from 'file-saver'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const DEFAULT_CONTENT = '<p>Start typing, or upload a .docx file.</p>'

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link', 'blockquote'],
    ['clean'],
  ],
}

function QuillFreePage() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [fileBaseName, setFileBaseName] = useState('quill-document')
  const [status, setStatus] = useState('Ready')
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const handleUpload = async (event) => {
    const [file] = event.target.files ?? []
    if (!file) {
      return
    }

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Please choose a .docx file.')
      event.target.value = ''
      return
    }

    setError('')
    setIsBusy(true)
    setStatus(`Loading ${file.name}...`)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      setContent(result.value?.trim() || '<p>(Empty document)</p>')
      setFileBaseName(file.name.replace(/\.docx$/i, '') || 'quill-document')
      setStatus(`Loaded ${file.name}`)
    } catch {
      setError('Could not read DOCX file.')
      setStatus('Load failed')
    } finally {
      setIsBusy(false)
      event.target.value = ''
    }
  }

  const handleSave = async () => {
    setError('')
    setIsBusy(true)
    setStatus('Saving .docx...')

    try {
      const htmlDocument = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${fileBaseName}</title>
  </head>
  <body>${content || '<p></p>'}</body>
</html>`
      const blob = await asBlob(htmlDocument)
      saveAs(blob, `${fileBaseName || 'quill-document'}.docx`)
      setStatus('Saved')
    } catch {
      setError('Failed to save DOCX.')
      setStatus('Save failed')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section className="page">
      <h2>Quill Free Route (MIT)</h2>
      <p className="note">
        Completely free editor library route for POC testing.
      </p>

      <div className="controls">
        <label className="upload-label">
          <input
            type="file"
            accept=".docx"
            disabled={isBusy}
            onChange={handleUpload}
          />
          Open .docx
        </label>
        <button type="button" disabled={isBusy} onClick={handleSave}>
          Save .docx
        </button>
      </div>

      <p className="note">Status: {status}</p>
      {error ? <p className="error">{error}</p> : null}

      <div className="editor-wrapper quill-wrapper">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={quillModules}
        />
      </div>
      <p className="note">
        Note: DOCX import/export here is conversion-based and may lose advanced
        Word-only formatting.
      </p>
    </section>
  )
}

export default QuillFreePage
