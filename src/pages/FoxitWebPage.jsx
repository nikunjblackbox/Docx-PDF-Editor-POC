import { useCallback, useRef, useState } from 'react'
import FoxitPDFViewer from '../components/FoxitPDFViewer'
import { exportFoxitPdfDoc, resolveFoxitPdfDoc } from '../foxit/exportPdf'
import { FOXIT_SAMPLE_PDFS } from '../foxit/samplePdfs'
import { getFoxitLicenseHint, hasFoxitLicense } from '../foxit/license'
import { savePdfToLocalFolder } from '../utils/savePdfToLocalFolder'

function FoxitWebPage() {
  const pdfuiRef = useRef(null)
  const pdfDocRef = useRef(null)
  const [fileBaseName, setFileBaseName] = useState('foxit-document')
  const [hasDocument, setHasDocument] = useState(false)
  const [status, setStatus] = useState(
    hasFoxitLicense
      ? 'Loading Foxit viewer...'
      : 'Add Foxit license keys to .env to enable this route.',
  )
  const [isBusy, setIsBusy] = useState(false)
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [error, setError] = useState('')

  const handleViewerReady = useCallback(() => {
    setIsViewerReady(true)
    setError('')
    setStatus('Viewer ready. Open a PDF file.')
  }, [])

  const handleViewerError = useCallback((message) => {
    setIsViewerReady(false)
    setError(message)
    setStatus('Viewer failed to load.')
  }, [])

  const openPdfInViewer = useCallback(async (pdfui, file) => {
    await pdfui.openPDFByFile(file, { fileName: file.name })
    pdfDocRef.current = await resolveFoxitPdfDoc(pdfui).catch(() => null)
    setFileBaseName(file.name.replace(/\.pdf$/i, '') || 'foxit-document')
    setHasDocument(true)
    setStatus(`Loaded ${file.name}`)
  }, [])

  const openSamplePdf = useCallback(
    async (sampleKey) => {
      const sample = FOXIT_SAMPLE_PDFS[sampleKey]
      const pdfui = pdfuiRef.current

      if (!pdfui || !isViewerReady) {
        setError('Foxit viewer is still loading. Wait for "Viewer ready" and try again.')
        return
      }

      setIsBusy(true)
      setError('')
      setStatus(`Loading ${sample.fileName}...`)

      try {
        const response = await fetch(sample.url)
        if (!response.ok) {
          throw new Error(`Could not load ${sample.fileName} from ${sample.url}`)
        }

        const blob = await response.blob()
        const file = new File([blob], sample.fileName, { type: 'application/pdf' })
        await openPdfInViewer(pdfui, file)
      } catch (openError) {
        pdfDocRef.current = null
        const detail =
          openError instanceof Error ? openError.message : 'Failed to open sample PDF.'
        setError(detail)
        setStatus('Load failed.')
        setHasDocument(false)
      } finally {
        setIsBusy(false)
      }
    },
    [isViewerReady, openPdfInViewer],
  )

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
    if (!pdfui || !isViewerReady) {
      setError('Foxit viewer is still loading. Wait for "Viewer ready" and try again.')
      event.target.value = ''
      return
    }

    setIsBusy(true)
    setError('')
    setStatus(`Loading ${file.name}...`)

    try {
      await openPdfInViewer(pdfui, file)
    } catch (openError) {
      pdfDocRef.current = null
      const detail =
        openError instanceof Error ? openError.message : 'Failed to open PDF.'
      setError(detail)
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

    if (!hasDocument) {
      setError('No PDF document is open.')
      return
    }

    setIsBusy(true)
    setError('')
    setStatus('Saving PDF to saved-pdf folder...')

    try {
      const downloadName = `${fileBaseName || 'foxit-document'}.pdf`
      const file = await exportFoxitPdfDoc(pdfui, downloadName, pdfDocRef.current, {
        allowBuiltinFallback: false,
      })

      if (!file) {
        throw new Error('Could not export PDF from Foxit viewer.')
      }

      const saved = await savePdfToLocalFolder(file, downloadName)
      setStatus(`Saved to ${saved.folderName}/${saved.fileName}`)
    } catch (saveError) {
      const detail =
        saveError instanceof Error ? saveError.message : 'Failed to save PDF.'
      setError(detail)
      setStatus('Save failed.')
    } finally {
      setIsBusy(false)
    }
  }

  const controlsDisabled = isBusy || !hasFoxitLicense || !isViewerReady

  return (
    <section className="page">
      <h2>Foxit Web PDF Editor</h2>
      <p className="note">
        Testing Foxit PDF SDK for Web with sample XFA/AcroForm PDFs and project-folder save.
      </p>

      {!hasFoxitLicense ? (
        <p className="error">
          Set <code>VITE_FOXIT_LICENSE_SN</code> and <code>VITE_FOXIT_LICENSE_KEY</code> in a
          <code>.env</code> file (see <code>.env.example</code>), then restart the dev server.
        </p>
      ) : (
        <p className="note">{getFoxitLicenseHint()}</p>
      )}

      <div className="controls">
        <label className="upload-label">
          <input
            type="file"
            accept=".pdf,application/pdf"
            disabled={controlsDisabled}
            onChange={handleUpload}
          />
          Open .pdf
        </label>
        <button
          type="button"
          disabled={controlsDisabled}
          onClick={() => openSamplePdf('xfa')}
        >
          Open XFA form
        </button>
        <button
          type="button"
          disabled={controlsDisabled}
          onClick={() => openSamplePdf('acroform')}
        >
          Open AcroForm
        </button>
        <button
          type="button"
          disabled={isBusy || !hasDocument || !hasFoxitLicense}
          onClick={handleSave}
        >
          Save .pdf
        </button>
      </div>

      <p className="note">
        Samples: <code>sample-xfa/ids-autoload.pdf</code>,{' '}
        <code>sample-acroform/aia000122.pdf</code>
      </p>
      <p className="note">Status: {status}</p>
      {error ? <p className="error">{error}</p> : null}

      <section className="editor-wrapper foxit-wrapper">
        {hasFoxitLicense ? (
          <FoxitPDFViewer
            ref={pdfuiRef}
            onReady={handleViewerReady}
            onError={handleViewerError}
          />
        ) : (
          <div className="empty-state">Configure Foxit license keys to load the viewer.</div>
        )}
      </section>

      <p className="note">
        Saved files are written to the project&apos;s <code>saved-pdf</code> folder (dev server
        only). License: Commercial (trial/community license from Foxit).
      </p>
    </section>
  )
}

export default FoxitWebPage
