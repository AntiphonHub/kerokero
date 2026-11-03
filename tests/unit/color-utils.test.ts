import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex, getContrastTextColor } from '@/lib/utils/color';

describe('Color Utilities (Hex, RGB and Contrast)', () => {
  it('converts HEX to RGB correctly', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#F59E0B')).toEqual({ r: 245, g: 158, b: 11 });
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('invalid')).toBeNull();
  });

  it('converts RGB to HEX correctly', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(245, 158, 11)).toBe('#F59E0B');
  });

  it('calculates optimal contrast text color (black or white)', () => {
    expect(getContrastTextColor('#FFFFFF')).toBe('#121212');
    expect(getContrastTextColor('#F4F4F5')).toBe('#121212');
    expect(getContrastTextColor('#121212')).toBe('#FFFFFF');
    expect(getContrastTextColor('#000000')).toBe('#FFFFFF');
    expect(getContrastTextColor('#78350F')).toBe('#FFFFFF');
  });
});
