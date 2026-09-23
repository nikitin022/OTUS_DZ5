import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MapFiltersBar } from './MapFiltersBar';
import { EMPTY_MAP_FILTERS, hasActiveMapFilters } from '../model/mapFilters';

function renderBar(onChange = vi.fn()) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MapFiltersBar filters={EMPTY_MAP_FILTERS} onChange={onChange} />
    </QueryClientProvider>,
  );
  return onChange;
}

describe('MapFiltersBar — поиск по адресу/названию (FR-2.2)', () => {
  it('показывает поле поиска с понятной подписью', () => {
    renderBar();
    expect(screen.getByLabelText('Поиск центра по названию или адресу')).toBeInTheDocument();
  });

  it('передаёт введённый запрос в фильтры', () => {
    const onChange = renderBar();

    fireEvent.change(screen.getByLabelText('Поиск центра по названию или адресу'), {
      target: { value: 'Поликарпова' },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_MAP_FILTERS,
      search: 'Поликарпова',
    });
  });

  it('кнопка сброса появляется только при заданных фильтрах', () => {
    const { rerender } = render(<MapFiltersBar filters={EMPTY_MAP_FILTERS} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Сбросить' })).not.toBeInTheDocument();

    rerender(
      <MapFiltersBar filters={{ ...EMPTY_MAP_FILTERS, search: 'Бакинская' }} onChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Сбросить' })).toBeInTheDocument();
  });
});

describe('hasActiveMapFilters', () => {
  it('пустые фильтры не активны', () => {
    expect(hasActiveMapFilters(EMPTY_MAP_FILTERS)).toBe(false);
  });

  it('пробелы в поиске не считаются фильтром', () => {
    expect(hasActiveMapFilters({ ...EMPTY_MAP_FILTERS, search: '   ' })).toBe(false);
  });

  it('заданный поиск считается активным фильтром', () => {
    expect(hasActiveMapFilters({ ...EMPTY_MAP_FILTERS, search: 'щипок' })).toBe(true);
  });
});
