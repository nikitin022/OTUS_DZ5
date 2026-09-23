import { describe, expect, it } from 'vitest';
import { matchesSearch } from './search';

describe('matchesSearch', () => {
  it('пустой запрос пропускает любые значения', () => {
    expect(matchesSearch('', 'Центр крови')).toBe(true);
    expect(matchesSearch('   ', 'Центр крови')).toBe(true);
  });

  it('ищет без учёта регистра', () => {
    expect(matchesSearch('гаврилова', 'Центр крови им. О.К. Гаврилова')).toBe(true);
    expect(matchesSearch('ПОЛИКАРПОВА', 'ул. Поликарпова, 14')).toBe(true);
  });

  it('«ё» и «е» эквивалентны', () => {
    expect(matchesSearch('есенинский', 'Есенинский бульвар, 2')).toBe(true);
    expect(matchesSearch('ё', 'Есенинский')).toBe(true);
  });

  it('совпадение хотя бы по одному полю', () => {
    expect(matchesSearch('бакинская', 'Станция', 'ул. Бакинская, 31')).toBe(true);
    expect(matchesSearch('фмба', 'Станция', 'ул. Бакинская, 31')).toBe(false);
  });

  it('игнорирует пробелы вокруг запроса', () => {
    expect(matchesSearch('  щипок  ', 'ул. Щипок, 6')).toBe(true);
  });
});
