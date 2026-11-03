import { describe, it, expect } from 'vitest';
import { generateQrCodeSvg } from '@/lib/utils/qrcode-svg';

describe('QR Code Vector SVG Generator', () => {
  it('generates a valid SVG string for a given URL', async () => {
    const url = 'https://kerokero.app/m/abcdef1234567890abcdef1234567890abcdef1234567890';
    const svg = await generateQrCodeSvg(url, { color: { dark: '#121212', light: '#00000000' } });

    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
    expect(svg).toContain('#121212');
  });

  it('handles custom margins and sizes', async () => {
    const url = 'https://kerokero.app/m/test-token';
    const svg = await generateQrCodeSvg(url, { margin: 1, width: 200 });

    expect(svg).toContain('<svg');
  });
});
