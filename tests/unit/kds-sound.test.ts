import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playKitchenChime } from '@/components/kds/kds-sound';

describe('KDS Sound Utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('safely handles environments without window/AudioContext', () => {
    expect(() => playKitchenChime()).not.toThrow();
  });

  it('triggers AudioContext oscillators when available in browser', () => {
    const mockStart = vi.fn();
    const mockStop = vi.fn();
    const mockConnect = vi.fn();
    const mockSetValueAtTime = vi.fn();
    const mockExponentialRampToValueAtTime = vi.fn();

    const mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: mockSetValueAtTime },
      connect: mockConnect,
      start: mockStart,
      stop: mockStop,
    };

    const mockGain = {
      gain: {
        setValueAtTime: mockSetValueAtTime,
        exponentialRampToValueAtTime: mockExponentialRampToValueAtTime,
      },
      connect: mockConnect,
    };

    class MockAudioContext {
      currentTime = 0;
      state = 'running';
      destination = {};
      createOscillator() {
        return mockOscillator;
      }
      createGain() {
        return mockGain;
      }
      resume() {
        return Promise.resolve();
      }
    }

    (global as any).window = {
      AudioContext: MockAudioContext,
    };

    expect(() => playKitchenChime()).not.toThrow();
    expect(mockStart).toHaveBeenCalledTimes(2);
    expect(mockStop).toHaveBeenCalledTimes(2);
  });
});
