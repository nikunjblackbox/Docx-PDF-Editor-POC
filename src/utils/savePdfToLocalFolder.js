function sanitizePdfName(fileName) {
  const trimmedName = (fileName || '').trim()
  const candidateName = trimmedName || 'document.pdf'
  const safeName = candidateName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document.pdf'

  return safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`
}

export async function savePdfToLocalFolder(blob, fileName) {
  const targetFileName = sanitizePdfName(fileName)
  const response = await fetch(`/api/save-pdf?fileName=${encodeURIComponent(targetFileName)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: blob,
  })

  if (!response.ok) {
    throw new Error('Could not save PDF to project folder')
  }

  const payload = await response.json()

  return {
    fileName: payload.fileName || targetFileName,
    folderName: payload.folderName || 'saved-pdf',
  }
}
