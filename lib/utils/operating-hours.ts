import type { EstablishmentDocument } from '@/lib/appwrite/establishments';

export const DAY_IDS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;
export type DayId = (typeof DAY_IDS)[number];

export const DAY_LABELS: Record<DayId, string> = {
  dom: 'Domingo',
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
};

export const SHORT_DAY_LABELS: Record<DayId, string> = {
  dom: 'Dom',
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
};

/**
 * Retorna o DayId correspondente à data informada.
 */
export function getDayId(date: Date = new Date()): DayId {
  return DAY_IDS[date.getDay()];
}

/**
 * Retorna o DayId do dia imediatamente anterior.
 */
export function getPreviousDayId(date: Date = new Date()): DayId {
  const prevIndex = (date.getDay() + 6) % 7;
  return DAY_IDS[prevIndex];
}

/**
 * Converte "HH:MM" para minutos contados desde a meia-noite (0 a 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map((part) => parseInt(part, 10) || 0);
  return hours * 60 + minutes;
}

function parseDaysArray(daysInput: unknown): string[] {
  if (!daysInput) return [];
  if (Array.isArray(daysInput)) return daysInput;
  if (typeof daysInput === 'string') {
    try {
      const parsed = JSON.parse(daysInput);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Verifica se o estabelecimento está aberto no momento atual.
 * Trata turnos normais e turnos que cruzam a meia-noite (ex: 18:00 às 02:00).
 */
export function isEstablishmentOpen(
  establishment:
    | Pick<EstablishmentDocument, 'openingDays' | 'openingTime' | 'closingTime'>
    | null
    | undefined,
  date: Date = new Date(),
): boolean {
  if (!establishment) return true;
  if (!establishment.openingTime || !establishment.closingTime) return true;

  const openingDays = parseDaysArray(establishment.openingDays);
  if (openingDays.length === 0) return true;

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const openMinutes = parseTimeToMinutes(establishment.openingTime);
  const closeMinutes = parseTimeToMinutes(establishment.closingTime);

  // Caso 1: Turno normal diurno (ex: 11:00 às 23:00)
  if (openMinutes <= closeMinutes) {
    const currentDay = getDayId(date);
    if (!openingDays.includes(currentDay)) {
      return false;
    }
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  // Caso 2: Turno noturno que cruza a meia-noite (ex: 18:00 às 02:00)
  const currentDay = getDayId(date);
  const prevDay = getPreviousDayId(date);

  // Parte A: início do turno antes da meia-noite (ex: 18:00 a 23:59)
  if (currentMinutes >= openMinutes) {
    return openingDays.includes(currentDay);
  }

  // Parte B: fim do turno após a meia-noite (ex: 00:00 a 02:00)
  if (currentMinutes <= closeMinutes) {
    return openingDays.includes(prevDay);
  }

  return false;
}

/**
 * Verifica se o Happy Hour está ativo no momento atual.
 */
export function isHappyHourActive(
  establishment:
    | Pick<
        EstablishmentDocument,
        'happyHourEnabled' | 'happyHourDays' | 'happyHourStartTime' | 'happyHourEndTime'
      >
    | null
    | undefined,
  date: Date = new Date(),
): boolean {
  if (!establishment || !establishment.happyHourEnabled) {
    return false;
  }

  if (!establishment.happyHourStartTime || !establishment.happyHourEndTime) {
    return false;
  }

  const happyDays = parseDaysArray(establishment.happyHourDays);
  if (happyDays.length === 0) {
    return false;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = parseTimeToMinutes(establishment.happyHourStartTime);
  const endMinutes = parseTimeToMinutes(establishment.happyHourEndTime);

  if (startMinutes <= endMinutes) {
    const currentDay = getDayId(date);
    if (!happyDays.includes(currentDay)) {
      return false;
    }
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  // Caso de Happy Hour que cruze a meia-noite
  const currentDay = getDayId(date);
  const prevDay = getPreviousDayId(date);

  if (currentMinutes >= startMinutes && happyDays.includes(currentDay)) {
    return true;
  }

  if (currentMinutes <= endMinutes && happyDays.includes(prevDay)) {
    return true;
  }

  return false;
}

/**
 * Retorna string descritiva legível dos horários de funcionamento do estabelecimento.
 */
export function formatOperatingHours(
  establishment:
    | Pick<EstablishmentDocument, 'openingDays' | 'openingTime' | 'closingTime'>
    | null
    | undefined,
): string {
  if (!establishment || !establishment.openingTime || !establishment.closingTime) {
    return 'Consulte os horários com o atendente.';
  }

  const days = parseDaysArray(establishment.openingDays);
  const daysStr =
    days.length === 7
      ? 'Todos os dias'
      : days.map((d) => SHORT_DAY_LABELS[d as DayId] || d).join(', ');

  return `${daysStr} • ${establishment.openingTime} às ${establishment.closingTime}`;
}
