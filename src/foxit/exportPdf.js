function hasGetFile(pdfDoc) {
  return pdfDoc != null && typeof pdfDoc.getFile === 'function'
}

/** Resolve the real Foxit PDFDoc instance (supports getFile). */
export async function resolveFoxitPdfDoc(pdfui, storedPdfDoc = null) {
  if (hasGetFile(storedPdfDoc)) {
    return storedPdfDoc
  }

  if (typeof pdfui?.waitForInitialization === 'function') {
    await pdfui.waitForInitialization()
  }

  const current = pdfui?.getCurrentPDFDoc?.()
  if (hasGetFile(current)) {
    return current
  }

  if (typeof pdfui?.getPDFViewer === 'function') {
    const viewer = await pdfui.getPDFViewer()
    const fromViewer = viewer?.getCurrentPDFDoc?.() ?? viewer?.getPDFDoc?.()
    if (hasGetFile(fromViewer)) {
      return fromViewer
    }
  }

  throw new Error('Could not resolve Foxit PDFDoc with export API.')
}

/** Use Foxit toolbar download (same as built-in Download button). */
export async function triggerFoxitBuiltinDownload(pdfui) {
  if (typeof pdfui?.waitForInitialization === 'function') {
    await pdfui.waitForInitialization()
  }

  const component = await pdfui.getComponentByName('download-file-button')
  if (!component?.controller?.handle) {
    throw new Error('Foxit download control is not available in the viewer UI.')
  }

  component.controller.handle()
}

/**
 * Export PDF for download. Returns a File when using getFile API,
 * or null when the built-in Foxit download dialog was triggered instead.
 */
export async function exportFoxitPdfDoc(pdfui, fileName, storedPdfDoc = null) {
  const safeName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`

  try {
    const pdfDoc = await resolveFoxitPdfDoc(pdfui, storedPdfDoc)
    return pdfDoc.getFile({
      flags: 0,
      fileName: safeName,
      progressHandler: () => {},
    })
  } catch {
    await triggerFoxitBuiltinDownload(pdfui)
    return null
  }
}
