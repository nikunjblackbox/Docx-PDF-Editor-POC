import { useCallback, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import FoxitPDFViewer from '../components/FoxitPDFViewer'
import { hasFoxitLicense } from '../foxit/license'

function FoxitWebPage() {
  const pdfuiRef = useRef(null)
  const [fileBaseName, setFileBaseName] = useState('foxit-document')
  const [hasDocument, setHasDocument] = useState(false)
  const [status, setStatus] = useState(
    hasFoxitLicense
      ? 'Upload a PDF file to begin.'
      : 'Add Foxit license keys to .env to enable this route.',
  )
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')

  const handleViewerError = useCallback((message) => {
    setError(message)
    setStatus('Viewer failed to load.')
  }, [])

  const handleUpload = async (event) => {
    const [file] = event.target.files ?? []
    if (!file) {
      return
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a .pdf file.')
      event.target.value = ''
      return
    }

    const pdfui = pdfuiRef.current
    if (!pdfui) {
      setError('Foxit viewer is not ready yet.')
      event.target.value = ''
      return
    }

    setIsBusy(true)
    setError('')
    setStatus(`Loading ${file.name}...`)

    try {
      const buffer = await file.arrayBuffer()
      await pdfui.openPDFByFile(buffer, { fileName: file.name })
      setFileBaseName(file.name.replace(/\.pdf$/i, '') || 'foxit-document')
      setHasDocument(true)
      setStatus(`Loaded ${file.name}`)
    } catch {
      setError('Failed to open PDF.')
      setStatus('Load failed.')
      setHasDocument(false)
    } finally {
      setIsBusy(false)
      event.target.value = ''
    }
  }

  const handleSave = async () => {
    const pdfui = pdfuiRef.current
    if (!pdfui) {
      setError('Foxit viewer is not ready yet.')
      return
    }

    const pdfDoc = pdfui.getCurrentPDFDoc()
    if (!pdfDoc) {
      setError('No PDF document is open.')
      return
    }

    setIsBusy(true)
    setError('')
    setStatus('Saving PDF...')

    try {
      const file = await pdfDoc.getFile(
        { flags: 0, fileName: `${fileBaseName || 'foxit-document'}.pdf` },
        {},
      )
      saveAs(file, `${fileBaseName || 'foxit-document'}.pdf`)
      setStatus('Saved.')
    } catch {
      setError('Failed to save PDF.')
      setStatus('Save failed.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section className="page">
      <h2>Foxit Web PDF Editor</h2>
      <p className="note">
        Testing Foxit PDF SDK for Web with native PDF open/save in the browser.
      </p>

      {!hasFoxitLicense ? (
        <p className="error">
          Set <code>VITE_FOXIT_LICENSE_SN</code> and <code>VITE_FOXIT_LICENSE_KEY</code> in a
          <code>.env</code> file (see <code>.env.example</code>), then restart the dev server.
        </p>
      ) : null}

      <div className="controls">
        <label className="upload-label">
          <input
            type="file"
            accept=".pdf,application/pdf"
            disabled={isBusy || !hasFoxitLicense}
            onChange={handleUpload}
          />
          Open .pdf
        </label>
        <button
          type="button"
          disabled={isBusy || !hasDocument || !hasFoxitLicense}
          onClick={handleSave}
        >
          Save .pdf
        </button>
      </div>

      <p className="note">Status: {status}</p>
      {error ? <p className="error">{error}</p> : null}

      <section className="editor-wrapper foxit-wrapper">
        {hasFoxitLicense ? (
          <FoxitPDFViewer ref={pdfuiRef} onError={handleViewerError} />
        ) : (
          <div className="empty-state">Configure Foxit license keys to load the viewer.</div>
        )}
      </section>

      <p className="note">
        License: Commercial (trial/community license from Foxit). Requires{' '}
        <code>npm run setup:foxit</code> to copy SDK assets to <code>public/foxit-lib</code>.
      </p>
    </section>
  )
}

export default FoxitWebPage
