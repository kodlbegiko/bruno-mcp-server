// In-memory mock for localStorage in Node/Vitest
const storage: Record<string, string> = {};

const mockLocalStorage: Storage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => {
    storage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key of Object.keys(storage)) {
      delete storage[key];
    }
  },
  key: (index: number) => Object.keys(storage)[index] ?? null,
  get length() {
    return Object.keys(storage).length;
  },
};

globalThis.localStorage = mockLocalStorage;

// Mock Web Audio API
if (typeof window !== 'undefined') {
  window.AudioContext = class {
    state = 'running';
    sampleRate = 44100;
    currentTime = 0;
    destination = {} as AudioDestinationNode;
    createBuffer() {
      return {
        getChannelData: () => new Float32Array(100),
      } as unknown as AudioBuffer;
    }
    createBufferSource() {
      return {
        buffer: null,
        connect: () => {},
        start: () => {},
      } as unknown as AudioBufferSourceNode;
    }
    createBiquadFilter() {
      return {
        type: 'lowpass',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
      } as unknown as BiquadFilterNode;
    }
    createGain() {
      return {
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
      } as unknown as GainNode;
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      } as unknown as OscillatorNode;
    }
    resume() {
      return Promise.resolve();
    }
  } as unknown as typeof AudioContext;
}
