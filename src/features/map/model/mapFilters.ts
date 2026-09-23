/**
 * Модель фильтров карты центров (FR-2.2). Вынесена из UI-компонента,
 * чтобы компоненты оставались «только компонентами» (правило fast-refresh).
 */

export interface MapFilters {
  /** Поиск по названию или адресу центра (FR-2.2) */
  search: string;
  onlyOpen: boolean;
  onlyUrgent: boolean;
  bloodGroup: string;
}

export const EMPTY_MAP_FILTERS: MapFilters = {
  search: '',
  onlyOpen: false,
  onlyUrgent: false,
  bloodGroup: '',
};

/** Задан ли хотя бы один фильтр карты (для пустого состояния и кнопки сброса) */
export function hasActiveMapFilters(filters: MapFilters): boolean {
  return (
    Boolean(filters.search.trim()) ||
    filters.onlyOpen ||
    filters.onlyUrgent ||
    Boolean(filters.bloodGroup)
  );
}
