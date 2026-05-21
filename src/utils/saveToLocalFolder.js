function sanitizeDocxName(fileName) {
  const trimmedName = (fileName || '').trim()
  const candidateName = trimmedName || 'document.docx'
  const safeName = candidateName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document.docx'

  return safeName.toLowerCase().endsWith('.docx') ? safeName : `${safeName}.docx`
}

export async function saveBlobToLocalFolder(blob, fileName) {
  const targetFileName = sanitizeDocxName(fileName)
  const response = await fetch(`/api/save-docx?fileName=${encodeURIComponent(targetFileName)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: blob,
  })

  if (!response.ok) {
    throw new Error('Could not save file to project folder')
  }

  const payload = await response.json()

  return {
    fileName: payload.fileName || targetFileName,
    folderName: payload.folderName || 'saved-docx',
  }
}
