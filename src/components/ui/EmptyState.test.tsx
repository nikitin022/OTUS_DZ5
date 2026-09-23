import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('отображает заголовок и описание', () => {
    render(<EmptyState title="У вас пока нет записей" description="Пояснение" />);
    expect(screen.getByRole('heading', { name: 'У вас пока нет записей' })).toBeInTheDocument();
    expect(screen.getByText('Пояснение')).toBeInTheDocument();
  });

  it('отображает действие, если оно передано', () => {
    render(
      <EmptyState
        title="Ничего не найдено"
        action={<button type="button">Сбросить фильтры</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeInTheDocument();
  });
});
