import { describe, expect, it } from 'vitest';
import { isDonationIntervalMet, validateRadiusKm, validateVolumeMl } from './validation';

describe('validateRadiusKm', () => {
  it('корректный радиус', () => {
    expect(validateRadiusKm(50)).toBeNull();
    expect(validateRadiusKm(1)).toBeNull();
    expect(validateRadiusKm(500)).toBeNull();
  });

  it('нулевые и отрицательные значения', () => {
    expect(validateRadiusKm(0)).toBe('Радиус от 1 до 500 км');
    expect(validateRadiusKm(-5)).toBe('Радиус от 1 до 500 км');
  });

  it('больше максимума', () => {
    expect(validateRadiusKm(501)).toBe('Радиус от 1 до 500 км');
  });

  it('не число', () => {
    expect(validateRadiusKm(Number.NaN)).toBe('Радиус от 1 до 500 км');
  });
});

describe('isDonationIntervalMet', () => {
  const target = new Date(2026, 2, 9);

  it('без прошлых донаций интервал соблюдён', () => {
    expect(isDonationIntervalMet(null, target)).toBe(true);
  });

  it('меньше 60 дней — не соблюдён', () => {
    const last = new Date(target.getTime() - 30 * 86_400_000).toISOString();
    expect(isDonationIntervalMet(last, target)).toBe(false);
  });

  it('60 дней и больше — соблюдён', () => {
    const last = new Date(target.getTime() - 60 * 86_400_000).toISOString();
    expect(isDonationIntervalMet(last, target)).toBe(true);
  });
});

describe('validateVolumeMl', () => {
  it('корректный объём', () => {
    expect(validateVolumeMl(450)).toBeNull();
    expect(validateVolumeMl(1)).toBeNull();
  });

  it('меньше 1 мл — ошибка', () => {
    expect(validateVolumeMl(0)).toBe('Объём должен быть не менее 1 мл');
  });
});
