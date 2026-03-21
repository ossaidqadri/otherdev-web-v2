import { encodeImageToBase64, extractTextFromFile } from '../file-processor'

describe('FileProcessor', () => {
  describe('encodeImageToBase64', () => {
    it('should encode a PNG image to base64 data URI', async () => {
      // Create a simple PNG blob with minimum valid PNG structure
      const pngBuffer = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth and CRC
      ])
      const blob = new Blob([pngBuffer], { type: 'image/png' })
      const file = new File([blob], 'test.png', { type: 'image/png' })

      const result = await encodeImageToBase64(file)

      expect(result).toMatch(/^data:image\/png;base64,.+/)
      expect(result.length).toBeGreaterThan(50)
    })

    it('should throw error if file is not an image', async () => {
      const blob = new Blob(['text content'], { type: 'text/plain' })
      const file = new File([blob], 'test.txt', { type: 'text/plain' })

      await expect(encodeImageToBase64(file)).rejects.toThrow(
        'Only image files are supported'
      )
    })

    it('should throw error if base64 exceeds 4MB limit', async () => {
      // Create a 5MB mock file
      const largeBuffer = new Uint8Array(5 * 1024 * 1024)
      const blob = new Blob([largeBuffer], { type: 'image/jpeg' })
      const file = new File([blob], 'large.jpg', { type: 'image/jpeg' })

      await expect(encodeImageToBase64(file)).rejects.toThrow(
        'Image exceeds 4MB base64 limit'
      )
    })
  })

  describe('extractTextFromFile', () => {
    it('should extract text from a text file', async () => {
      const blob = new Blob(['Hello, World!'], { type: 'text/plain' })
      const file = new File([blob], 'test.txt', { type: 'text/plain' })

      const result = await extractTextFromFile(file)

      expect(result).toBe('Hello, World!')
    })

    it('should read code files as text', async () => {
      const code = 'function hello() { return "world"; }'
      const blob = new Blob([code], { type: 'text/javascript' })
      const file = new File([blob], 'script.js', { type: 'text/javascript' })

      const result = await extractTextFromFile(file)

      expect(result).toBe(code)
    })

    it('should reject unsupported file types', async () => {
      const blob = new Blob(['binary'], { type: 'application/octet-stream' })
      const file = new File([blob], 'unknown.bin', { type: 'application/octet-stream' })

      await expect(extractTextFromFile(file)).rejects.toThrow(
        'Unsupported file type'
      )
    })
  })
})
