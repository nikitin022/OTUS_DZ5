import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDistance,
  formatRelativeTime,
  formatVolume,
  todayIsoDate,
} from './format';

describe('formatVolume', () => {
  it('мл без изменений', () => {
    expect(formatVolume(450)).toBe('450 мл');
  });

  it('ровные литры', () => {
    expect(formatVolume(1000)).toBe('1 л');
  });

  it('дробные литры через запятую', () => {
    expect(formatVolume(1500)).toBe('1,5 л');
  });
});

describe('formatDistance', () => {
  it('меньше километра — в метрах', () => {
    expect(formatDistance(0.5)).toBe('500 м');
  });

  it('до 10 км — с десятыми', () => {
    expect(formatDistance(3.25)).toBe('3,3 км');
  });

  it('от 10 км — целыми', () => {
    expect(formatDistance(12.4)).toBe('12 км');
  });
});

describe('formatDate', () => {
  it('форматирует дату как ДД.ММ.ГГГГ', () => {
    expect(formatDate('2026-03-09T10:00:00.000Z')).toBe('09.03.2026');
  });

  it('некорректная дата — прочерк', () => {
    expect(formatDate('не дата')).toBe('—');
  });
});

describe('todayIsoDate', () => {
  it('возвращает дату в формате ГГГГ-ММ-ДД с ведущими нулями', () => {
    expect(todayIsoDate(new Date(2026, 2, 9))).toBe('2026-03-09');
  });

  it('однозначные месяцы и дни дополняются нулём', () => {
    expect(todayIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date(2026, 2, 9, 12, 0);

  it('меньше минуты — «только что»', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 30_000).toISOString(), now)).toBe(
      'только что',
    );
  });

  it('минуты назад', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60_000).toISOString(), now)).toBe(
      '5 мин назад',
    );
  });

  it('часы назад', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 3_600_000).toISOString(), now)).toBe(
      '3 ч назад',
    );
  });

  it('сутки и больше — дата', () => {
    expect(formatRelativeTime(new Date(now.getTime() - 48 * 3_600_000).toISOString(), now)).toBe(
      '07.03.2026',
    );
  });
});
