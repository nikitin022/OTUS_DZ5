/**
 * Поиск по тексту для интерфейса: регистронезависимый, «ё» и «е» считаются
 * эквивалентными, лишние пробелы игнорируются.
 */

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, 'е');
}

/** Совпадает ли хотя бы одно из полей с поисковой строкой */
export function matchesSearch(query: string, ...fields: Array<string | undefined>): boolean {
  const needle = normalize(query);
  if (!needle) return true;
  return fields.some((field) => normalize(field ?? '').includes(needle));
}
