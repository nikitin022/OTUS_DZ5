import { describe, expect, it } from 'vitest';
import { distanceKm, isWithinRadius } from './geo';

describe('distanceKm', () => {
  it('возвращает 0 для одной и той же точки', () => {
    const point: [number, number] = [55.7558, 37.6173]; // Москва
    expect(distanceKm(point, point)).toBe(0);
  });

  it('считает расстояние между Москвой и Санкт-Петербургом (~634 км)', () => {
    const moscow: [number, number] = [55.7558, 37.6173];
    const spb: [number, number] = [59.9343, 30.3351];
    const d = distanceKm(moscow, spb);
    expect(d).toBeGreaterThan(600);
    expect(d).toBeLessThan(670);
  });

  it('расстояние симметрично', () => {
    const a: [number, number] = [55.7558, 37.6173];
    const b: [number, number] = [56.8389, 60.6057]; // Екатеринбург
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 6);
  });
});

describe('isWithinRadius', () => {
  const from: [number, number] = [55.7558, 37.6173]; // Москва
  const himki: [number, number] = [55.8895, 37.4386]; // Химки (~23 км)

  it('точка в радиусе', () => {
    expect(isWithinRadius(himki, from, 50)).toBe(true);
  });

  it('точка вне радиуса', () => {
    expect(isWithinRadius(himki, from, 10)).toBe(false);
  });
});
