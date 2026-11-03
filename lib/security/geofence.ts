export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcula a distância geodésica em metros entre duas coordenadas utilizando a fórmula de Haversine.
 */
export function calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
  if (
    !coord1 ||
    !coord2 ||
    typeof coord1.latitude !== 'number' ||
    typeof coord1.longitude !== 'number' ||
    typeof coord2.latitude !== 'number' ||
    typeof coord2.longitude !== 'number' ||
    Number.isNaN(coord1.latitude) ||
    Number.isNaN(coord1.longitude) ||
    Number.isNaN(coord2.latitude) ||
    Number.isNaN(coord2.longitude)
  ) {
    return Infinity;
  }

  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Valida se o cliente está dentro do raio indoor permitido pelo estabelecimento (padrão: 250 metros).
 * Sistema 100% Indoor: Rejeita incondicionalmente acessos fora do raio ou sem coordenadas válidas.
 */
export function isWithinIndoorRadius(
  clientCoords: Coordinates | null | undefined,
  establishmentCoords: Coordinates | null | undefined,
  maxMeters: number = 250,
): boolean {
  if (!clientCoords || !establishmentCoords) {
    return false;
  }

  const distance = calculateDistanceMeters(clientCoords, establishmentCoords);
  return distance <= maxMeters;
}
