import { z } from 'zod'
import { selectModel, formatMessagesForGroq, validateImageContent } from '../helpers'

describe('Model Routing and Image Content Handling', () => {
  describe('selectModel', () => {
    it('should return gpt-oss-120b for text-only messages', () => {
      const model = selectModel(false)
      expect(model).toBe('openai/gpt-oss-120b')
    })

    it('should return llama-4-scout-17b for messages with images', () => {
      const model = selectModel(true)
      expect(model).toBe('meta-llama/llama-4-scout-17b-16e-instruct')
    })

    it('should default to gpt-oss-120b when hasImageContent is undefined', () => {
      const model = selectModel(undefined as any)
      expect(model).toBe('openai/gpt-oss-120b')
    })
  })

  describe('formatMessagesForGroq', () => {
    it('should format text-only messages correctly', () => {
      const messages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there' },
      ]

      const formatted = formatMessagesForGroq(messages, false)

      expect(formatted).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ])
    })

    it('should format messages with content blocks for image-containing requests', () => {
      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'What is this?' },
            { type: 'image_url' as const, image_url: { url: 'data:image/jpeg;base64,abc123' } },
          ],
        },
      ]

      const formatted = formatMessagesForGroq(messages, true)

      expect(formatted).toHaveLength(1)
      expect(formatted[0].role).toBe('user')
      expect(Array.isArray(formatted[0].content)).toBe(true)
      if (Array.isArray(formatted[0].content)) {
        expect(formatted[0].content).toHaveLength(2)
      }
    })

    it('should handle mixed message types correctly', () => {
      const messages = [
        { role: 'user' as const, content: 'Initial question' },
        {
          role: 'assistant' as const,
          content: 'Response text',
        },
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Follow up with image' },
            { type: 'image_url' as const, image_url: { url: 'data:image/png;base64,xyz789' } },
          ],
        },
      ]

      const formatted = formatMessagesForGroq(messages, true)

      expect(formatted).toHaveLength(3)
      expect(typeof formatted[0].content).toBe('string')
      expect(typeof formatted[1].content).toBe('string')
      expect(Array.isArray(formatted[2].content)).toBe(true)
    })

    it('should preserve content blocks exactly as provided', () => {
      const contentBlocks = [
        { type: 'text' as const, text: 'Analyze this image' },
        { type: 'image_url' as const, image_url: { url: 'data:image/webp;base64,test' } },
      ]
      const messages = [
        { role: 'user' as const, content: contentBlocks },
      ]

      const formatted = formatMessagesForGroq(messages, true)

      expect(Array.isArray(formatted[0].content)).toBe(true)
      if (Array.isArray(formatted[0].content)) {
        expect(formatted[0].content).toEqual(contentBlocks)
      }
    })
  })

  describe('validateImageContent', () => {
    it('should not warn when hasImageContent is true and content contains images', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Describe' },
            { type: 'image_url' as const, image_url: { url: 'data:image/jpeg;base64,abc' } },
          ],
        },
      ]

      validateImageContent(messages, true)

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should not warn when hasImageContent is false and content is text-only', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const messages = [
        { role: 'user' as const, content: 'Just text' },
      ]

      validateImageContent(messages, false)

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should warn when hasImageContent is true but no images found', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const messages = [
        { role: 'user' as const, content: 'Text only' },
      ]

      validateImageContent(messages, true)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('hasImageContent flag is true but no images found')
      )
      consoleSpy.mockRestore()
    })

    it('should warn when hasImageContent is false but images are present', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Text' },
            { type: 'image_url' as const, image_url: { url: 'data:image/png;base64,xyz' } },
          ],
        },
      ]

      validateImageContent(messages, false)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('hasImageContent flag is false but images found')
      )
      consoleSpy.mockRestore()
    })

    it('should detect images in content blocks correctly', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'image_url' as const, image_url: { url: 'data:image/jpeg;base64,1' } },
            { type: 'image_url' as const, image_url: { url: 'data:image/png;base64,2' } },
          ],
        },
      ]

      validateImageContent(messages, true)

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Backward compatibility (no hasImageContent flag)', () => {
    it('should default to text model when hasImageContent is not provided', () => {
      const model = selectModel(undefined as any)
      expect(model).toBe('openai/gpt-oss-120b')
    })

    it('should treat undefined flag as false for message formatting', () => {
      const messages = [
        { role: 'user' as const, content: 'Hello' },
      ]

      const formatted = formatMessagesForGroq(messages, undefined as any)

      expect(typeof formatted[0].content).toBe('string')
    })
  })

  describe('Zod Schema Validation', () => {
    it('should validate MessageSchema with string content', () => {
      const MessageSchema = z.object({
        role: z.enum(['user', 'assistant']),
        content: z.union([
          z.string(),
          z.array(
            z.discriminatedUnion('type', [
              z.object({
                type: z.literal('text'),
                text: z.string(),
              }),
              z.object({
                type: z.literal('image_url'),
                image_url: z.object({
                  url: z.string().url(),
                }),
              }),
            ])
          ),
        ]),
      })

      const result = MessageSchema.safeParse({
        role: 'user',
        content: 'Hello',
      })

      expect(result.success).toBe(true)
    })

    it('should validate MessageSchema with content blocks', () => {
      const MessageSchema = z.object({
        role: z.enum(['user', 'assistant']),
        content: z.union([
          z.string(),
          z.array(
            z.discriminatedUnion('type', [
              z.object({
                type: z.literal('text'),
                text: z.string(),
              }),
              z.object({
                type: z.literal('image_url'),
                image_url: z.object({
                  url: z.string().url(),
                }),
              }),
            ])
          ),
        ]),
      })

      const result = MessageSchema.safeParse({
        role: 'user',
        content: [
          { type: 'text', text: 'What is this?' },
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,abc' } },
        ],
      })

      expect(result.success).toBe(true)
    })

    it('should validate RequestSchema with hasImageContent flag', () => {
      const TextBlock = z.object({
        type: z.literal('text'),
        text: z.string(),
      })

      const ImageBlock = z.object({
        type: z.literal('image_url'),
        image_url: z.object({
          url: z.string().url(),
        }),
      })

      const MessageSchema = z.object({
        role: z.enum(['user', 'assistant']),
        content: z.union([
          z.string(),
          z.array(z.union([TextBlock, ImageBlock])),
        ]),
      })

      const RequestSchema = z.object({
        messages: z.array(MessageSchema).min(1),
        hasImageContent: z.boolean().optional(),
      })

      const result = RequestSchema.safeParse({
        messages: [
          { role: 'user', content: 'Hello' },
        ],
        hasImageContent: false,
      })

      expect(result.success).toBe(true)
    })

    it('should validate RequestSchema without hasImageContent for backward compatibility', () => {
      const MessageSchema = z.object({
        role: z.enum(['user', 'assistant']),
        content: z.union([
          z.string(),
          z.array(z.object({
            type: z.string(),
          })),
        ]),
      })

      const RequestSchema = z.object({
        messages: z.array(MessageSchema).min(1),
        hasImageContent: z.boolean().optional(),
      })

      const result = RequestSchema.safeParse({
        messages: [
          { role: 'user', content: 'Hello' },
        ],
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid content blocks', () => {
      const MessageSchema = z.object({
        role: z.enum(['user', 'assistant']),
        content: z.union([
          z.string(),
          z.array(
            z.discriminatedUnion('type', [
              z.object({
                type: z.literal('text'),
                text: z.string(),
              }),
              z.object({
                type: z.literal('image_url'),
                image_url: z.object({
                  url: z.string().url(),
                }),
              }),
            ])
          ),
        ]),
      })

      const result = MessageSchema.safeParse({
        role: 'user',
        content: [
          { type: 'text', text: 'Valid' },
          { type: 'invalid_type', someField: 'value' },
        ],
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Message formatting edge cases', () => {
    it('should handle empty message arrays', () => {
      const messages: any[] = []
      const formatted = formatMessagesForGroq(messages, false)
      expect(formatted).toEqual([])
    })

    it('should handle messages with empty content blocks', () => {
      const messages = [
        { role: 'user' as const, content: [] },
      ]

      const formatted = formatMessagesForGroq(messages, true)

      expect(formatted[0]).toBeDefined()
      expect(Array.isArray(formatted[0].content)).toBe(true)
    })

    it('should not modify original message array', () => {
      const messages = [
        { role: 'user' as const, content: 'Original' },
      ]
      const messagesCopy = JSON.parse(JSON.stringify(messages))

      formatMessagesForGroq(messages, false)

      expect(messages).toEqual(messagesCopy)
    })
  })
})
