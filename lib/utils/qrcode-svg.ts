import QRCode from 'qrcode';

export interface QrCodeOptions {
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Gera um SVG vetorial puro a partir de uma URL ou string.
 */
export async function generateQrCodeSvg(text: string, options?: QrCodeOptions): Promise<string> {
  const margin = options?.margin ?? 1;
  const dark = options?.color?.dark ?? '#121212';
  const light = options?.color?.light ?? '#00000000'; // Transparente por padrão
  const width = options?.width ?? 256;

  return QRCode.toString(text, {
    type: 'svg',
    margin,
    width,
    color: {
      dark,
      light,
    },
  });
}
