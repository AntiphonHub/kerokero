import { describe, it, expect } from 'vitest';
import {
  ASAAS_SEAL_URL,
  ASAAS_REDIRECT_URL,
  ASAAS_REGULATORY_DISCLAIMER,
  getAsaasSealDimensions,
  getAsaasLinkAttributes,
} from '@/lib/config/asaas-seal';

describe('Asaas BaaS Compliance Seal Configuration & Helpers', () => {
  it('contains the official Asaas BaaS CDN URL with the provided ID', () => {
    expect(ASAAS_SEAL_URL).toBe(
      'https://baas.asaas.com/selos/Servicos_financeiros_Asaas-Reduzida-Positivo.svg?id=aaa17caf-5100-4b58-bffc-4f1fb50bd390',
    );
    expect(ASAAS_SEAL_URL).toContain('baas.asaas.com');
    expect(ASAAS_SEAL_URL).toContain('id=aaa17caf-5100-4b58-bffc-4f1fb50bd390');
  });

  it('redirects to the official Asaas domain', () => {
    expect(ASAAS_REDIRECT_URL).toBe('https://asaas.com');
  });

  it('contains mandatory legal entity reference in disclaimer according to Bacen', () => {
    expect(ASAAS_REGULATORY_DISCLAIMER).toContain(
      'ASAAS GESTÃO FINANCEIRA INSTITUIÇÃO DE PAGAMENTO S.A.',
    );
  });

  it('provides security attributes required by Playbook (target=_blank and rel=noopener noreferrer)', () => {
    const attrs = getAsaasLinkAttributes();
    expect(attrs.target).toBe('_blank');
    expect(attrs.rel).toBe('noopener noreferrer');
    expect(attrs.href).toBe('https://asaas.com');
  });

  it('computes correct dimensions preserving 160x48 aspect ratio', () => {
    const defaultDims = getAsaasSealDimensions('default');
    expect(defaultDims.width).toBe(160);
    expect(defaultDims.height).toBe(48);

    const compactDims = getAsaasSealDimensions('compact');
    expect(compactDims.width).toBe(120);
    expect(compactDims.height).toBe(36);

    const xsDims = getAsaasSealDimensions('xs');
    expect(xsDims.width).toBe(100);
    expect(xsDims.height).toBe(30);
  });
});
