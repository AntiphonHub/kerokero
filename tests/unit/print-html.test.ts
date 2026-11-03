import { describe, it, expect } from 'vitest';
import { generatePrintHtml } from '@/lib/utils/print-html';
import { TableDocument } from '@/lib/appwrite/tables';

describe('Print HTML Generator', () => {
  const dummyTables: TableDocument[] = Array.from({ length: 15 }, (_, i) => ({
    $id: `t_${i + 1}`,
    establishmentId: 'est_1',
    number: i + 1,
    label: `Mesa ${String(i + 1).padStart(2, '0')}`,
    token: `token_${i + 1}`,
    status: 'idle',
    currentTotal: 0,
    isActive: true,
  })) as unknown as TableDocument[];

  const dummySvgMap = dummyTables.reduce((acc, t) => {
    acc[t.$id] = `<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#121212"/></svg>`;
    return acc;
  }, {} as Record<string, string>);

  it('generates correct number of pages without repeating tables for square layout (6 per page)', () => {
    const html = generatePrintHtml({
      tables: dummyTables,
      layout: 'square',
      bgColor: '#0000FF',
      textColor: '#FFFFFF',
      instructionText: 'Aponte a câmera',
      qrSvgMap: dummySvgMap,
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('print-color-adjust: exact');
    // 15 tables with 6 per page = 3 pages
    const pageMatches = html.match(/class="a4-page/g);
    expect(pageMatches?.length).toBe(3);

    // Mesa 01 only once
    const mesa1Matches = html.match(/Mesa 01/g);
    expect(mesa1Matches?.length).toBe(1);

    // Mesa 15 only once
    const mesa15Matches = html.match(/Mesa 15/g);
    expect(mesa15Matches?.length).toBe(1);
  });

  it('generates correct number of pages for horizontal layout (8 per page)', () => {
    const html = generatePrintHtml({
      tables: dummyTables,
      layout: 'horizontal',
      bgColor: '#0000FF',
      textColor: '#FFFFFF',
      instructionText: 'Aponte a câmera',
      qrSvgMap: dummySvgMap,
    });

    // 15 tables with 8 per page = 2 pages
    const pageMatches = html.match(/class="a4-page/g);
    expect(pageMatches?.length).toBe(2);
    expect(html).toContain('card-horizontal');
  });

  it('applies background-color and text color inline to each card', () => {
    const html = generatePrintHtml({
      tables: dummyTables.slice(0, 2),
      layout: 'square',
      bgColor: '#0000FF',
      textColor: '#FFFFFF',
      instructionText: 'Aponte a câmera',
      qrSvgMap: dummySvgMap,
    });

    expect(html).toContain('background-color: #0000FF');
    expect(html).toContain('color: #FFFFFF');
  });
});
