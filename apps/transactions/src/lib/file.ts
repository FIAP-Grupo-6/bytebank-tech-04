const MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': 'anexo.png',
  'image/jpeg': 'anexo.jpg',
  'image/gif': 'anexo.gif',
  'image/webp': 'anexo.webp',
}

export function isDataUri(value: string): boolean {
  return value.startsWith('data:')
}

/** Apenas imagens raster (PNG/JPEG/GIF/WebP) — SVG pode conter script. */
export function isSafeImageDataUri(value: string): boolean {
  return /^data:image\/(png|jpeg|gif|webp);base64,/.test(value)
}

export function getMimeType(dataUri: string): string {
  const match = dataUri.match(/^data:(.*?);/)
  return match?.[1] ?? ''
}

export function getDownloadName(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] ?? 'anexo.img'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) { 
    return ''
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
