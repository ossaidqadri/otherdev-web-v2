import { VoiceRecorder } from '../voice-recorder'

describe('VoiceRecorder', () => {
  beforeEach(() => {
    // Mock MediaRecorder API
    global.MediaRecorder = jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      ondataavailable: null,
      onstop: null,
    })) as any
    global.MediaRecorder.isTypeSupported = jest.fn(() => true)
  })

  it('should create a recorder instance', async () => {
    const stream = {} as MediaStream
    const recorder = new VoiceRecorder(stream)

    expect(recorder).toBeDefined()
    expect(recorder.isRecording).toBe(false)
  })

  it('should start recording', async () => {
    const stream = {} as MediaStream
    const recorder = new VoiceRecorder(stream)

    recorder.start()

    expect(recorder.isRecording).toBe(true)
  })

  it('should stop recording and return blob', async () => {
    const stream = {} as MediaStream
    const recorder = new VoiceRecorder(stream)

    recorder.start()
    expect(recorder.isRecording).toBe(true)

    const blobPromise = recorder.stop()

    expect(recorder.isRecording).toBe(false)
    expect(blobPromise).resolves.toBeInstanceOf(Blob)
  })
})
