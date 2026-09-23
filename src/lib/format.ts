/**
 * Форматирование значений для интерфейса (русский язык, NFR-12).
 */

/** Объём: мл → литры при 1000 мл и больше (дробная часть через запятую) */
export function formatVolume(ml: number): string {
  if (ml >= 1000) {
    const litres = ml / 1000;
    const text = Number.isInteger(litres) ? String(litres) : litres.toFixed(1).replace('.', ',');
    return `${text} л`;
  }
  return `${ml} мл`;
}

/** Расстояние: меньше 1 км — в метрах, до 10 км — с десятыми */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} м`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} км`;
  return `${Math.round(km)} км`;
}

/** Сегодняшняя дата в формате ГГГГ-ММ-ДД (для атрибута min у полей даты) */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Дата в формате ДД.ММ.ГГГГ */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

/** Относительное время: «только что», «N мин назад», «N ч назад», иначе дата */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (diffMinutes < 1) return 'только что';
  if (diffMinutes < 60) return `${diffMinutes} мин назад`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;

  return formatDate(iso);
}
