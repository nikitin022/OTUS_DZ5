import { describe, expect, it } from 'vitest';
import { getOpenStatus, parseInterval } from './workingHours';

/** Понедельник, 5 января 2026, 10:30 */
const MONDAY_1030 = new Date(2026, 0, 5, 10, 30);

describe('parseInterval', () => {
  it('разбирает корректный интервал', () => {
    expect(parseInterval('09:00-18:00')).toEqual({ start: 540, end: 1080 });
  });

  it('возвращает null для некорректной строки', () => {
    expect(parseInterval('круглосуточно')).toBeNull();
  });
});

describe('getOpenStatus', () => {
  it('открыто в рабочие часы', () => {
    const status = getOpenStatus({ 1: '09:00-18:00' }, MONDAY_1030);
    expect(status.isOpen).toBe(true);
    expect(status.label).toBe('Открыто сейчас');
  });

  it('закрыто до начала работы', () => {
    const status = getOpenStatus({ 1: '12:00-18:00' }, MONDAY_1030);
    expect(status.isOpen).toBe(false);
  });

  it('закрыто в день, отсутствующий в графике', () => {
    // 4 января 2026 — воскресенье (день 0), в графике только понедельник
    const sunday = new Date(2026, 0, 4, 12, 0);
    const status = getOpenStatus({ 1: '09:00-18:00' }, sunday);
    expect(status.isOpen).toBe(false);
    expect(status.label).toBe('Закрыто сегодня');
  });
});
