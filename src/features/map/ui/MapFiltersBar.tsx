import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { BLOOD_GROUP_OPTIONS } from '../../../lib/bloodGroups';
import { EMPTY_MAP_FILTERS, hasActiveMapFilters, type MapFilters } from '../model/mapFilters';

interface MapFiltersBarProps {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
}

/**
 * Фильтры карты: поиск по адресу/названию (FR-2.2),
 * «Открыто сейчас», «Есть срочные», группа крови.
 */
export function MapFiltersBar({ filters, onChange }: MapFiltersBarProps) {
  const hasFilters = hasActiveMapFilters(filters);

  return (
    <div className="mb-4 space-y-2">
      <Input
        id="map-search"
        name="search"
        type="search"
        aria-label="Поиск центра по названию или адресу"
        placeholder="Название или адрес центра"
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={filters.onlyOpen}
          onClick={() => onChange({ ...filters, onlyOpen: !filters.onlyOpen })}
          className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            filters.onlyOpen
              ? 'border-primary-700 bg-primary-700 text-white'
              : 'border-slate-300 bg-surface text-ink-600 hover:border-primary-700 hover:text-primary-700'
          }`}
        >
          Открыто сейчас
        </button>

        <button
          type="button"
          aria-pressed={filters.onlyUrgent}
          onClick={() => onChange({ ...filters, onlyUrgent: !filters.onlyUrgent })}
          className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            filters.onlyUrgent
              ? 'border-primary-700 bg-primary-700 text-white'
              : 'border-slate-300 bg-surface text-ink-600 hover:border-primary-700 hover:text-primary-700'
          }`}
        >
          Есть срочные
        </button>

        <Select
          id="map-blood-group-filter"
          name="bloodGroup"
          aria-label="Фильтр по группе крови"
          className="w-auto min-w-36"
          value={filters.bloodGroup}
          onChange={(event) => onChange({ ...filters, bloodGroup: event.target.value })}
        >
          <option value="">Все группы</option>
          {BLOOD_GROUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {hasFilters && (
          <Button variant="secondary" onClick={() => onChange({ ...EMPTY_MAP_FILTERS })}>
            Сбросить
          </Button>
        )}
      </div>
    </div>
  );
}
