import type { BloodGroup, Urgency } from '../../../types';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { BLOOD_GROUP_OPTIONS, URGENCY_OPTIONS } from '../../../lib/bloodGroups';

export interface FeedFilters {
  bloodGroup?: BloodGroup;
  urgency?: Urgency;
}

interface FeedFiltersBarProps {
  filters: FeedFilters;
  onChange: (filters: FeedFilters) => void;
}

/**
 * Фильтры ленты по группе крови и срочности + «Сбросить фильтры» (FR-3.2).
 */
export function FeedFiltersBar({ filters, onChange }: FeedFiltersBarProps) {
  const hasActiveFilters = Boolean(filters.bloodGroup || filters.urgency);

  return (
    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Select
        id="feed-blood-group-filter"
        name="bloodGroup"
        aria-label="Фильтр по группе крови"
        value={filters.bloodGroup ?? ''}
        onChange={(event) =>
          onChange({
            ...filters,
            bloodGroup: (event.target.value || undefined) as BloodGroup | undefined,
          })
        }
      >
        <option value="">Все группы</option>
        {BLOOD_GROUP_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select
        id="feed-urgency-filter"
        name="urgency"
        aria-label="Фильтр по срочности"
        value={filters.urgency ?? ''}
        onChange={(event) =>
          onChange({
            ...filters,
            urgency: (event.target.value || undefined) as Urgency | undefined,
          })
        }
      >
        <option value="">Любая срочность</option>
        {URGENCY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Button variant="secondary" disabled={!hasActiveFilters} onClick={() => onChange({})}>
        Сбросить фильтры
      </Button>
    </div>
  );
}
