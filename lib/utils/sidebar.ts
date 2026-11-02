/**
 * Retorna as 2 primeiras iniciais de um estabelecimento comercial.
 * Exemplo: "My Bar" -> "MB", "KeroKero" -> "KE", "Café & Bistrô" -> "CB"
 */
export function getEstablishmentInitials(name?: string | null): string {
  if (!name) return 'KK';

  const trimmed = name.trim();
  if (!trimmed) return 'KK';

  // Extrai palavras contendo caracteres alfanuméricos (incluindo acentuados)
  const words = trimmed
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9À-ÿ]/g, ''))
    .filter((w) => w.length > 0);

  if (words.length === 0) return 'KK';

  if (words.length === 1) {
    const single = words[0];
    return single.slice(0, 2).toUpperCase();
  }

  // Duas primeiras palavras válidas
  const first = words[0][0];
  const second = words[1][0];
  return `${first}${second}`.toUpperCase();
}

/**
 * Formata a quantidade de mesas em texto amigável.
 * Exemplo: 1 -> "1 mesa", 10 -> "10 mesas", 0 -> "0 mesas"
 */
export function formatTablesCount(count?: number | null): string {
  const safeCount = typeof count === 'number' && !Number.isNaN(count) ? count : 0;
  if (safeCount === 1) {
    return '1 mesa';
  }
  return `${safeCount} mesas`;
}

/**
 * Determina se a rota da sidebar está atualmente ativa.
 */
export function isRouteActive(pathname: string, href: string): boolean {
  if (!pathname || !href) return false;

  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
