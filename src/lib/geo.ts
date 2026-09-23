/**
 * Геолокационные утилиты (FR-2: расстояние до центра, фильтр по радиусу донора).
 */

/** Радиус Земли, км */
const EARTH_RADIUS_KM = 6371;

/** Дефолтная точка (центр города), когда геолокация недоступна */
export const DEFAULT_CITY_CENTER: [number, number] = [55.7558, 37.6173];

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Расстояние между двумя точками [широта, долгота] в км (формула haversine).
 */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Находится ли точка в заданном радиусе от исходной точки */
export function isWithinRadius(
  point: [number, number],
  from: [number, number],
  radiusKm: number,
): boolean {
  return distanceKm(from, point) <= radiusKm;
}
