/**
 * Определение статуса «открыто/закрыто» центра по графику (FR-2.1).
 * График задан по дням недели: 0 = воскресенье, значение — интервал «ЧЧ:ММ-ЧЧ:ММ».
 */

export interface OpenStatus {
  isOpen: boolean;
  label: string;
}

/** Парсит интервал вида «09:00-18:00» в минуты от начала суток */
export function parseInterval(interval: string): { start: number; end: number } | null {
  const match = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(interval.trim());
  if (!match) return null;
  const [, startH, startM, endH, endM] = match;
  return {
    start: Number(startH) * 60 + Number(startM),
    end: Number(endH) * 60 + Number(endM),
  };
}

/**
 * Статус работы центра в указанный момент (по умолчанию — сейчас).
 */
export function getOpenStatus(
  workingHours: Record<number, string>,
  now: Date = new Date(),
): OpenStatus {
  const todayInterval = workingHours[now.getDay()];
  if (!todayInterval) {
    return { isOpen: false, label: 'Закрыто сегодня' };
  }

  const parsed = parseInterval(todayInterval);
  if (!parsed) {
    return { isOpen: false, label: 'Закрыто' };
  }

  const minutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = minutes >= parsed.start && minutes < parsed.end;
  return {
    isOpen,
    label: isOpen ? 'Открыто сейчас' : 'Закрыто',
  };
}
