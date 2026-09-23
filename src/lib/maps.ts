import type { Center } from '../types';

/**
 * «Построить маршрут» (FR-2.4): внешняя карта по координатам центра.
 */
export function buildRouteUrl(center: Center): string {
  const [lat, lon] = center.coordinates;
  return `https://yandex.ru/maps/?pt=${lon},${lat}&z=16&l=map`;
}
