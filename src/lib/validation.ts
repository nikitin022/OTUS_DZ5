/**
 * Валидации по ТЗ (разделы 4 и 6).
 * Каждая функция возвращает null, если значение корректно,
 * либо человекочитаемое сообщение об ошибке.
 */

export const MIN_SEARCH_RADIUS_KM = 1;
export const MAX_SEARCH_RADIUS_KM = 500;

/** Рекомендация Минздрава: интервал между донациями цельной крови */
export const MIN_DONATION_INTERVAL_DAYS = 60;

export const MIN_REQUEST_VOLUME_ML = 1;

/** Радиус поиска донора (FR-1.1): от 1 до 500 км */
export function validateRadiusKm(value: number): string | null {
  if (!Number.isFinite(value) || value < MIN_SEARCH_RADIUS_KM || value > MAX_SEARCH_RADIUS_KM) {
    return `Радиус от ${MIN_SEARCH_RADIUS_KM} до ${MAX_SEARCH_RADIUS_KM} км`;
  }
  return null;
}

/** Соблюдён ли интервал между донациями (FR-5.2) */
export function isDonationIntervalMet(
  lastDonationAt: string | null,
  targetDate: Date = new Date(),
  minDays: number = MIN_DONATION_INTERVAL_DAYS,
): boolean {
  if (!lastDonationAt) return true;
  const last = new Date(lastDonationAt);
  if (Number.isNaN(last.getTime())) return true;
  const diffDays = (targetDate.getTime() - last.getTime()) / 86_400_000;
  return diffDays >= minDays;
}

/** Объём заявки координатора (FR-7.1): не менее 1 мл */
export function validateVolumeMl(ml: number): string | null {
  if (!Number.isFinite(ml) || ml < MIN_REQUEST_VOLUME_ML) {
    return `Объём должен быть не менее ${MIN_REQUEST_VOLUME_ML} мл`;
  }
  return null;
}
