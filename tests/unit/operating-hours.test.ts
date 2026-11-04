import { describe, it, expect } from 'vitest';
import {
  isEstablishmentOpen,
  isHappyHourActive,
  formatOperatingHours,
  parseTimeToMinutes,
  getDayId,
} from '@/lib/utils/operating-hours';
import type { EstablishmentDocument } from '@/lib/appwrite/establishments';

describe('Operating Hours & Happy Hour Utils', () => {
  describe('parseTimeToMinutes', () => {
    it('correctly converts HH:MM strings to minutes from midnight', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('01:30')).toBe(90);
      expect(parseTimeToMinutes('18:00')).toBe(1080);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('isEstablishmentOpen', () => {
    it('returns true if establishment has no hours configured', () => {
      expect(isEstablishmentOpen(null)).toBe(true);
      expect(isEstablishmentOpen({} as any)).toBe(true);
    });

    it('correctly validates daytime schedule (e.g., Ter-Dom 11:00 às 22:00)', () => {
      const est = {
        openingDays: JSON.stringify(['ter', 'qua', 'qui', 'sex', 'sab', 'dom']),
        openingTime: '11:00',
        closingTime: '22:00',
      } as EstablishmentDocument;

      // Terça-feira (2026-11-03) às 15:00 -> Aberto
      const tuesdayAfternoon = new Date('2026-11-03T15:00:00');
      expect(isEstablishmentOpen(est, tuesdayAfternoon)).toBe(true);

      // Terça-feira às 10:30 -> Fechado (antes de abrir)
      const tuesdayMorning = new Date('2026-11-03T10:30:00');
      expect(isEstablishmentOpen(est, tuesdayMorning)).toBe(false);

      // Terça-feira às 22:30 -> Fechado (após fechar)
      const tuesdayLate = new Date('2026-11-03T22:30:00');
      expect(isEstablishmentOpen(est, tuesdayLate)).toBe(false);

      // Segunda-feira (2026-11-02) às 15:00 -> Fechado (dia de folga)
      const monday = new Date('2026-11-02T15:00:00');
      expect(isEstablishmentOpen(est, monday)).toBe(false);
    });

    it('correctly validates night schedule crossing midnight (e.g., Sex e Sab 18:00 às 02:00)', () => {
      const est = {
        openingDays: JSON.stringify(['sex', 'sab']),
        openingTime: '18:00',
        closingTime: '02:00',
      } as EstablishmentDocument;

      // Sexta-feira (2026-11-06) às 23:30 -> Aberto
      const fridayNight = new Date('2026-11-06T23:30:00');
      expect(isEstablishmentOpen(est, fridayNight)).toBe(true);

      // Sábado de madrugada (2026-11-07) às 01:15 -> Aberto (turno de sexta que virou a noite)
      const saturdayDawn = new Date('2026-11-07T01:15:00');
      expect(isEstablishmentOpen(est, saturdayDawn)).toBe(true);

      // Sábado de madrugada às 02:30 -> Fechado (já passou das 02:00)
      const saturdayTooLate = new Date('2026-11-07T02:30:00');
      expect(isEstablishmentOpen(est, saturdayTooLate)).toBe(false);

      // Domingo de madrugada (2026-11-08) às 01:00 -> Aberto (turno de sábado)
      const sundayDawn = new Date('2026-11-08T01:00:00');
      expect(isEstablishmentOpen(est, sundayDawn)).toBe(true);

      // Segunda de madrugada (2026-11-09) às 01:00 -> Fechado (domingo não abre)
      const mondayDawn = new Date('2026-11-09T01:00:00');
      expect(isEstablishmentOpen(est, mondayDawn)).toBe(false);
    });
  });

  describe('isHappyHourActive', () => {
    it('returns false if happyHourEnabled is false or missing', () => {
      expect(isHappyHourActive(null)).toBe(false);
      expect(isHappyHourActive({ happyHourEnabled: false } as any)).toBe(false);
    });

    it('returns true when current day and time are within happy hour window', () => {
      const est = {
        happyHourEnabled: true,
        happyHourDays: JSON.stringify(['qua', 'qui', 'sex']),
        happyHourStartTime: '17:00',
        happyHourEndTime: '20:00',
      } as EstablishmentDocument;

      // Quarta-feira (2026-11-04) às 18:30 -> Ativo
      const wednesdayHappy = new Date('2026-11-04T18:30:00');
      expect(isHappyHourActive(est, wednesdayHappy)).toBe(true);

      // Quarta-feira às 16:50 -> Inativo (antes)
      const wednesdayBefore = new Date('2026-11-04T16:50:00');
      expect(isHappyHourActive(est, wednesdayBefore)).toBe(false);

      // Quarta-feira às 20:10 -> Inativo (depois)
      const wednesdayAfter = new Date('2026-11-04T20:10:00');
      expect(isHappyHourActive(est, wednesdayAfter)).toBe(false);

      // Terça-feira (2026-11-03) às 18:30 -> Inativo (dia não configurado)
      const tuesday = new Date('2026-11-03T18:30:00');
      expect(isHappyHourActive(est, tuesday)).toBe(false);
    });
  });

  describe('formatOperatingHours', () => {
    it('formats days and hours into readable string', () => {
      const est = {
        openingDays: JSON.stringify(['ter', 'qua', 'qui', 'sex', 'sab', 'dom']),
        openingTime: '18:00',
        closingTime: '23:30',
      } as EstablishmentDocument;

      const formatted = formatOperatingHours(est);
      expect(formatted).toContain('18:00');
      expect(formatted).toContain('23:30');
    });
  });
});
