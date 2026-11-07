import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

// No SVG para máscara alfa (dest-in), o fundo deve ser 100% transparente (sem preenchimento)
// e os formatos visíveis devem ter fill="white" (alfa 255).
const maskSvg = Buffer.from(`
<svg width="1024" height="697" viewBox="0 0 1024 697" xmlns="http://www.w3.org/2000/svg">
  <!-- Mac Window Shape with exact rounded corners -->
  <rect x="14" y="0" width="967" height="682" rx="16" ry="16" fill="white" />
  <!-- iPhone Shape with exact rounded corners -->
  <rect x="660" y="46" width="360" height="650" rx="48" ry="48" fill="white" />
</svg>
`);

const inputPath = path.join(process.cwd(), 'public/images/mockup-hero.jpg');
const outputPath = path.join(process.cwd(), 'public/images/mockup-hero.png');

await sharp(inputPath)
  .ensureAlpha()
  .composite([{ input: maskSvg, blend: 'dest-in' }])
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

const stat = fs.statSync(outputPath);
console.log('Successfully created mockup-hero.png with true alpha, size:', stat.size);
