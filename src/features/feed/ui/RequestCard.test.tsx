import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RequestCard } from './RequestCard';
import type { BloodRequest } from '../../../types';
import { SEED_CENTERS } from '../../../api/mock/data';

const request: BloodRequest = {
  id: 'r-1',
  centerId: 'c-1',
  bloodGroup: '2',
  rhFactor: '-',
  volumeMl: 900,
  urgency: 'критичная',
  collectedMl: 450,
  status: 'active',
  createdAt: '2026-03-09T10:00:00.000Z',
  updatedAt: '2026-03-09T11:30:00.000Z',
};

function renderCard() {
  return render(
    <MemoryRouter>
      <RequestCard request={request} center={SEED_CENTERS[0]} />
    </MemoryRouter>,
  );
}

describe('RequestCard', () => {
  it('показывает группу крови, срочность и объёмы', () => {
    renderCard();
    expect(screen.getByText('II (A) Rh−')).toBeInTheDocument();
    expect(screen.getByText('критичная')).toBeInTheDocument();
    expect(screen.getByText(/Нужно 900 мл|Осталось 450 мл/)).toBeInTheDocument();
  });

  it('срочность «критичная» подсвечена красным', () => {
    renderCard();
    expect(screen.getByText('критичная')).toHaveClass('bg-red-100');
  });

  it('прогресс отражает собранный объём', () => {
    renderCard();
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '450');
    expect(progress).toHaveAttribute('aria-valuemax', '900');
  });

  it('ведёт на карточку заявки (диплинк из push, FR-4.3)', () => {
    renderCard();
    const link = screen.getByRole('link', { name: 'Подробнее' });
    expect(link).toHaveAttribute('href', '/requests/r-1');
  });
});
