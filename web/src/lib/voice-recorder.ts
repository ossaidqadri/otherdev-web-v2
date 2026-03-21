/**
 * Browser-based audio recorder using MediaRecorder API
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder
  private audioChunks: Blob[] = []
  private resolveStop: ((blob: Blob) => void) | null = null
  private rejectStop: ((error: Error) => void) | null = null

  public isRecording = false

  constructor(stream: MediaStream) {
    // Use webm mime type if available, fall back to default
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : undefined

    this.mediaRecorder = new MediaRecorder(stream, { mimeType })
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      this.audioChunks.push(event.data)
    }

    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
      if (this.resolveStop) {
        this.resolveStop(audioBlob)
      }
      this.audioChunks = []
    }

    this.mediaRecorder.onerror = (event) => {
      if (this.rejectStop) {
        this.rejectStop(new Error(`Recording error: ${event.error}`))
      }
    }
  }

  public start(): void {
    if (this.isRecording) {
      console.warn('Recording already in progress')
      return
    }

    this.audioChunks = []
    this.mediaRecorder.start()
    this.isRecording = true
  }

  public stop(): Promise<Blob> {
    if (!this.isRecording) {
      return Promise.reject(new Error('No recording in progress'))
    }

    return new Promise((resolve, reject) => {
      this.resolveStop = resolve
      this.rejectStop = reject
      this.mediaRecorder.stop()
      this.isRecording = false
    })
  }

  public static async requestMicrophone(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied')
        }
        if (error.name === 'NotFoundError') {
          throw new Error('No microphone device found')
        }
      }
      throw error
    }
  }
}
