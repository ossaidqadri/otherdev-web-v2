/**
 * Encode image file to data URI format for Groq
 */
export async function encodeImageToBase64(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are supported')
  }

  // Read file
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  // Check size (4MB limit for base64)
  const sizeInMB = uint8Array.length / (1024 * 1024)
  if (sizeInMB > 4) {
    throw new Error(`Image exceeds 4MB base64 limit (${sizeInMB.toFixed(2)}MB)`)
  }

  // Convert to base64
  let binary = ''
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  const base64 = btoa(binary)

  // Return data URI
  return `data:${file.type};base64,${base64}`
}

/**
 * Extract text from documents and code files
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const supportedTypes = [
    'text/plain',
    'text/markdown',
    'text/css',
    'text/html',
    'application/json',
    'application/javascript',
    'text/javascript',
    'text/typescript',
    'application/typescript',
    'application/x-python',
    'text/x-python',
  ]

  // Get base MIME type (without charset)
  const baseMimeType = file.type.split(';')[0]

  // Check if type is supported
  if (!supportedTypes.includes(baseMimeType)) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }

  // Read file as text
  const text = await file.text()
  return text
}

/**
 * Validate file before processing
 */
export function validateFile(file: File, maxTotalSize: number): {
  valid: boolean
  error?: string
} {
  // Check individual file size
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'File exceeds 50MB limit' }
  }

  // Check if file type is image, document, or code
  const isImage = file.type.startsWith('image/')
  const isDocument = file.type === 'application/pdf' || file.type === 'text/plain'
  const isCode = file.type.includes('javascript') ||
                 file.type.includes('typescript') ||
                 file.type.includes('python') ||
                 file.type === 'application/json'

  if (!isImage && !isDocument && !isCode) {
    return { valid: false, error: `Unsupported file type: ${file.type}` }
  }

  return { valid: true }
}
